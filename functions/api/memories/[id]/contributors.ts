import { all, first, run, nowIso } from '../../../lib/db';
import { parseJsonBody, jsonNoStore } from '../../../lib/request';
import { requireMemoryAccess } from '../../../lib/guard';
import { AVATAR_COLORS, pickColor } from '../../../lib/util';
import type { CFContext } from '../../../lib/env';

interface Row { id: number; name: string; accent: string }

const shape = (r: Row) => ({ id: r.id, name: r.name, accent: r.accent });

// GET /api/memories/:id/contributors — the "pick your name" list (people who've logged in).
export const onRequestGet = async (context: CFContext): Promise<Response> => {
  const id = parseInt(context.params.id as string, 10);
  if (isNaN(id)) return jsonNoStore({ error: 'Invalid id' }, { status: 400 });
  const denied = requireMemoryAccess(context, id);
  if (denied) return denied;

  const rows = await all<Row>(
    context.env.DB,
    'SELECT id, name, accent FROM contributors WHERE memory_id = ? ORDER BY created_at ASC',
    id,
  );
  return jsonNoStore(rows.map(shape));
};

// POST /api/memories/:id/contributors — add a new identity ("I'm someone new").
export const onRequestPost = async (context: CFContext): Promise<Response> => {
  const id = parseInt(context.params.id as string, 10);
  if (isNaN(id)) return jsonNoStore({ error: 'Invalid id' }, { status: 400 });
  const denied = requireMemoryAccess(context, id);
  if (denied) return denied;

  const body = await parseJsonBody(context.request);
  if (body instanceof Response) return body;
  const name = String(body.name ?? '').trim();
  if (!name) return jsonNoStore({ error: 'A name is required' }, { status: 400 });

  // Reuse an existing identity with the same name (case-insensitive) rather than duplicating.
  const existing = await first<Row>(
    context.env.DB,
    'SELECT id, name, accent FROM contributors WHERE memory_id = ? AND name = ? COLLATE NOCASE',
    id,
    name,
  );
  if (existing) return jsonNoStore(shape(existing), { status: 200 });

  const accent = pickColor(AVATAR_COLORS, name);
  const ts = nowIso();
  const res = await run(
    context.env.DB,
    `INSERT INTO contributors (memory_id, name, accent, created_at, last_seen_at)
     VALUES (?, ?, ?, ?, ?)`,
    id,
    name,
    accent,
    ts,
    ts,
  );
  return jsonNoStore({ id: Number(res.meta.last_row_id), name, accent }, { status: 201 });
};
