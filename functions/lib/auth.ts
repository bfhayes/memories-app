import { SignJWT, jwtVerify } from 'jose';

const COOKIE = 'mem_access';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

// Forgiving normalization so "Uncle Jeff", "uncle jeff" and "unclejeff" all match: lowercase and
// drop all whitespace. Friendlier for non-technical family typing a texted password.
function normalizePassword(p: string): string {
  return p.toLowerCase().replace(/\s+/g, '');
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Hash a Memory password (normalized) with the app secret as salt. Returns hex. */
export async function hashPassword(password: string, secret: string): Promise<string> {
  return sha256Hex(`${secret}:${normalizePassword(password)}`);
}

/** The old hash scheme (trim only) — kept so existing passwords still unlock and can be upgraded. */
async function hashPasswordLegacy(password: string, secret: string): Promise<string> {
  return sha256Hex(`${secret}:${password.trim()}`);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Verify a password against a stored hash. `rehash` is true when it only matched the OLD (trim-only)
 * scheme — the caller should re-store `hashPassword(password)` so future case/space variants work.
 */
export async function verifyPassword(
  password: string,
  hash: string,
  secret: string,
): Promise<{ ok: boolean; rehash: boolean }> {
  if (timingSafeEqualHex(await hashPassword(password, secret), hash)) return { ok: true, rehash: false };
  if (timingSafeEqualHex(await hashPasswordLegacy(password, secret), hash)) return { ok: true, rehash: true };
  return { ok: false, rehash: false };
}

/** Read the unlocked-memory ids from the signed access cookie. Never throws. */
export async function readUnlocked(request: Request, secret: string): Promise<number[]> {
  const token = parseCookie(request.headers.get('Cookie'), COOKIE);
  if (!token) return [];
  try {
    const { payload } = await jwtVerify(token, secretKey(secret), { algorithms: ['HS256'] });
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
