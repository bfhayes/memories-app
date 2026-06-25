import { clsx } from 'clsx';

export default function ProgressBar({
  value,
  className,
  color = 'var(--color-terracotta)',
  height = 14,
}: {
  value: number; // 0..1
  className?: string;
  color?: string;
  height?: number;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      className={clsx('w-full overflow-hidden rounded-full bg-chip', className)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300 ease-out"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}
