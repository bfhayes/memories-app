import { Check } from 'lucide-react';
import { clsx } from 'clsx';
import Sheet from '../ui/Sheet';
import type { LibrarySort } from '../../lib/types';

export const SORT_OPTIONS: { key: LibrarySort; label: string; hint: string }[] = [
  { key: 'recent_uploaded', label: 'Recently added', hint: 'Newest uploads first' },
  { key: 'most_loved', label: '❤️ Most loved', hint: 'Most-liked photos first' },
  { key: 'oldest_taken', label: 'Oldest taken', hint: 'Chronological — oldest first' },
  { key: 'newest_taken', label: 'Newest taken', hint: 'Chronological — newest first' },
  { key: 'recent_updated', label: 'Recently updated', hint: 'Latest edits first' },
];

export function sortLabel(s: LibrarySort): string {
  return SORT_OPTIONS.find((o) => o.key === s)?.label ?? 'Sort';
}

export default function SortSheet({
  open, onClose, value, onChange,
}: {
  open: boolean;
  onClose: () => void;
  value: LibrarySort;
  onChange: (s: LibrarySort) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Sort photos">
      <div className="flex flex-col gap-1.5 pb-2">
        {SORT_OPTIONS.map((o) => (
          <button
            key={o.key}
            onClick={() => { onChange(o.key); onClose(); }}
            className={clsx(
              'flex items-center justify-between rounded-[14px] px-4 py-3.5 text-left transition',
              value === o.key ? 'bg-tint' : 'hover:bg-chip/60',
            )}
          >
            <span className="min-w-0">
              <span className={clsx('block text-[17px] font-extrabold', value === o.key ? 'text-terracotta' : 'text-ink')}>{o.label}</span>
              <span className="block text-[14px] text-muted">{o.hint}</span>
            </span>
            {value === o.key && <Check className="shrink-0 text-terracotta" size={20} strokeWidth={3} />}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
