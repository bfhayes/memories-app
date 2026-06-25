import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { clsx } from 'clsx';

/**
 * Text input + suggestion chips for adding people / tags. Remembers nothing itself —
 * suggestions come from the memory (previously entered names/tags).
 */
export default function ChipSuggestInput({
  placeholder,
  suggestions,
  existing,
  onAdd,
  accentSuggestions = false,
}: {
  placeholder: string;
  suggestions: string[];
  existing: string[];
  onAdd: (value: string) => void;
  accentSuggestions?: boolean;
}) {
  const [value, setValue] = useState('');
  const existingLower = useMemo(() => new Set(existing.map((e) => e.toLowerCase())), [existing]);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    return suggestions
      .filter((s) => !existingLower.has(s.toLowerCase()))
      .filter((s) => !q || s.toLowerCase().includes(q))
      .slice(0, 8);
  }, [suggestions, existingLower, value]);

  const add = (v: string) => {
    const t = v.trim();
    if (!t || existingLower.has(t.toLowerCase())) { setValue(''); return; }
    onAdd(t);
    setValue('');
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(value); } }}
          placeholder={placeholder}
          className="h-[50px] flex-1 rounded-[14px] border border-line bg-white px-4 text-[17px] font-semibold text-ink placeholder:text-placeholder outline-none focus:border-terracotta focus:ring-4 focus:ring-terracotta/10"
        />
        <button
          onClick={() => add(value)}
          disabled={!value.trim()}
          className="grid h-[50px] w-[50px] place-items-center rounded-[14px] bg-terracotta text-white disabled:opacity-40 active:scale-95"
          aria-label="Add"
        >
          <Plus size={22} strokeWidth={2.8} />
        </button>
      </div>

      {filtered.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {filtered.map((s) => (
            <button
              key={s}
              onClick={() => add(s)}
              className={clsx(
                'rounded-full px-3.5 py-2 text-[15px] font-bold transition active:scale-95',
                accentSuggestions ? 'bg-sage-tint text-sage-dark' : 'bg-chip text-body',
              )}
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
