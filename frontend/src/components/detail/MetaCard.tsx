import { type ReactNode } from 'react';
import { clsx } from 'clsx';

export default function MetaCard({
  label,
  glyph,
  emphasized = false,
  right,
  children,
  className,
}: {
  label: string;
  glyph?: ReactNode;
  emphasized?: boolean;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={clsx(
        'rounded-[20px] border p-4 sm:p-5',
        emphasized ? 'bg-tint border-[var(--color-terracotta-border)]' : 'bg-white border-line-meta',
        className,
      )}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h3
          className={clsx(
            'flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-[0.07em]',
            emphasized ? 'text-terracotta' : 'text-faint',
          )}
        >
          {glyph && <span className="text-[14px]">{glyph}</span>}
          {label}
        </h3>
        {right}
      </div>
      {children}
    </section>
  );
}
