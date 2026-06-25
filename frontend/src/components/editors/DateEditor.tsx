import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { MONTHS, approxPresets, clientDeriveDate } from '../../lib/format';
import type { DateConfidence, PhotoDate } from '../../lib/types';

const MODES: { key: DateConfidence; label: string }[] = [
  { key: 'exact', label: 'Exact date' },
  { key: 'month-year', label: 'Month + Year' },
  { key: 'year', label: 'Year' },
  { key: 'approx', label: 'Approximate' },
  { key: 'unknown', label: 'Not sure' },
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
  const [mode, setMode] = useState<DateConfidence>(value.confidence === 'unknown' ? 'approx' : value.confidence);

  // Seed raw inputs from the stored value.
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
        {mode === 'exact' && (
          <input
            type="date"
            className={field}
            value={exact}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => { setExact(e.target.value); emit('exact', e.target.value); }}
          />
        )}

        {mode === 'month-year' && (
          <div className="flex gap-2.5">
            <select
              className={clsx(field, 'flex-1')}
              value={month}
              onChange={(e) => { setMonth(e.target.value); emit('month-year', year ? `${year}-${e.target.value}` : ''); }}
            >
              {MONTHS.map((mn, i) => (
                <option key={mn} value={String(i + 1).padStart(2, '0')}>{mn}</option>
              ))}
            </select>
            <input
              className={clsx(field, 'w-28')}
              inputMode="numeric"
              placeholder="Year"
              value={year}
              onChange={(e) => { const y = e.target.value.replace(/\D/g, '').slice(0, 4); setYear(y); emit('month-year', y ? `${y}-${month}` : ''); }}
            />
          </div>
        )}

        {mode === 'year' && (
          <input
            className={field}
            inputMode="numeric"
            placeholder="e.g. 1962"
            value={year}
            onChange={(e) => { const y = e.target.value.replace(/\D/g, '').slice(0, 4); setYear(y); emit('year', y); }}
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
            No problem — leaving it blank is fine. Even a rough guess like a decade is a huge help later.
          </p>
        )}
      </div>
    </div>
  );
}
