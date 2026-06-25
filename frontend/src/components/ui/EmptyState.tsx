import { type ReactNode } from 'react';

export default function EmptyState({
  glyph,
  title,
  children,
  action,
}: {
  glyph: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-6 py-14 text-center animate-fade-in-up">
      <div className="grid h-20 w-20 place-items-center rounded-[24px] bg-sand text-[34px] shadow-card">
        {glyph}
      </div>
      <h3 className="mt-5 text-[22px] font-extrabold text-ink tracking-[-0.01em]">{title}</h3>
      {children && <p className="mt-2 text-[16px] leading-relaxed text-muted">{children}</p>}
      {action && <div className="mt-6 w-full">{action}</div>}
    </div>
  );
}
