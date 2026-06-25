import { all } from '../../../lib/db';
import { jsonNoStore } from '../../../lib/request';
import { requireMemoryAccess } from '../../../lib/guard';
import type { CFContext } from '../../../lib/env';

// GET /api/memories/:id/suggestions — known people, locations and tags (for autocomplete /
// "remember previously entered people and locations").
export const onRequestGet = async (context: CFContext): Promise<Response> => {
  const id = parseInt(context.params.id as string, 10);
  if (isNaN(id)) return jsonNoStore({ error: 'Invalid id' }, { status: 400 });
  const denied = requireMemoryAccess(context, id);
  if (denied) return denied;

  const db = context.env.DB;
  const people = await all<{ id: number; name: string; accent: string; uses: number }>(
    db,
    `SELECT pe.id, pe.name, pe.accent,
            (SELECT COUNT(*) FROM photo_people pp WHERE pp.person_id = pe.id) AS uses
       FROM people pe WHERE pe.memory_id = ?
      ORDER BY uses DESC, pe.name ASC`,
    id,
  );
  const locations = await all<{ location: string }>(
    db,
    `SELECT location FROM photos
      WHERE memory_id = ? AND location IS NOT NULL AND location != ''
      GROUP BY location ORDER BY COUNT(*) DESC, location ASC`,
    id,
  );
  const tags = await all<{ tag: string }>(
    db,
    `SELECT pt.tag FROM photo_tags pt JOIN photos p ON p.id = pt.photo_id
      WHERE p.memory_id = ?
      GROUP BY pt.tag ORDER BY COUNT(*) DESC, pt.tag ASC`,
    id,
  );
  return jsonNoStore({
    people: people.map((p) => ({ id: p.id, name: p.name, accent: p.accent })),
    locations: locations.map((l) => l.location),
    tags: tags.map((t) => t.tag),
  });
};
