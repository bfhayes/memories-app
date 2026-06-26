import { all, first, run, nowIso } from '../../../lib/db';
import { parseJsonBody, jsonNoStore } from '../../../lib/request';
import { requireMemoryAccess, getCaller } from '../../../lib/guard';
import { deriveDate, logActivity, touchContributor } from '../../../lib/util';
import type { DateConfidence } from '../../../lib/util';
import type { CFContext } from '../../../lib/env';

interface FullRow {
  id: number;
  memory_id: number;
  r2_key: string;
  thumb_key: string;
  tone: string;
  width: number | null;
  height: number | null;
  favorite: number;
  source: string;
  file_name: string | null;
  file_size: number | null;
  date_value: string | null;
  date_confidence: string;
  date_label: string | null;
  location: string | null;
  about: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

async function getFull(db: D1Database, id: number, callerId: number) {
  const p = await first<FullRow>(db, 'SELECT * FROM photos WHERE id = ?', id);
  if (!p) return null;
  const likeRow = await first<{ n: number }>(db, 'SELECT COUNT(*) AS n FROM photo_likes WHERE photo_id = ?', id);
  const mineRow = await first<{ n: number }>(
    db, 'SELECT COUNT(*) AS n FROM photo_likes WHERE photo_id = ? AND contributor_id = ?', id, callerId,
  );
  const people = await all<{ id: number; name: string; accent: string }>(
    db,
    `SELECT pe.id, pe.name, pe.accent
       FROM photo_people pp JOIN people pe ON pe.id = pp.person_id
      WHERE pp.photo_id = ? ORDER BY pp.created_at ASC`,
    id,
  );
  const tags = await all<{ tag: string }>(
    db,
    'SELECT tag FROM photo_tags WHERE photo_id = ? ORDER BY created_at ASC',
    id,
  );
  const activity = await all<{ id: number; contributor_name: string; accent: string; action: string; detail: string; field: string | null; prev_value: string | null; created_at: string }>(
    db,
    `SELECT id, contributor_name, accent, action, detail, field, prev_value, created_at
       FROM activity WHERE photo_id = ? ORDER BY created_at DESC`,
    id,
  );
  return {
    id: p.id,
    memoryId: p.memory_id,
    url: `/api/files/${p.r2_key}`,
    thumbUrl: `/api/files/${p.thumb_key}`,
    tone: p.tone,
    width: p.width,
    height: p.height,
    likeCount: likeRow?.n ?? 0,
    likedByMe: (mineRow?.n ?? 0) > 0,
    date: { value: p.date_value, confidence: p.date_confidence, label: p.date_label },
    location: p.location,
    about: p.about,
    notes: p.notes,
    people,
    tags: tags.map((t) => t.tag),
    activity: activity.map((a) => ({
      id: a.id,
      name: a.contributor_name,
      accent: a.accent,
      action: a.action,
      detail: a.detail,
      field: a.field,
      prevValue: a.prev_value,
      createdAt: a.created_at,
    })),
    meta: {
      added: p.created_at,
      source: p.source,
      file: p.file_name,
      fileSize: p.file_size,
      photoId: p.id,
    },
  };
}

async function loadMemoryId(db: D1Database, id: number): Promise<number | null> {
  const row = await first<{ memory_id: number }>(db, 'SELECT memory_id FROM photos WHERE id = ?', id);
  return row?.memory_id ?? null;
}

// GET /api/photos/:id
export const onRequestGet = async (context: CFContext): Promise<Response> => {
  const id = parseInt(context.params.id as string, 10);
  if (isNaN(id)) return jsonNoStore({ error: 'Invalid id' }, { status: 400 });
  const memoryId = await loadMemoryId(context.env.DB, id);
  if (memoryId === null) return jsonNoStore({ error: 'Not found' }, { status: 404 });
  const denied = requireMemoryAccess(context, memoryId);
  if (denied) return denied;

  const caller = await getCaller(context, memoryId);
  const full = await getFull(context.env.DB, id, caller?.id ?? 0);
  return jsonNoStore(full);
};

// PATCH /api/photos/:id — autosave one or more scalar fields (date, location, about, notes, favorite).
export const onRequestPatch = async (context: CFContext): Promise<Response> => {
  const id = parseInt(context.params.id as string, 10);
  if (isNaN(id)) return jsonNoStore({ error: 'Invalid id' }, { status: 400 });
  const memoryId = await loadMemoryId(context.env.DB, id);
  if (memoryId === null) return jsonNoStore({ error: 'Not found' }, { status: 404 });
  const denied = requireMemoryAccess(context, memoryId);
  if (denied) return denied;

  const body = await parseJsonBody(context.request);
  if (body instanceof Response) return body;
  const caller = await getCaller(context, memoryId);
  const db = context.env.DB;

  // Snapshot the current values so we can record the PREVIOUS value (restorable history) and skip
  // no-op saves. Edits are last-write-wins, but the prior value is never lost.
  const before = await first<{ about: string | null; notes: string | null; location: string | null; date_value: string | null; date_confidence: string; date_label: string | null }>(
    db,
    'SELECT about, notes, location, date_value, date_confidence, date_label FROM photos WHERE id = ?',
    id,
  );

  if ('date' in body) {
    const date = (body.date ?? {}) as { value?: string; confidence?: string; label?: string };
    const d = deriveDate(date.value, (date.confidence as DateConfidence) ?? 'unknown', date.label);
    const changed = d.value !== (before?.date_value ?? null) || d.confidence !== (before?.date_confidence ?? 'unknown');
    if (changed) {
      await run(
        db,
        `UPDATE photos SET date_value=?, date_confidence=?, date_label=?, date_sort=?, date_year=?, updated_at=? WHERE id=?`,
        d.value, d.confidence, d.label, d.sort, d.year, nowIso(), id,
      );
      const hadDate = (before?.date_confidence ?? 'unknown') !== 'unknown';
      await logActivity(db, {
        memoryId, photoId: id, caller, action: 'set_date',
        detail: d.confidence === 'unknown' ? 'cleared the date' : `set the date to ${d.label}`,
        field: 'date',
        prevValue: hadDate ? JSON.stringify({ value: before?.date_value, confidence: before?.date_confidence, label: before?.date_label }) : null,
      });
    }
  }

  if ('location' in body) {
    const loc = body.location == null ? null : String(body.location).trim() || null;
    if (loc !== (before?.location ?? null)) {
      await run(db, 'UPDATE photos SET location=?, updated_at=? WHERE id=?', loc, nowIso(), id);
      await logActivity(db, {
        memoryId, photoId: id, caller, action: 'set_location',
        detail: loc ? 'tagged the location' : 'removed the location',
        field: 'location', prevValue: before?.location ?? null,
      });
    }
  }

  if ('about' in body) {
    const about = body.about == null ? null : String(body.about).trim() || null;
    if (about !== (before?.about ?? null)) {
      await run(db, 'UPDATE photos SET about=?, updated_at=? WHERE id=?', about, nowIso(), id);
      await logActivity(db, {
        memoryId, photoId: id, caller, action: 'set_about',
        detail: before?.about ? 'updated the story' : 'added a story',
        field: 'about', prevValue: before?.about ?? null,
      });
    }
  }

  if ('notes' in body) {
    const notes = body.notes == null ? null : String(body.notes).trim() || null;
    if (notes !== (before?.notes ?? null)) {
      await run(db, 'UPDATE photos SET notes=?, updated_at=? WHERE id=?', notes, nowIso(), id);
      await logActivity(db, {
        memoryId, photoId: id, caller, action: 'set_notes',
        detail: before?.notes ? 'updated a note' : 'added a note',
        field: 'notes', prevValue: before?.notes ?? null,
      });
    }
  }

  if (caller) await touchContributor(db, caller.id);
  const full = await getFull(db, id, caller?.id ?? 0);
  return jsonNoStore(full);
};

// DELETE /api/photos/:id — remove a photo (and its R2 objects).
export const onRequestDelete = async (context: CFContext): Promise<Response> => {
  const id = parseInt(context.params.id as string, 10);
  if (isNaN(id)) return jsonNoStore({ error: 'Invalid id' }, { status: 400 });
  const row = await first<{ memory_id: number; r2_key: string; thumb_key: string }>(
    context.env.DB,
    'SELECT memory_id, r2_key, thumb_key FROM photos WHERE id = ?',
    id,
  );
  if (!row) return jsonNoStore({ error: 'Not found' }, { status: 404 });
  const denied = requireMemoryAccess(context, row.memory_id);
  if (denied) return denied;

  await context.env.IMAGES.delete([row.r2_key, row.thumb_key]).catch(() => {});
  await run(context.env.DB, 'DELETE FROM photos WHERE id = ?', id);
  return jsonNoStore({ ok: true, id });
};
