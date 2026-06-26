import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

/**
 * A bottom sheet on mobile, a centered dialog on desktop. Used for inline editors and pickers.
 */
export default function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 flex h-[100dvh] items-end justify-center p-0 sm:items-center sm:p-4 animate-fade-in"
      style={{ background: 'rgba(40,30,20,0.34)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={clsx(
          'w-full sm:max-w-[460px] bg-page rounded-t-[26px] sm:rounded-[26px] shadow-pop',
          'max-h-[92dvh] sm:max-h-[86dvh] flex flex-col animate-sheet-up sm:animate-scale-in',
          className,
        )}
      >
        <div className="shrink-0 pt-3 sm:pt-5 px-5 sm:px-6">
          <div className="sm:hidden mx-auto mb-3 h-1.5 w-11 rounded-full bg-line" />
          {(title || true) && (
            <div className="flex items-center justify-between gap-3 pb-1">
              <h2 className="text-[21px] font-extrabold text-ink tracking-[-0.01em]">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="grid h-10 w-10 place-items-center rounded-full bg-chip text-muted hover:text-ink active:scale-95 transition"
              >
                <X size={20} strokeWidth={2.4} />
              </button>
            </div>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 sm:px-6 py-3">{children}</div>
        {footer && <div className="shrink-0 px-5 sm:px-6 pt-3 pb-6 safe-bottom border-t border-line-divider">{footer}</div>}
      </div>
    </div>
  );
}
