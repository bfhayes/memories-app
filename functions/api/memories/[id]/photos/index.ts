import { all, first, run, nowIso } from '../../../../lib/db';
import { jsonNoStore } from '../../../../lib/request';
import { requireMemoryAccess, getCaller } from '../../../../lib/guard';
import { deriveDate, logActivity, touchContributor, pickColor, PHOTO_TONES } from '../../../../lib/util';
import type { CFContext } from '../../../../lib/env';

interface PhotoRow {
  id: number;
  thumb_key: string;
  tone: string;
  width: number | null;
  height: number | null;
  like_count: number;
  liked_by_me: number;
  date_label: string | null;
  date_confidence: string;
  location: string | null;
  about: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  people_count: number;
  tag_count: number;
}

function summarize(p: PhotoRow) {
  const hasDate = p.date_confidence !== 'unknown';
  const hasPeople = p.people_count > 0;
  const hasStory = !!(p.about && p.about.trim());
  const hasLocation = !!(p.location && p.location.trim());
  const needs: string[] = [];
  if (!hasDate) needs.push('date');
  if (!hasPeople) needs.push('people');
  if (!hasStory) needs.push('story');
  if (!hasLocation) needs.push('location');
  return {
    id: p.id,
    thumbUrl: `/api/files/${p.thumb_key}`,
    tone: p.tone,
    width: p.width,
    height: p.height,
    likeCount: Number(p.like_count ?? 0),
    likedByMe: !!p.liked_by_me,
    dateLabel: p.date_label,
    dateConfidence: p.date_confidence,
    hasDate,
    hasPeople,
    hasStory,
    hasLocation,
    peopleCount: p.people_count,
    tagCount: p.tag_count,
    needs,
    uploadedAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

// GET /api/memories/:id/photos — the library grid, with filters / search / sort / pagination.
export const onRequestGet = async (context: CFContext): Promise<Response> => {
  const id = parseInt(context.params.id as string, 10);
  if (isNaN(id)) return jsonNoStore({ error: 'Invalid id' }, { status: 400 });
  const denied = requireMemoryAccess(context, id);
  if (denied) return denied;
  const caller = await getCaller(context, id);
  const callerId = caller?.id ?? 0; // 0 matches no contributor

  const url = new URL(context.request.url);
  const filter = url.searchParams.get('filter') ?? 'all';
  const q = (url.searchParams.get('q') ?? '').trim();
  const sort = url.searchParams.get('sort') ?? 'recent_uploaded';
  const decade = url.searchParams.get('decade');
  const person = url.searchParams.get('person');
  const tag = url.searchParams.get('tag');
  const contributor = url.searchParams.get('contributor');
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '30', 10) || 30, 100);
  const offset = Math.max(parseInt(url.searchParams.get('offset') ?? '0', 10) || 0, 0);

  const where: string[] = ['p.memory_id = ?'];
  const args: unknown[] = [id];

  const noPeople = `NOT EXISTS (SELECT 1 FROM photo_people pp WHERE pp.photo_id = p.id)`;
  const hasPeople = `EXISTS (SELECT 1 FROM photo_people pp WHERE pp.photo_id = p.id)`;

  switch (filter) {
    case 'needs_info':
      where.push(`(p.date_confidence = 'unknown' OR ${noPeople} OR p.about IS NULL OR p.about = '' OR p.location IS NULL OR p.location = '')`);
      break;
    case 'has_date':
      where.push(`p.date_confidence != 'unknown'`);
      break;
    case 'needs_date':
      where.push(`p.date_confidence = 'unknown'`);
      break;
    case 'has_people':
      where.push(hasPeople);
      break;
    case 'needs_people':
      where.push(noPeople);
      break;
    case 'has_story':
      where.push(`p.about IS NOT NULL AND p.about != ''`);
      break;
    case 'needs_story':
      where.push(`(p.about IS NULL OR p.about = '')`);
      break;
    case 'needs_location':
      where.push(`(p.location IS NULL OR p.location = '')`);
      break;
    case 'favorites':
      where.push('EXISTS (SELECT 1 FROM photo_likes pl WHERE pl.photo_id = p.id AND pl.contributor_id = ?)');
      args.push(callerId);
      break;
    default:
      break;
  }

  if (decade && /^\d{4}$/.test(decade)) {
    const start = Math.floor(parseInt(decade, 10) / 10) * 10;
    where.push('p.date_year >= ? AND p.date_year <= ?');
    args.push(start, start + 9);
  }
  if (person && /^\d+$/.test(person)) {
    where.push('EXISTS (SELECT 1 FROM photo_people pp WHERE pp.photo_id = p.id AND pp.person_id = ?)');
    args.push(parseInt(person, 10));
  }
  if (tag) {
    where.push('EXISTS (SELECT 1 FROM photo_tags pt WHERE pt.photo_id = p.id AND pt.tag = ?)');
    args.push(tag);
  }
  if (contributor && /^\d+$/.test(contributor)) {
    where.push('p.uploaded_by = ?');
    args.push(parseInt(contributor, 10));
  }
  if (q) {
    const like = `%${q}%`;
    where.push(`(
      p.about LIKE ? OR p.location LIKE ? OR p.notes LIKE ? OR p.date_label LIKE ?
      OR EXISTS (SELECT 1 FROM photo_people pp JOIN people pe ON pe.id = pp.person_id WHERE pp.photo_id = p.id AND pe.name LIKE ?)
      OR EXISTS (SELECT 1 FROM photo_tags pt WHERE pt.photo_id = p.id AND pt.tag LIKE ?)
    )`);
    args.push(like, like, like, like, like, like);
  }

  let orderBy: string;
  switch (sort) {
    case 'recent_updated': orderBy = 'p.updated_at DESC, p.id DESC'; break;
    case 'oldest_taken': orderBy = 'p.date_sort IS NULL, p.date_sort ASC, p.id ASC'; break;
    case 'newest_taken': orderBy = 'p.date_sort IS NULL, p.date_sort DESC, p.id DESC'; break;
    case 'most_loved': orderBy = 'like_count DESC, p.created_at DESC, p.id DESC'; break;
    default: orderBy = 'p.created_at DESC, p.id DESC'; break;
  }

  // The liked_by_me subquery (callerId) is the first bound param because it appears first in SQL.
  const sql = `
    SELECT p.id, p.thumb_key, p.tone, p.width, p.height,
           p.date_label, p.date_confidence, p.location, p.about, p.notes,
           p.created_at, p.updated_at,
           (SELECT COUNT(*) FROM photo_people pp WHERE pp.photo_id = p.id) AS people_count,
           (SELECT COUNT(*) FROM photo_tags pt WHERE pt.photo_id = p.id) AS tag_count,
           (SELECT COUNT(*) FROM photo_likes pl WHERE pl.photo_id = p.id) AS like_count,
           EXISTS (SELECT 1 FROM photo_likes pl WHERE pl.photo_id = p.id AND pl.contributor_id = ?) AS liked_by_me
      FROM photos p
     WHERE ${where.join(' AND ')}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`;

  const rows = await all<PhotoRow>(context.env.DB, sql, callerId, ...args, limit + 1, offset);
  const hasMore = rows.length > limit;
  const photos = rows.slice(0, limit).map(summarize);
  return jsonNoStore({ photos, nextOffset: hasMore ? offset + limit : null });
};

