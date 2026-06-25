import { first } from '../../../lib/db';
import { jsonNoStore } from '../../../lib/request';
import type { CFContext } from '../../../lib/env';

interface Row {
  id: number;
  name: string;
  year_label: string | null;
  cover_tone: string;
  cover_thumb_key: string | null;
  created_at: string;
  photo_count: number;
}

// GET /api/memories/:id — public meta (enough to render the password gate), plus whether the
// caller has already unlocked it (drives skipping the gate on a return visit).
export const onRequestGet = async (context: CFContext): Promise<Response> => {
  const id = parseInt(context.params.id as string, 10);
  if (isNaN(id)) return jsonNoStore({ error: 'Invalid id' }, { status: 400 });

  const m = await first<Row>(
    context.env.DB,
    `SELECT m.id, m.name, m.year_label, m.cover_tone, m.cover_thumb_key, m.created_at,
            (SELECT COUNT(*) FROM photos p WHERE p.memory_id = m.id) AS photo_count
       FROM memories m WHERE m.id = ?`,
    id,
  );
  if (!m) return jsonNoStore({ error: 'Not found' }, { status: 404 });

  return jsonNoStore({
    id: m.id,
    name: m.name,
    yearLabel: m.year_label,
    coverTone: m.cover_tone,
    coverThumbKey: m.cover_thumb_key,
    photoCount: m.photo_count,
    createdAt: m.created_at,
    unlocked: context.data.unlockedMemories.includes(id),
  });
};
