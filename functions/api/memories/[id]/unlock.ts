import { first } from '../../../lib/db';
import { parseJsonBody, jsonNoStore } from '../../../lib/request';
import { verifyPassword, accessCookie, isSecure } from '../../../lib/auth';
import type { CFContext } from '../../../lib/env';

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

  const ok = await verifyPassword(password, m.password_hash, context.env.AUTH_SECRET);
  if (!ok) return jsonNoStore({ error: 'That password doesn’t match' }, { status: 401 });

  const cookie = await accessCookie([...context.data.unlockedMemories, id], context.env.AUTH_SECRET, isSecure(context.request));
  return jsonNoStore({ ok: true }, { headers: { 'Set-Cookie': cookie } });
};
