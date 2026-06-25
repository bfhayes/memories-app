import { first, run, nowIso } from '../../../lib/db';
import { parseJsonBody, jsonNoStore } from '../../../lib/request';
import { requireMemoryAccess, getCaller } from '../../../lib/guard';
import { logActivity, touchContributor } from '../../../lib/util';
import type { CFContext } from '../../../lib/env';

async function photoMemory(db: D1Database, photoId: number): Promise<number | null> {
  const r = await first<{ memory_id: number }>(db, 'SELECT memory_id FROM photos WHERE id = ?', photoId);
  return r?.memory_id ?? null;
}

// POST /api/photos/:id/tags  { tag }
export const onRequestPost = async (context: CFContext): Promise<Response> => {
  const photoId = parseInt(context.params.id as string, 10);
  if (isNaN(photoId)) return jsonNoStore({ error: 'Invalid id' }, { status: 400 });
  const memoryId = await photoMemory(context.env.DB, photoId);
  if (memoryId === null) return jsonNoStore({ error: 'Not found' }, { status: 404 });
  const denied = requireMemoryAccess(context, memoryId);
  if (denied) return denied;

  const body = await parseJsonBody(context.request);
  if (body instanceof Response) return body;
  const tag = String(body.tag ?? '').trim();
  if (!tag) return jsonNoStore({ error: 'A tag is required' }, { status: 400 });

  await run(
    context.env.DB,
    'INSERT OR IGNORE INTO photo_tags (photo_id, tag, created_at) VALUES (?, ?, ?)',
    photoId,
    tag,
    nowIso(),
  );
  const caller = await getCaller(context, memoryId);
  await logActivity(context.env.DB, { memoryId, photoId, caller, action: 'added_tag', detail: `added the tag “${tag}”` });
  if (caller) await touchContributor(context.env.DB, caller.id);
  return jsonNoStore({ tag }, { status: 201 });
};

// DELETE /api/photos/:id/tags  { tag }
export const onRequestDelete = async (context: CFContext): Promise<Response> => {
  const photoId = parseInt(context.params.id as string, 10);
  if (isNaN(photoId)) return jsonNoStore({ error: 'Invalid id' }, { status: 400 });
  const memoryId = await photoMemory(context.env.DB, photoId);
  if (memoryId === null) return jsonNoStore({ error: 'Not found' }, { status: 404 });
  const denied = requireMemoryAccess(context, memoryId);
  if (denied) return denied;

  const body = await parseJsonBody(context.request);
  if (body instanceof Response) return body;
  const tag = String(body.tag ?? '').trim();
  if (!tag) return jsonNoStore({ error: 'A tag is required' }, { status: 400 });

  await run(context.env.DB, 'DELETE FROM photo_tags WHERE photo_id = ? AND tag = ?', photoId, tag);
  return jsonNoStore({ ok: true });
};
