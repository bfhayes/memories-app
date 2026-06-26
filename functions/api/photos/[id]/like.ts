import { first, run, nowIso } from '../../../lib/db';
import { jsonNoStore } from '../../../lib/request';
import { requireMemoryAccess, getCaller } from '../../../lib/guard';
import { logActivity, touchContributor } from '../../../lib/util';
import type { CFContext } from '../../../lib/env';

async function photoMemory(db: D1Database, photoId: number): Promise<number | null> {
  const r = await first<{ memory_id: number }>(db, 'SELECT memory_id FROM photos WHERE id = ?', photoId);
  return r?.memory_id ?? null;
}

async function counts(db: D1Database, photoId: number, contributorId: number) {
  const c = await first<{ n: number }>(db, 'SELECT COUNT(*) AS n FROM photo_likes WHERE photo_id = ?', photoId);
  const mine = await first<{ n: number }>(
    db, 'SELECT COUNT(*) AS n FROM photo_likes WHERE photo_id = ? AND contributor_id = ?', photoId, contributorId,
  );
  return { likeCount: c?.n ?? 0, likedByMe: (mine?.n ?? 0) > 0 };
}

// POST /api/photos/:id/like — the signed-in contributor loves this photo (idempotent).
export const onRequestPost = async (context: CFContext): Promise<Response> => {
  const photoId = parseInt(context.params.id as string, 10);
  if (isNaN(photoId)) return jsonNoStore({ error: 'Invalid id' }, { status: 400 });
  const memoryId = await photoMemory(context.env.DB, photoId);
  if (memoryId === null) return jsonNoStore({ error: 'Not found' }, { status: 404 });
  const denied = requireMemoryAccess(context, memoryId);
  if (denied) return denied;

  const caller = await getCaller(context, memoryId);
  if (!caller) return jsonNoStore({ error: 'Pick your name first' }, { status: 400 });

  const res = await run(
    context.env.DB,
    'INSERT OR IGNORE INTO photo_likes (photo_id, contributor_id, created_at) VALUES (?, ?, ?)',
    photoId, caller.id, nowIso(),
  );
  if (res.meta.changes > 0) {
    await logActivity(context.env.DB, { memoryId, photoId, caller, action: 'liked', detail: 'loved this photo' });
    await touchContributor(context.env.DB, caller.id);
  }
  return jsonNoStore(await counts(context.env.DB, photoId, caller.id));
};

// DELETE /api/photos/:id/like — remove the contributor's love.
export const onRequestDelete = async (context: CFContext): Promise<Response> => {
  const photoId = parseInt(context.params.id as string, 10);
  if (isNaN(photoId)) return jsonNoStore({ error: 'Invalid id' }, { status: 400 });
  const memoryId = await photoMemory(context.env.DB, photoId);
  if (memoryId === null) return jsonNoStore({ error: 'Not found' }, { status: 404 });
  const denied = requireMemoryAccess(context, memoryId);
  if (denied) return denied;

  const caller = await getCaller(context, memoryId);
  if (!caller) return jsonNoStore({ error: 'Pick your name first' }, { status: 400 });

  await run(context.env.DB, 'DELETE FROM photo_likes WHERE photo_id = ? AND contributor_id = ?', photoId, caller.id);
  return jsonNoStore(await counts(context.env.DB, photoId, caller.id));
};
