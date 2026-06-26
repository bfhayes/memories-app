import { clsx } from 'clsx';
import Sheet from '../ui/Sheet';
import Button from '../ui/Button';
import { decadeLabel } from '../../lib/format';
import type { Contributor, LibraryFilter, LibrarySort, MemoryStats, Person } from '../../lib/types';

export interface LibraryFilters {
  filter: LibraryFilter;
  sort: LibrarySort;
  decade?: number;
  person?: number;
  tag?: string;
  contributor?: number;
}

const SHOW: { key: LibraryFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'needs_info', label: 'Needs info' },
  { key: 'has_date', label: 'Has date' },
  { key: 'favorites', label: 'Favorites' },
  { key: 'needs_date', label: 'Needs date' },
  { key: 'needs_people', label: 'Needs people' },
  { key: 'needs_story', label: 'Needs story' },
  { key: 'needs_location', label: 'Needs place' },
];

const chip = 'rounded-full px-3.5 py-2 text-[15px] font-bold transition active:scale-95';

export default function FilterSheet({
  open, onClose, value, onChange, stats, people, tags, contributors,
}: {
  open: boolean;
  onClose: () => void;
  value: LibraryFilters;
  onChange: (patch: Partial<LibraryFilters>) => void;
  stats?: MemoryStats;
  people: Person[];
  tags: string[];
  contributors: Contributor[];
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Filter & sort"
      footer={<Button block onClick={onClose}>Show photos</Button>}
    >
      <div className="flex flex-col gap-6">
        <div>
          <h4 className="mb-2.5 text-[13px] font-bold uppercase tracking-[0.06em] text-faint">Show</h4>
          <div className="flex flex-wrap gap-2">
            {SHOW.map((s) => (
              <button key={s.key} onClick={() => onChange({ filter: s.key })}
                className={clsx(chip, value.filter === s.key ? 'bg-terracotta text-white' : 'bg-chip text-body')}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {stats && stats.decades.length > 0 && (
          <div>
            <h4 className="mb-2.5 text-[13px] font-bold uppercase tracking-[0.06em] text-faint">Decade</h4>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => onChange({ decade: undefined })}
                className={clsx(chip, value.decade === undefined ? 'bg-ink text-white' : 'bg-chip text-body')}>
                Any
              </button>
              {stats.decades.map((d) => (
                <button key={d.decade} onClick={() => onChange({ decade: value.decade === d.decade ? undefined : d.decade })}
                  className={clsx(chip, value.decade === d.decade ? 'bg-ink text-white' : 'bg-chip text-body')}>
                  {decadeLabel(d.decade)} <span className="opacity-60">{d.count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {people.length > 0 && (
          <div>
            <h4 className="mb-2.5 text-[13px] font-bold uppercase tracking-[0.06em] text-faint">Person</h4>
            <div className="flex flex-wrap gap-2">
              {people.map((p) => (
                <button key={p.id} onClick={() => onChange({ person: value.person === p.id ? undefined : p.id })}
                  className={clsx(chip, value.person === p.id ? 'text-white' : 'bg-chip text-body')}
                  style={value.person === p.id ? { background: p.accent } : undefined}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {tags.length > 0 && (
          <div>
            <h4 className="mb-2.5 text-[13px] font-bold uppercase tracking-[0.06em] text-faint">Tag</h4>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <button key={t} onClick={() => onChange({ tag: value.tag === t ? undefined : t })}
                  className={clsx(chip, value.tag === t ? 'bg-terracotta text-white' : 'bg-chip text-body')}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {contributors.length > 0 && (
          <div>
            <h4 className="mb-2.5 text-[13px] font-bold uppercase tracking-[0.06em] text-faint">Who added it</h4>
            <div className="flex flex-wrap gap-2">
              {contributors.map((c) => (
                <button key={c.id} onClick={() => onChange({ contributor: value.contributor === c.id ? undefined : c.id })}
                  className={clsx(chip, value.contributor === c.id ? 'text-white' : 'bg-chip text-body')}
                  style={value.contributor === c.id ? { background: c.accent } : undefined}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
