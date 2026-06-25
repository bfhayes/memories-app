import { SignJWT, jwtVerify } from 'jose';

const COOKIE = 'mem_access';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

/** Hash a Memory password with the app secret as salt. Returns hex. */
export async function hashPassword(password: string, secret: string): Promise<string> {
  const data = new TextEncoder().encode(`${secret}:${password.trim()}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(
  password: string,
  hash: string,
  secret: string,
): Promise<boolean> {
  const candidate = await hashPassword(password, secret);
  // Length-equal, content-compared — inputs are server-controlled hex of fixed length.
  if (candidate.length !== hash.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i++) diff |= candidate.charCodeAt(i) ^ hash.charCodeAt(i);
  return diff === 0;
}

/** Read the unlocked-memory ids from the signed access cookie. Never throws. */
export async function readUnlocked(request: Request, secret: string): Promise<number[]> {
  const token = parseCookie(request.headers.get('Cookie'), COOKIE);
  if (!token) return [];
  try {
    const { payload } = await jwtVerify(token, secretKey(secret));
    const mem = payload.mem;
    return Array.isArray(mem) ? mem.filter((n): n is number => typeof n === 'number') : [];
  } catch {
    return [];
  }
}

/** Whether the request arrived over HTTPS (so we only set Secure where it's valid). */
export function isSecure(request: Request): boolean {
  if (request.headers.get('x-forwarded-proto') === 'https') return true;
  try { return new URL(request.url).protocol === 'https:'; } catch { return false; }
}

/** Build a Set-Cookie header granting access to the given memory ids. */
export async function accessCookie(memoryIds: number[], secret: string, secure: boolean): Promise<string> {
  const unique = [...new Set(memoryIds)].filter((n) => Number.isInteger(n));
  const token = await new SignJWT({ mem: unique })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey(secret));
  return `${COOKIE}=${token}; HttpOnly;${secure ? ' Secure;' : ''} SameSite=Lax; Path=/; Max-Age=${MAX_AGE}`;
}

function parseCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}
