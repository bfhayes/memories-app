import { useState } from 'react';
import { History, RotateCcw } from 'lucide-react';
import Sheet from '../ui/Sheet';
import Avatar from '../ui/Avatar';
import { relativeTime } from '../../lib/format';
import type { ActivityEntry } from '../../lib/types';

/**
 * Shows earlier versions of a field (captured on every edit) with a one-tap Restore. This is what
 * makes last-write-wins safe: a value someone overwrites is never lost — it lives here.
 */
export default function FieldHistory({
  activity,
  field,
  label,
  onRestore,
  renderPrev,
}: {
  activity: ActivityEntry[];
  field: string;
  label: string;
  onRestore: (prev: string) => void;
  renderPrev?: (prev: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const entries = activity.filter((a) => a.field === field && a.prevValue && a.prevValue.trim());
  if (entries.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-full px-2 py-1 text-[13px] font-bold text-muted2 hover:text-ink"
      >
        <History size={14} /> History
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={`${label} history`}>
        <p className="mb-4 text-[15px] leading-relaxed text-muted">
          Earlier versions — tap Restore to bring one back. Nothing is ever lost.
        </p>
        <ul className="flex flex-col gap-3 pb-2">
          {entries.map((e) => (
            <li key={e.id} className="rounded-[16px] border border-line bg-white p-3.5">
              <div className="flex items-center gap-2.5">
                <Avatar name={e.name} accent={e.accent} size={28} />
                <span className="text-[14px] font-bold text-ink">{e.name}</span>
                <span className="text-[13px] text-faint">· {relativeTime(e.createdAt)}</span>
                <button
                  onClick={() => { onRestore(e.prevValue as string); setOpen(false); }}
                  className="ml-auto flex items-center gap-1 rounded-full bg-chip px-3 py-1.5 text-[13px] font-bold text-body hover:brightness-95 active:scale-95"
                >
                  <RotateCcw size={13} /> Restore
                </button>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-body2">
                {renderPrev ? renderPrev(e.prevValue as string) : e.prevValue}
              </p>
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  );
}
