import { all, first, run, nowIso } from '../../lib/db';
import { parseJsonBody, jsonNoStore } from '../../lib/request';
import { hashPassword, accessCookie, isSecure } from '../../lib/auth';
import { PHOTO_TONES, pickColor } from '../../lib/util';
import type { CFContext } from '../../lib/env';

interface MemoryRow {
  id: number;
  name: string;
  year_label: string | null;
  cover_tone: string;
  cover_thumb_key: string | null;
  created_at: string;
  photo_count: number;
}

function shape(m: MemoryRow) {
  return {
    id: m.id,
    name: m.name,
    yearLabel: m.year_label,
    coverTone: m.cover_tone,
    coverThumbKey: m.cover_thumb_key,
    photoCount: m.photo_count,
    createdAt: m.created_at,
  };
}

// GET /api/memories — public list for the hub (no gate to browse which memories exist).
export const onRequestGet = async (context: CFContext): Promise<Response> => {
  const rows = await all<MemoryRow>(
    context.env.DB,
    `SELECT m.id, m.name, m.year_label, m.cover_tone, m.cover_thumb_key, m.created_at,
            (SELECT COUNT(*) FROM photos p WHERE p.memory_id = m.id) AS photo_count
       FROM memories m
      ORDER BY m.created_at ASC`,
  );
  return jsonNoStore(rows.map(shape));
};

// POST /api/memories — create a new Memory. Auto-unlocks it for the creator.
export const onRequestPost = async (context: CFContext): Promise<Response> => {
  const body = await parseJsonBody(context.request);
  if (body instanceof Response) return body;

  const name = String(body.name ?? '').trim();
  const password = String(body.password ?? '').trim();
  const yearLabel = body.yearLabel ? String(body.yearLabel).trim() : null;
  if (!name) return jsonNoStore({ error: 'A name is required' }, { status: 400 });
  if (password.length < 6) return jsonNoStore({ error: 'Password must be at least 6 characters' }, { status: 400 });

  const tone = typeof body.coverTone === 'string' && body.coverTone
    ? body.coverTone
    : pickColor(PHOTO_TONES, name);
  const hash = await hashPassword(password, context.env.AUTH_SECRET);
  const ts = nowIso();

  const result = await run(
    context.env.DB,
    `INSERT INTO memories (name, year_label, cover_tone, password_hash, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    name,
    yearLabel,
    tone,
    hash,
    ts,
    ts,
  );
  const id = Number(result.meta.last_row_id);
  const created = await first<MemoryRow>(
    context.env.DB,
    `SELECT id, name, year_label, cover_tone, cover_thumb_key, created_at, 0 AS photo_count
       FROM memories WHERE id = ?`,
    id,
  );

  const cookie = await accessCookie(
    [...context.data.unlockedMemories, id],
    context.env.AUTH_SECRET,
    isSecure(context.request),
  );
  return jsonNoStore(shape(created!), { status: 201, headers: { 'Set-Cookie': cookie } });
};
