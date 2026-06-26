import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

/** "Saving…" → "Changes save automatically" indicator. */
export default function AutosaveNote({
  saving,
  savedAt,
  error,
  className,
}: {
  saving: boolean;
  savedAt: number | null;
  error?: string | null;
  className?: string;
}) {
  const [justSaved, setJustSaved] = useState(false);
  useEffect(() => {
    if (savedAt == null) return;
    setJustSaved(true);
    const t = setTimeout(() => setJustSaved(false), 2200);
    return () => clearTimeout(t);
  }, [savedAt]);

  return (
    <div className={clsx('flex items-center gap-1.5 text-[14px] font-semibold', className)}>
      {error ? (
        <span className="text-[#A23D2F]">Couldn’t save — we’ll retry</span>
      ) : saving ? (
        <span className="flex items-center gap-1.5 text-muted">
          <Loader2 size={15} className="animate-spin-slow" /> Saving…
        </span>
      ) : (
        <span className={clsx('flex items-center gap-1.5 transition-colors', justSaved ? 'text-sage' : 'text-muted')}>
          <Check size={15} strokeWidth={3} /> {justSaved ? 'Saved' : 'Changes save automatically'}
        </span>
      )}
    </div>
  );
}
