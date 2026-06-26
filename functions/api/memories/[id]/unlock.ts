import { first, run, nowIso } from '../../../lib/db';
import { parseJsonBody, jsonNoStore } from '../../../lib/request';
import { verifyPassword, hashPassword, accessCookie, isSecure } from '../../../lib/auth';
import type { CFContext } from '../../../lib/env';

const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// POST /api/memories/:id/unlock — check the shared password; on success set the access cookie.
export const onRequestPost = async (context: CFContext): Promise<Response> => {
  const id = parseInt(context.params.id as string, 10);
  if (isNaN(id)) return jsonNoStore({ error: 'Invalid id' }, { status: 400 });

  const body = await parseJsonBody(context.request);
  if (body instanceof Response) return body;
  const password = String(body.password ?? '');

  const m = await first<{ password_hash: string }>(
    context.env.DB,
    'SELECT password_hash FROM memories WHERE id = ?',
    id,
  );
  if (!m) return jsonNoStore({ error: 'Not found' }, { status: 404 });

  const ip = context.request.headers.get('CF-Connecting-IP') || 'unknown';
  const cutoff = new Date(Date.now() - WINDOW_MS).toISOString();

  // Opportunistically clear stale attempts, then count what remains in the window.
  await run(
    context.env.DB,
    'DELETE FROM unlock_attempts WHERE memory_id = ? AND ip = ? AND created_at < ?',
    id,
    ip,
    cutoff,
  );
  const counted = await first<{ n: number }>(
    context.env.DB,
    'SELECT COUNT(*) AS n FROM unlock_attempts WHERE memory_id = ? AND ip = ?',
    id,
    ip,
  );
  if ((counted?.n ?? 0) >= MAX_ATTEMPTS) {
    return jsonNoStore(
      { error: 'Too many tries — please wait a few minutes and try again.' },
      { status: 429, headers: { 'Retry-After': '900' } },
    );
  }

  const result = await verifyPassword(password, m.password_hash, context.env.AUTH_SECRET);
  if (!result.ok) {
    await run(
      context.env.DB,
      'INSERT INTO unlock_attempts (memory_id, ip, created_at) VALUES (?, ?, ?)',
      id,
      ip,
      nowIso(),
    );
    return jsonNoStore({ error: 'That password doesn’t match' }, { status: 401 });
  }

  // Upgrade an old-scheme hash so case/space variants work from now on.
  if (result.rehash) {
    await run(
      context.env.DB,
      'UPDATE memories SET password_hash = ?, updated_at = ? WHERE id = ?',
      await hashPassword(password, context.env.AUTH_SECRET),
      nowIso(),
      id,
    );
  }

  // Correct password — clear any recorded attempts for this (memory, ip).
  await run(
    context.env.DB,
    'DELETE FROM unlock_attempts WHERE memory_id = ? AND ip = ?',
    id,
    ip,
  );

  const cookie = await accessCookie([...context.data.unlockedMemories, id], context.env.AUTH_SECRET, isSecure(context.request));
  return jsonNoStore({ ok: true }, { headers: { 'Set-Cookie': cookie } });
};
