import { first, all } from '../../../lib/db';
import { jsonNoStore } from '../../../lib/request';
import { requireMemoryAccess, getCaller } from '../../../lib/guard';
import type { CFContext } from '../../../lib/env';

interface Counts {
  total: number;
  missing_date: number;
  missing_people: number;
  missing_story: number;
  missing_location: number;
  has_date: number;
  has_people: number;
  has_story: number;
  favorites: number;
  needs_info: number;
  filled_fields: number;
}

// GET /api/memories/:id/stats — counts powering filters, Detective missions and completion.
export const onRequestGet = async (context: CFContext): Promise<Response> => {
  const id = parseInt(context.params.id as string, 10);
  if (isNaN(id)) return jsonNoStore({ error: 'Invalid id' }, { status: 400 });
  const denied = requireMemoryAccess(context, id);
  if (denied) return denied;
  const caller = await getCaller(context, id);
  const callerId = caller?.id ?? 0;

  const db = context.env.DB;
  const hasPeople = `EXISTS (SELECT 1 FROM photo_people pp WHERE pp.photo_id = p.id)`;
  const hasDate = `p.date_confidence != 'unknown'`;
  const hasStory = `p.about IS NOT NULL AND p.about != ''`;
  const hasLoc = `p.location IS NOT NULL AND p.location != ''`;

  const c = await first<Counts>(
    db,
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN ${hasDate} THEN 0 ELSE 1 END) AS missing_date,
       SUM(CASE WHEN ${hasPeople} THEN 0 ELSE 1 END) AS missing_people,
       SUM(CASE WHEN ${hasStory} THEN 0 ELSE 1 END) AS missing_story,
       SUM(CASE WHEN ${hasLoc} THEN 0 ELSE 1 END) AS missing_location,
       SUM(CASE WHEN ${hasDate} THEN 1 ELSE 0 END) AS has_date,
       SUM(CASE WHEN ${hasPeople} THEN 1 ELSE 0 END) AS has_people,
       SUM(CASE WHEN ${hasStory} THEN 1 ELSE 0 END) AS has_story,
       SUM(CASE WHEN EXISTS (SELECT 1 FROM photo_likes pl WHERE pl.photo_id = p.id AND pl.contributor_id = ?) THEN 1 ELSE 0 END) AS favorites,
       SUM(CASE WHEN (${hasDate}) AND (${hasPeople}) AND (${hasStory}) AND (${hasLoc}) THEN 0 ELSE 1 END) AS needs_info,
       SUM((CASE WHEN ${hasDate} THEN 1 ELSE 0 END) + (CASE WHEN ${hasPeople} THEN 1 ELSE 0 END)
         + (CASE WHEN ${hasStory} THEN 1 ELSE 0 END) + (CASE WHEN ${hasLoc} THEN 1 ELSE 0 END)) AS filled_fields
     FROM photos p WHERE p.memory_id = ? AND p.deleted_at IS NULL`,
    callerId,
    id,
  );

  const decades = await all<{ decade: number; count: number }>(
    db,
    `SELECT (date_year / 10) * 10 AS decade, COUNT(*) AS count
       FROM photos WHERE memory_id = ? AND date_year IS NOT NULL AND deleted_at IS NULL
      GROUP BY decade ORDER BY decade ASC`,
    id,
  );

  const contributorRow = await first<{ count: number }>(
    db,
    'SELECT COUNT(*) AS count FROM contributors WHERE memory_id = ?',
    id,
  );

  const total = c?.total ?? 0;
  const completion = total > 0 ? Math.round(((c?.filled_fields ?? 0) / (total * 4)) * 100) : 0;

  return jsonNoStore({
    total,
    needsInfo: c?.needs_info ?? 0,
    missingDate: c?.missing_date ?? 0,
    missingPeople: c?.missing_people ?? 0,
    missingStory: c?.missing_story ?? 0,
    missingLocation: c?.missing_location ?? 0,
    hasDate: c?.has_date ?? 0,
    hasPeople: c?.has_people ?? 0,
    hasStory: c?.has_story ?? 0,
    favorites: c?.favorites ?? 0,
    contributors: contributorRow?.count ?? 0,
    completion,
    decades: decades.map((d) => ({ decade: d.decade, count: d.count })),
  });
};
