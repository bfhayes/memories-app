import type { DateConfidence, PhotoDate } from './types';

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.round((Date.now() - then) / 1000);
  if (secs < 45) return 'just now';
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  if (days < 30) return `${Math.round(days / 7)} week${Math.round(days / 7) === 1 ? '' : 's'} ago`;
  return formatDay(iso);
}

export function formatDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function decadeLabel(decade: number): string {
  return `${decade}s`;
}

/** Confidence → friendly chip label. */
export function confidenceLabel(c: DateConfidence): string | null {
  switch (c) {
    case 'approx': return 'Approximate';
    case 'year': return 'Year';
    case 'month-year': return 'Month';
    case 'exact': return 'Exact';
    default: return null;
  }
}

/** Mirror of the server's deriveDate for optimistic UI. */
export function clientDeriveDate(
  value: string,
  confidence: DateConfidence,
  providedLabel?: string,
): PhotoDate {
  const v = (value ?? '').trim();
  if (!v || confidence === 'unknown') return { value: null, confidence: 'unknown', label: null };
  if (confidence === 'exact') {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
    if (m) return { value: `${m[1]}-${m[2]}-${m[3]}`, confidence, label: `${MONTHS[+m[2] - 1]} ${+m[3]}, ${m[1]}` };
  }
  if (confidence === 'month-year') {
    const m = /^(\d{4})-(\d{2})/.exec(v);
    if (m) return { value: `${m[1]}-${m[2]}`, confidence, label: `${MONTHS[+m[2] - 1]} ${m[1]}` };
  }
  if (confidence === 'year') {
    const m = /^(\d{4})$/.exec(v);
    if (m) return { value: m[1], confidence, label: m[1] };
  }
  return { value: v, confidence: 'approx', label: (providedLabel ?? '').trim() || v };
}

/** Approximate-timeframe presets for the date editor + Detective quick chips. */
export function approxPresets(): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  const now = new Date().getFullYear();
  const startDecade = Math.floor(now / 10) * 10;
  for (let d = startDecade; d >= 1900; d -= 10) {
    out.push({ label: `Early ${d}s`, value: `Early ${d}s` });
    out.push({ label: `Mid ${d}s`, value: `Mid ${d}s` });
    out.push({ label: `Late ${d}s`, value: `Late ${d}s` });
  }
  return out;
}

export function decadeOptions(): { label: string; value: number }[] {
  const out: { label: string; value: number }[] = [];
  const now = new Date().getFullYear();
  const start = Math.floor(now / 10) * 10;
  for (let d = start; d >= 1900; d -= 10) out.push({ label: `${d}s`, value: d });
  return out;
}
