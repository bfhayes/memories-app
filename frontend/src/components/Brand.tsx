import { clsx } from 'clsx';

/** The terracotta rounded-square mark + "Memories" wordmark. */
export default function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-terracotta text-[22px] shadow-btn">
        🖼️
      </span>
      {!compact && (
        <div className="leading-tight">
          <div className="text-[20px] font-extrabold text-ink tracking-[-0.01em]">Memories</div>
          <div className="text-[13px] font-medium text-faint">memories.bryanthayes.com</div>
        </div>
      )}
    </div>
  );
}
