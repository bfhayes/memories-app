import { run, nowIso } from './db';
import type { Caller } from './guard';

export const AVATAR_COLORS = ['#C4704F', '#7A8B6F', '#B08A6B', '#8C7BA0', '#C9A14A'];

export const PHOTO_TONES = [
  '#9FA487', '#C9A28B', '#94A3AC', '#C2B193', '#B59BA0',
  '#A8B69C', '#BFA67E', '#8E9A93', '#A89A82',
];

/** Deterministic pick from a palette so the same name/seed always gets the same color. */
export function pickColor(palette: string[], seed: string | number): string {
  const s = String(seed);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

export type DateConfidence = 'exact' | 'month-year' | 'year' | 'approx' | 'unknown';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export interface DerivedDate {
  value: string | null;
  confidence: DateConfidence;
  label: string | null;
  sort: string | null;
  year: number | null;
}

/** Normalize a date input into the stored representation (label/sort/year). */
export function deriveDate(
  value: string | null | undefined,
  confidence: DateConfidence,
  providedLabel?: string | null,
): DerivedDate {
  const v = (value ?? '').trim();
  if (!v || confidence === 'unknown') {
    return { value: null, confidence: 'unknown', label: null, sort: null, year: null };
  }
  if (confidence === 'exact') {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
    if (m) {
      const [, y, mo, d] = m;
      const label = `${MONTHS[+mo - 1]} ${+d}, ${y}`;
      return { value: `${y}-${mo}-${d}`, confidence, label, sort: `${y}-${mo}-${d}`, year: +y };
    }
  }
  if (confidence === 'month-year') {
    const m = /^(\d{4})-(\d{2})/.exec(v);
    if (m) {
      const [, y, mo] = m;
      const label = `${MONTHS[+mo - 1]} ${y}`;
      return { value: `${y}-${mo}`, confidence, label, sort: `${y}-${mo}-01`, year: +y };
    }
  }
  if (confidence === 'year') {
    const m = /^(\d{4})$/.exec(v);
    if (m) {
      const y = m[1];
      return { value: y, confidence, label: y, sort: `${y}-01-01`, year: +y };
    }
  }
  // approx (or a fallthrough that didn't parse cleanly) — keep free text, derive a sort year.
  const yearMatch = /(\d{4})/.exec(v);
  const year = yearMatch ? +yearMatch[1] : null;
  return {
    value: v,
    confidence: 'approx',
    label: (providedLabel ?? '').trim() || v,
    sort: year ? `${year}-06-15` : null,
    year,
  };
}

/** Append an attributed activity row. */
export async function logActivity(
  db: D1Database,
  opts: {
    memoryId: number;
    photoId: number | null;
    caller: Caller | null;
    action: string;
    detail: string;
  },
): Promise<void> {
  await run(
    db,
    `INSERT INTO activity (memory_id, photo_id, contributor_id, contributor_name, accent, action, detail, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    opts.memoryId,
    opts.photoId,
    opts.caller?.id ?? null,
    opts.caller?.name ?? 'Someone',
    opts.caller?.accent ?? '#C4704F',
    opts.action,
    opts.detail,
    nowIso(),
  );
}

/** Touch a contributor's last_seen_at (best effort). */
export async function touchContributor(db: D1Database, id: number): Promise<void> {
  await run(db, 'UPDATE contributors SET last_seen_at = ? WHERE id = ?', nowIso(), id);
}
