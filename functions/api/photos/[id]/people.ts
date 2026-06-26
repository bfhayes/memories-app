import { first, run, nowIso } from '../../../lib/db';
import { parseJsonBody, jsonNoStore } from '../../../lib/request';
import { requireMemoryAccess, getCaller } from '../../../lib/guard';
import { logActivity, touchContributor, pickColor, AVATAR_COLORS } from '../../../lib/util';
import type { CFContext } from '../../../lib/env';

async function photoMemory(db: D1Database, photoId: number): Promise<number | null> {
  const r = await first<{ memory_id: number }>(db, 'SELECT memory_id FROM photos WHERE id = ?', photoId);
  return r?.memory_id ?? null;
}

// POST /api/photos/:id/people  { name }  — tag a person (creating the person if new).
export const onRequestPost = async (context: CFContext): Promise<Response> => {
  const photoId = parseInt(context.params.id as string, 10);
  if (isNaN(photoId)) return jsonNoStore({ error: 'Invalid id' }, { status: 400 });
  const memoryId = await photoMemory(context.env.DB, photoId);
  if (memoryId === null) return jsonNoStore({ error: 'Not found' }, { status: 404 });
  const denied = requireMemoryAccess(context, memoryId);
  if (denied) return denied;

  const body = await parseJsonBody(context.request);
  if (body instanceof Response) return body;
  const name = String(body.name ?? '').trim();
  if (!name) return jsonNoStore({ error: 'A name is required' }, { status: 400 });

  const db = context.env.DB;
  // Upsert without a SELECT-then-INSERT race: INSERT OR IGNORE (no-op if the name already exists,
  // case-insensitively, thanks to the COLLATE NOCASE unique index) then re-SELECT the canonical
  // row. This is safe under two concurrent tags of the same new name.
  await run(
    db,
    'INSERT OR IGNORE INTO people (memory_id, name, accent, created_at) VALUES (?, ?, ?, ?)',
    memoryId,
    name,
    pickColor(AVATAR_COLORS, name),
    nowIso(),
  );
  const person = await first<{ id: number; name: string; accent: string }>(
    db,
    'SELECT id, name, accent FROM people WHERE memory_id = ? AND name = ? COLLATE NOCASE',
    memoryId,
    name,
  );
  if (!person) return jsonNoStore({ error: 'Could not tag person' }, { status: 500 });

  await run(
    db,
    'INSERT OR IGNORE INTO photo_people (photo_id, person_id, created_at) VALUES (?, ?, ?)',
    photoId,
    person.id,
    nowIso(),
  );

  const caller = await getCaller(context, memoryId);
  await logActivity(db, { memoryId, photoId, caller, action: 'added_person', detail: `tagged ${person.name}` });
  if (caller) await touchContributor(db, caller.id);

  return jsonNoStore(person, { status: 201 });
};

// DELETE /api/photos/:id/people  { personId }  — untag a person.
export const onRequestDelete = async (context: CFContext): Promise<Response> => {
  const photoId = parseInt(context.params.id as string, 10);
  if (isNaN(photoId)) return jsonNoStore({ error: 'Invalid id' }, { status: 400 });
  const memoryId = await photoMemory(context.env.DB, photoId);
  if (memoryId === null) return jsonNoStore({ error: 'Not found' }, { status: 404 });
  const denied = requireMemoryAccess(context, memoryId);
  if (denied) return denied;

  const body = await parseJsonBody(context.request);
  if (body instanceof Response) return body;
  const personId = parseInt(String(body.personId ?? ''), 10);
  if (isNaN(personId)) return jsonNoStore({ error: 'personId is required' }, { status: 400 });

  await run(context.env.DB, 'DELETE FROM photo_people WHERE photo_id = ? AND person_id = ?', photoId, personId);
  return jsonNoStore({ ok: true });
};
