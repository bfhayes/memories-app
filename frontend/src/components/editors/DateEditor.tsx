import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { MONTHS, approxPresets, clientDeriveDate } from '../../lib/format';
import type { DateConfidence, PhotoDate } from '../../lib/types';

// Ordered easiest → most specific. Year is the obvious first pass; day is last.
const MODES: { key: DateConfidence; label: string }[] = [
  { key: 'year', label: 'Year' },
  { key: 'month-year', label: 'Month + Year' },
  { key: 'exact', label: 'Exact day' },
  { key: 'approx', label: 'Approximate' },
  { key: 'unknown', label: 'Don’t know' },
];

const chip = 'rounded-full px-3.5 py-2 text-[15px] font-bold transition active:scale-95';
const field =
  'w-full rounded-[14px] border border-line bg-white px-4 py-3 text-[17px] font-semibold text-ink outline-none focus:border-terracotta focus:ring-4 focus:ring-terracotta/10';

export default function DateEditor({
  value,
  onChange,
}: {
  value: PhotoDate;
  onChange: (d: PhotoDate) => void;
}) {
  // Default to Year — the easiest, most-useful first pass.
  const [mode, setMode] = useState<DateConfidence>(value.confidence === 'unknown' ? 'year' : value.confidence);

  const seed = value.value ?? '';
  const [exact, setExact] = useState(/^\d{4}-\d{2}-\d{2}$/.test(seed) ? seed : '');
  const [year, setYear] = useState(/(\d{4})/.exec(seed)?.[1] ?? '');
  const [month, setMonth] = useState(/^\d{4}-(\d{2})/.exec(seed)?.[1] ?? '01');
  const [approx, setApprox] = useState(value.confidence === 'approx' ? seed : '');

  const presets = useMemo(() => approxPresets(), []);

  const emit = (m: DateConfidence, raw: string) => onChange(clientDeriveDate(raw, m));

  const setModeAnd = (m: DateConfidence) => {
    setMode(m);
    if (m === 'unknown') return onChange({ value: null, confidence: 'unknown', label: null });
    if (m === 'exact') emit(m, exact);
    if (m === 'year') emit(m, year);
    if (m === 'month-year') emit(m, year ? `${year}-${month}` : '');
    if (m === 'approx') emit(m, approx);
  };

  const setYearVal = (raw: string, m: DateConfidence) => {
    const y = raw.replace(/\D/g, '').slice(0, 4);
    setYear(y);
    if (m === 'year') emit('year', y);
    else emit('month-year', y ? `${y}-${month}` : '');
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => setModeAnd(m.key)}
            className={clsx(chip, mode === m.key ? 'bg-terracotta text-white' : 'bg-chip text-body')}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {mode === 'year' && (
          <div>
            <input
              autoFocus
              inputMode="numeric"
              placeholder="e.g. 1975"
              value={year}
              onChange={(e) => setYearVal(e.target.value, 'year')}
              className={clsx(field, 'text-center text-[28px] font-extrabold tracking-wide')}
            />
            <p className="mt-2 text-center text-[14px] text-muted">Even just the year is a big help. Add the month or day later if you remember.</p>
          </div>
        )}

        {mode === 'month-year' && (
          <div>
            <input
              inputMode="numeric"
              placeholder="Year"
              value={year}
              onChange={(e) => setYearVal(e.target.value, 'month-year')}
              className={clsx(field, 'text-center text-[22px] font-extrabold tracking-wide')}
            />
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {MONTHS.map((mn, i) => {
                const mv = String(i + 1).padStart(2, '0');
                const active = month === mv;
                return (
                  <button
                    key={mn}
                    onClick={() => { setMonth(mv); emit('month-year', year ? `${year}-${mv}` : ''); }}
                    className={clsx(
                      'rounded-[12px] py-2.5 text-[15px] font-bold transition active:scale-95',
                      active ? 'bg-terracotta text-white' : 'bg-chip text-body',
                    )}
                  >
                    {mn.slice(0, 3)}
                  </button>
                );
              })}
            </div>
            {!year && <p className="mt-2 text-[14px] text-muted">Enter the year, then pick the month.</p>}
          </div>
        )}

        {mode === 'exact' && (
          <input
            type="date"
            className={field}
            value={exact}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => { setExact(e.target.value); emit('exact', e.target.value); }}
          />
        )}

        {mode === 'approx' && (
          <div>
            <input
              className={field}
              placeholder="e.g. Early 1960s, Around 1995"
              value={approx}
              onChange={(e) => { setApprox(e.target.value); emit('approx', e.target.value); }}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {presets.slice(0, 18).map((p) => (
                <button
                  key={p.value}
                  onClick={() => { setApprox(p.value); emit('approx', p.value); }}
                  className={clsx(chip, approx === p.value ? 'bg-sage text-white' : 'bg-sage-tint text-sage-dark')}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === 'unknown' && (
          <p className="rounded-[14px] bg-sand px-4 py-4 text-[15px] leading-relaxed text-muted">
            No problem — leaving it blank is fine. Someone in the family can add it whenever they remember.
          </p>
        )}
      </div>
    </div>
  );
}
