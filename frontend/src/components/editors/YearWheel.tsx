import { useEffect, useMemo, useRef } from 'react';

const ITEM_H = 44;
const VISIBLE = 5; // odd — number of rows shown
const PAD = (ITEM_H * (VISIBLE - 1)) / 2; // so the first/last year can center

/**
 * A touch-friendly scrolling year picker (like an iOS wheel). Scroll/flick to a year; it snaps to
 * center. It does NOT set a value until the user actually scrolls — so opening it never auto-picks
 * a year (consistent with "dates are unknown until someone fills them in").
 */
export default function YearWheel({
  value,
  onChange,
  max,
  min = 1900,
}: {
  value: number | null;
  onChange: (year: number) => void;
  max?: number;
  min?: number;
}) {
  const maxYear = max ?? new Date().getFullYear();
  const years = useMemo(() => {
    const a: number[] = [];
    for (let y = maxYear; y >= min; y--) a.push(y);
    return a;
  }, [maxYear, min]);

  const ref = useRef<HTMLDivElement>(null);
  const lockRef = useRef(false); // ignore scroll events caused by our own programmatic scroll
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Center the current value (or a sensible default) on mount — WITHOUT firing onChange.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const idx = Math.max(0, years.indexOf(value ?? 1980));
    lockRef.current = true;
    el.scrollTop = idx * ITEM_H;
    requestAnimationFrame(() => requestAnimationFrame(() => { lockRef.current = false; }));
    // mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScroll = () => {
    if (lockRef.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const idx = Math.round(el.scrollTop / ITEM_H);
      const y = years[Math.max(0, Math.min(years.length - 1, idx))];
      if (y) onChange(y);
    }, 110);
  };

  return (
    <div className="relative mx-auto max-w-[260px]" style={{ height: ITEM_H * VISIBLE }}>
      {/* selected band */}
      <div
        className="pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2 rounded-[14px] border-2"
        style={{ height: ITEM_H, borderColor: 'var(--color-terracotta-border)', background: 'var(--color-tint)' }}
      />
      <div
        ref={ref}
        onScroll={onScroll}
        className="no-scrollbar h-full overflow-y-scroll"
        style={{
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
          maskImage: 'linear-gradient(transparent, #000 22%, #000 78%, transparent)',
          WebkitMaskImage: 'linear-gradient(transparent, #000 22%, #000 78%, transparent)',
        }}
      >
        <div style={{ height: PAD }} />
        {years.map((y) => (
          <div
            key={y}
            className="flex items-center justify-center text-[26px] font-extrabold tracking-wide text-ink"
            style={{ height: ITEM_H, scrollSnapAlign: 'center' }}
          >
            {y}
          </div>
        ))}
        <div style={{ height: PAD }} />
      </div>
    </div>
  );
}
