import { all, first, run, nowIso } from '../../../../lib/db';
import { parseJsonBody, jsonNoStore } from '../../../../lib/request';
import { requireMemoryAccess, getCaller } from '../../../../lib/guard';
import { deriveDate, logActivity, touchContributor, pickColor, AVATAR_COLORS } from '../../../../lib/util';
import type { DateConfidence } from '../../../../lib/util';
import type { CFContext } from '../../../../lib/env';

// PATCH /api/memories/:id/photos/bulk — apply shared metadata to many photos at once.
// Body: { photoIds:number[], date?, location?, addPeople?:string[], addTags?:string[] }
export const onRequestPatch = async (context: CFContext): Promise<Response> => {
  const id = parseInt(context.params.id as string, 10);
  if (isNaN(id)) return jsonNoStore({ error: 'Invalid id' }, { status: 400 });
  const denied = requireMemoryAccess(context, id);
  if (denied) return denied;

  const body = await parseJsonBody(context.request);
  if (body instanceof Response) return body;

  const ids = Array.isArray(body.photoIds)
    ? body.photoIds.map((n) => parseInt(String(n), 10)).filter((n) => Number.isInteger(n))
    : [];
  if (ids.length === 0) return jsonNoStore({ error: 'photoIds is required' }, { status: 400 });

  const db = context.env.DB;
  // Constrain to photos actually in this memory.
  const placeholders = ids.map(() => '?').join(',');
  const owned = await all<{ id: number }>(
    db,
    `SELECT id FROM photos WHERE memory_id = ? AND id IN (${placeholders})`,
    id,
    ...ids,
  );
  const photoIds = owned.map((r) => r.id);
  if (photoIds.length === 0) return jsonNoStore({ error: 'No matching photos' }, { status: 404 });
  const ph = photoIds.map(() => '?').join(',');

  const caller = await getCaller(context, id);
  const applied: string[] = [];
  const ts = nowIso();

  if (body.date && typeof body.date === 'object') {
    const date = body.date as { value?: string; confidence?: string; label?: string };
    const d = deriveDate(date.value, (date.confidence as DateConfidence) ?? 'unknown', date.label);
    await run(
      db,
      `UPDATE photos SET date_value=?, date_confidence=?, date_label=?, date_sort=?, date_year=?, updated_at=?
        WHERE id IN (${ph})`,
      d.value, d.confidence, d.label, d.sort, d.year, ts, ...photoIds,
    );
    if (d.label) applied.push(`date “${d.label}”`);
  }

  if (typeof body.location === 'string' && body.location.trim()) {
    const loc = body.location.trim();
    await run(db, `UPDATE photos SET location=?, updated_at=? WHERE id IN (${ph})`, loc, ts, ...photoIds);
    applied.push(`location “${loc}”`);
  }

  const addPeople = Array.isArray(body.addPeople)
    ? body.addPeople.map((s) => String(s).trim()).filter(Boolean)
    : [];
  for (const name of addPeople) {
    let person = await first<{ id: number }>(
      db,
      'SELECT id FROM people WHERE memory_id = ? AND name = ? COLLATE NOCASE',
      id,
      name,
    );
    if (!person) {
      const res = await run(
        db,
        'INSERT INTO people (memory_id, name, accent, created_at) VALUES (?, ?, ?, ?)',
        id, name, pickColor(AVATAR_COLORS, name), ts,
      );
      person = { id: Number(res.meta.last_row_id) };
    }
    for (const pid of photoIds) {
      await run(
        db,
        'INSERT OR IGNORE INTO photo_people (photo_id, person_id, created_at) VALUES (?, ?, ?)',
        pid, person.id, ts,
      );
    }
  }
  if (addPeople.length) applied.push(addPeople.length === 1 ? `tagged ${addPeople[0]}` : `tagged ${addPeople.length} people`);

  const addTags = Array.isArray(body.addTags)
    ? body.addTags.map((s) => String(s).trim()).filter(Boolean)
    : [];
  for (const tag of addTags) {
    for (const pid of photoIds) {
      await run(db, 'INSERT OR IGNORE INTO photo_tags (photo_id, tag, created_at) VALUES (?, ?, ?)', pid, tag, ts);
    }
  }
  if (addTags.length) applied.push(`${addTags.length} tag${addTags.length === 1 ? '' : 's'}`);

  if (applied.length) {
    const detail = `updated details (${applied.join(', ')})`;
    for (const pid of photoIds) {
      await logActivity(db, { memoryId: id, photoId: pid, caller, action: 'bulk_edit', detail });
    }
  }
  if (caller) await touchContributor(db, caller.id);

  return jsonNoStore({ ok: true, updated: photoIds.length });
};
