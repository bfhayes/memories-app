import { first, run, nowIso } from '../../../lib/db';
import { jsonNoStore } from '../../../lib/request';
import { requireMemoryAccess, getCaller } from '../../../lib/guard';
import { logActivity, touchContributor } from '../../../lib/util';
import type { CFContext } from '../../../lib/env';

async function photoMemory(db: D1Database, photoId: number): Promise<number | null> {
  const r = await first<{ memory_id: number }>(db, 'SELECT memory_id FROM photos WHERE id = ?', photoId);
  return r?.memory_id ?? null;
}

// POST /api/photos/:id/restore — undo a soft delete (clear `deleted_at`).
export const onRequestPost = async (context: CFContext): Promise<Response> => {
  const photoId = parseInt(context.params.id as string, 10);
  if (isNaN(photoId)) return jsonNoStore({ error: 'Invalid id' }, { status: 400 });
  const memoryId = await photoMemory(context.env.DB, photoId);
  if (memoryId === null) return jsonNoStore({ error: 'Not found' }, { status: 404 });
  const denied = requireMemoryAccess(context, memoryId);
  if (denied) return denied;

  const db = context.env.DB;
  await run(db, 'UPDATE photos SET deleted_at=NULL, updated_at=? WHERE id=?', nowIso(), photoId);

  const caller = await getCaller(context, memoryId);
  await logActivity(db, { memoryId, photoId, caller, action: 'restored', detail: 'restored this photo' });
  if (caller) await touchContributor(db, caller.id);

  return jsonNoStore({ ok: true, id: photoId });
};