// POST /api/memories/:id/photos — multipart upload (original + browser-made thumbnail).
export const onRequestPost = async (context: CFContext): Promise<Response> => {
  const id = parseInt(context.params.id as string, 10);
  if (isNaN(id)) return jsonNoStore({ error: 'Invalid id' }, { status: 400 });
  const denied = requireMemoryAccess(context, id);
  if (denied) return denied;
  const caller = await getCaller(context, id);

  let form: FormData;
  try {
    form = await context.request.formData();
  } catch {
    return jsonNoStore({ error: 'Expected multipart form data' }, { status: 400 });
  }

  // workers-types declares FormData.get as `string | null`, but file fields are Files at runtime.
  const original = form.get('original') as unknown as File | null;
  const thumb = form.get('thumb') as unknown as File | null;
  if (!(original instanceof File) || !(thumb instanceof File)) {
    return jsonNoStore({ error: 'original and thumb files are required' }, { status: 400 });
  }
  let meta: Record<string, unknown> = {};
  try { meta = JSON.parse(String(form.get('meta') ?? '{}')); } catch { /* tolerate */ }

  const origBuf = await original.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', origBuf);
  const hash = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');

  // Duplicate detection — same bytes already in this memory.
  const dup = await first<PhotoRow>(
    context.env.DB,
    `SELECT p.id, p.thumb_key, p.tone, p.width, p.height, p.date_label, p.date_confidence,
            p.location, p.about, p.notes, p.created_at, p.updated_at,
            (SELECT COUNT(*) FROM photo_people pp WHERE pp.photo_id = p.id) AS people_count,
            (SELECT COUNT(*) FROM photo_tags pt WHERE pt.photo_id = p.id) AS tag_count,
            (SELECT COUNT(*) FROM photo_likes pl WHERE pl.photo_id = p.id) AS like_count, 0 AS liked_by_me
       FROM photos p WHERE p.memory_id = ? AND p.content_hash = ?`,
    id,
    hash,
  );
  if (dup) return jsonNoStore({ duplicate: true, photo: summarize(dup) }, { status: 200 });

  const uuid = crypto.randomUUID();
  const origKey = `${id}/${uuid}/orig`;
  const thumbKey = `${id}/${uuid}/thumb.jpg`;
  const contentType = original.type || 'image/jpeg';

  await context.env.IMAGES.put(origKey, origBuf, { httpMetadata: { contentType } });
  await context.env.IMAGES.put(thumbKey, await thumb.arrayBuffer(), {
    httpMetadata: { contentType: 'image/jpeg' },
  });

  const width = Number(meta.width) || null;
  const height = Number(meta.height) || null;
  const tone = typeof meta.tone === 'string' && meta.tone ? meta.tone : pickColor(PHOTO_TONES, uuid);

  // Date is intentionally left UNKNOWN. Scanned/digitized photos carry the wrong EXIF date
  // (the scan time, not when the photo was actually taken), so people fill in the real date later.
  const d = deriveDate(null, 'unknown');

  const ts = nowIso();
  const res = await run(
    context.env.DB,
    `INSERT INTO photos
       (memory_id, r2_key, thumb_key, content_hash, file_name, file_size, content_type,
        width, height, tone, date_value, date_confidence, date_label, date_sort, date_year,
        source, uploaded_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    origKey,
    thumbKey,
    hash,
    original.name || (meta.fileName as string) || null,
    original.size || null,
    contentType,
    width,
    height,
    tone,
    d.value,
    d.confidence,
    d.label,
    d.sort,
    d.year,
    'Upload',
    caller?.id ?? null,
    ts,
    ts,
  );
  const photoId = Number(res.meta.last_row_id);

  await logActivity(context.env.DB, {
    memoryId: id,
    photoId,
    caller,
    action: 'uploaded',
    detail: 'uploaded this photo',
  });
  if (caller) await touchContributor(context.env.DB, caller.id);

  const created = await first<PhotoRow>(
    context.env.DB,
    `SELECT p.id, p.thumb_key, p.tone, p.width, p.height, p.date_label, p.date_confidence,
            p.location, p.about, p.notes, p.created_at, p.updated_at,
            0 AS people_count, 0 AS tag_count, 0 AS like_count, 0 AS liked_by_me
       FROM photos p WHERE p.id = ?`,
    photoId,
  );
  return jsonNoStore({ duplicate: false, photo: summarize(created!) }, { status: 201 });
};
