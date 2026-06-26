import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, CheckSquare, ImagePlus, X, ArrowUpDown } from 'lucide-react';
import { clsx } from 'clsx';
import { useMemory } from '../context/MemoryContext';
import { usePhotosInfinite, useStats, useSuggestions } from '../hooks/queries';
import { useLike } from '../hooks/useLike';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import { decadeLabel } from '../lib/format';
import PhotoGrid from '../components/PhotoGrid';
import DetectiveBanner from '../components/DetectiveBanner';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import BottomNav from '../components/ui/BottomNav';
import FilterSheet, { type LibraryFilters } from '../components/library/FilterSheet';
import SortSheet, { sortLabel } from '../components/library/SortSheet';
import BulkEditSheet from '../components/library/BulkEditSheet';
import Brand from '../components/Brand';
import type { LibraryFilter } from '../lib/types';

const QUICK: { key: LibraryFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'needs_info', label: 'Needs info' },
  { key: 'has_date', label: 'Has date' },
  { key: 'favorites', label: '❤️ Favorites' },
];

const RAIL: { key: LibraryFilter; label: string; count: (s: import('../lib/types').MemoryStats) => number }[] = [
  { key: 'all', label: 'All photos', count: (s) => s.total },
  { key: 'needs_info', label: 'Needs info', count: (s) => s.needsInfo },
  { key: 'has_people', label: 'Has people', count: (s) => s.hasPeople },
  { key: 'has_story', label: 'Has a story', count: (s) => s.hasStory },
  { key: 'has_date', label: 'Has a date', count: (s) => s.hasDate },
  { key: 'favorites', label: 'Favorites', count: (s) => s.favorites },
];

export default function LibraryPage() {
  const { memory, memoryId } = useMemory();
  const [filters, setFilters] = useState<LibraryFilters>({ filter: 'all', sort: 'recent_uploaded' });
  const [q, setQ] = useState('');
  const [qDebounced, setQDebounced] = useState('');
  const debouncedSetQ = useDebouncedCallback(setQDebounced, 350);

  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const { data: stats } = useStats(memoryId);
  const { data: suggestions } = useSuggestions(memoryId);
  const toggleLike = useLike(memoryId);
  const query = usePhotosInfinite(memoryId, {
    filter: filters.filter,
    sort: filters.sort,
    q: qDebounced || undefined,
    decade: filters.decade,
    person: filters.person,
  });

  const photos = useMemo(() => query.data?.pages.flatMap((p) => p.photos) ?? [], [query.data]);

  useEffect(() => { debouncedSetQ(q); }, [q, debouncedSetQ]);

  const patch = (p: Partial<LibraryFilters>) => setFilters((f) => ({ ...f, ...p }));
  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  const exitSelect = () => { setSelectMode(false); setSelected(new Set()); };

  const personName = suggestions?.people.find((p) => p.id === filters.person)?.name;
  const activeExtras = (filters.decade ? 1 : 0) + (filters.person ? 1 : 0);

  const searchBar = (
    <div className="relative">
      <Search size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-placeholder" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search photos & people"
        className="h-[52px] w-full rounded-[16px] border border-line bg-white pl-12 pr-10 text-[17px] font-medium text-ink placeholder:text-placeholder outline-none focus:border-terracotta focus:ring-4 focus:ring-terracotta/10"
      />
      {q && (
        <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-placeholder hover:text-ink" aria-label="Clear">
          <X size={18} />
        </button>
      )}
    </div>
  );

  const grid = (
    <>
      {query.isLoading ? (
        <div className="grid place-items-center py-20 text-terracotta"><Spinner size={28} /></div>
      ) : photos.length === 0 ? (
        <EmptyState
          glyph={qDebounced || filters.filter !== 'all' ? '🔍' : '🖼️'}
          title={qDebounced || filters.filter !== 'all' ? 'Nothing here yet' : 'No photos yet'}
          action={
            filters.filter === 'all' && !qDebounced ? (
              <Link to={`/m/${memoryId}/upload`}><Button block><ImagePlus size={20} /> Upload photos</Button></Link>
            ) : (
              <Button block variant="outline" onClick={() => { patch({ filter: 'all', decade: undefined, person: undefined }); setQ(''); }}>
                Clear filters
              </Button>
            )
          }
        >
          {filters.filter === 'all' && !qDebounced
            ? 'Add your first photos — no details needed. You can fill those in later, together.'
            : 'Try a different filter or search.'}
        </EmptyState>
      ) : (
        <PhotoGrid
          photos={photos}
          memoryId={memoryId}
          selectMode={selectMode}
          selectedIds={selected}
          onToggle={toggle}
          onToggleLike={toggleLike}
          hasNextPage={query.hasNextPage}
          isFetchingNextPage={query.isFetchingNextPage}
          onLoadMore={() => query.fetchNextPage()}
        />
      )}
    </>
  );

  if (!memory) return null;

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {/* Desktop top bar */}
      <header className="hidden items-center gap-6 border-b border-line-divider bg-warm/90 px-6 py-3 backdrop-blur lg:flex">
        <Link to="/" className="shrink-0"><Brand compact /></Link>
        <span className="text-[17px] font-extrabold text-ink">{memory.name}</span>
        <div className="mx-auto w-full max-w-md">{searchBar}</div>
        <button
          onClick={() => setSortOpen(true)}
          className="flex items-center gap-2 rounded-[14px] bg-chip px-4 py-2.5 text-[15px] font-bold text-body transition hover:brightness-95"
        >
          <ArrowUpDown size={18} /> {sortLabel(filters.sort)}
        </button>
        <button
          onClick={() => (selectMode ? exitSelect() : setSelectMode(true))}
          className={clsx('flex items-center gap-2 rounded-[14px] px-4 py-2.5 text-[15px] font-bold transition', selectMode ? 'bg-ink text-white' : 'bg-chip text-body hover:brightness-95')}
        >
          <CheckSquare size={18} /> {selectMode ? 'Done' : 'Select'}
        </button>
        <Link to={`/m/${memoryId}/upload`}>
          <Button size="sm"><ImagePlus size={18} /> Upload</Button>
        </Link>
      </header>

      {/* Mobile header */}
      <header className="px-5 pt-4 safe-top lg:hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[26px] font-extrabold tracking-[-0.01em] text-ink">{memory.name}</h1>
            <p className="text-[14px] font-medium text-muted2">{(stats?.total ?? memory.photoCount).toLocaleString()} photos</p>
          </div>
          <button
            onClick={() => (selectMode ? exitSelect() : setSelectMode(true))}
            className={clsx('rounded-[14px] px-4 py-2.5 text-[15px] font-bold transition', selectMode ? 'bg-ink text-white' : 'bg-chip text-body')}
          >
            {selectMode ? 'Done' : 'Select'}
          </button>
        </div>
        <div className="mt-3">{searchBar}</div>
      </header>

      <div className="flex flex-1">
        {/* Desktop rail */}
        <aside className="hidden w-60 shrink-0 border-r border-line-divider px-4 py-5 lg:block">
          <nav className="flex flex-col gap-1">
            {stats && RAIL.map((r) => (
              <button
                key={r.key}
                onClick={() => patch({ filter: r.key })}
                className={clsx('flex items-center justify-between rounded-[12px] px-3 py-2.5 text-[15px] font-bold transition',
                  filters.filter === r.key ? 'bg-tint text-terracotta' : 'text-body hover:bg-chip/60')}
              >
                {r.label}
                <span className={clsx('text-[14px]', filters.filter === r.key ? 'text-terracotta' : 'text-faint')}>{r.count(stats).toLocaleString()}</span>
              </button>
            ))}
          </nav>

          {stats && stats.decades.length > 0 && (
            <div className="mt-6">
              <h4 className="mb-2 px-3 text-[12px] font-bold uppercase tracking-[0.07em] text-faint">Decade</h4>
              <div className="flex flex-wrap gap-1.5 px-1">
                {stats.decades.map((d) => (
                  <button key={d.decade} onClick={() => patch({ decade: filters.decade === d.decade ? undefined : d.decade })}
                    className={clsx('rounded-full px-3 py-1.5 text-[14px] font-bold transition', filters.decade === d.decade ? 'bg-ink text-white' : 'bg-chip text-body')}>
                    {decadeLabel(d.decade)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {stats && stats.needsInfo > 0 && (
            <Link
              to={`/m/${memoryId}/detective`}
              className="mt-6 block rounded-[18px] p-4 text-white shadow-feature transition active:scale-[0.99]"
              style={{ background: 'linear-gradient(135deg, var(--color-sage), var(--color-sage-dark))' }}
            >
              <span className="flex items-center gap-2 text-[15px] font-extrabold"><Search size={18} /> Photo Detective</span>
              <span className="mt-1 block text-[14px] text-white/85">
                {stats.needsInfo.toLocaleString()} {stats.needsInfo === 1 ? 'photo needs' : 'photos need'} your help
              </span>
            </Link>
          )}
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 px-5 pb-28 pt-4 sm:px-6 lg:pb-10">
          {/* Mobile detective + filter chips */}
          <div className="lg:hidden">
            {stats && stats.needsInfo > 0 && <div className="mb-4"><DetectiveBanner memoryId={memoryId} count={stats.needsInfo} /></div>}
            <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar sm:-mx-6 sm:px-6">
              {QUICK.map((c) => (
                <button key={c.key} onClick={() => patch({ filter: c.key })}
                  className={clsx('shrink-0 rounded-full px-4 py-2 text-[15px] font-bold transition', filters.filter === c.key ? 'bg-terracotta text-white' : 'bg-white border border-line text-body')}>
                  {c.label}
                </button>
              ))}
              <button onClick={() => setSortOpen(true)}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-[15px] font-bold text-body transition">
                <ArrowUpDown size={16} /> {sortLabel(filters.sort)}
              </button>
              <button onClick={() => setFilterOpen(true)}
                className={clsx('flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[15px] font-bold transition', activeExtras > 0 ? 'bg-ink text-white' : 'bg-white border border-line text-body')}>
                <SlidersHorizontal size={16} /> Filters{activeExtras > 0 ? ` · ${activeExtras}` : ''}
              </button>
            </div>
          </div>

          {/* Active filter summary (decade / person) */}
          {(filters.decade || filters.person) && (
            <div className="mb-3 mt-3 flex flex-wrap gap-2 lg:mt-0">
              {filters.decade && (
                <button onClick={() => patch({ decade: undefined })} className="flex items-center gap-1.5 rounded-full bg-chip px-3 py-1.5 text-[14px] font-bold text-body">
                  {decadeLabel(filters.decade)} <X size={14} />
                </button>
              )}
              {filters.person && personName && (
                <button onClick={() => patch({ person: undefined })} className="flex items-center gap-1.5 rounded-full bg-chip px-3 py-1.5 text-[14px] font-bold text-body">
                  {personName} <X size={14} />
                </button>
              )}
            </div>
          )}

          <div className="mt-3 lg:mt-0">{grid}</div>
        </main>
      </div>

      {/* Selection action bar */}
      {selectMode && selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line-divider bg-warm/95 px-5 py-3.5 backdrop-blur safe-bottom sm:px-6">
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <span className="text-[16px] font-extrabold text-ink">{selected.size} selected</span>
            <button onClick={() => setSelected(new Set())} className="text-[15px] font-bold text-muted hover:text-ink">Clear</button>
            <Button size="md" className="ml-auto" onClick={() => setBulkOpen(true)}>Edit together</Button>
          </div>
        </div>
      )}

      {!selectMode && <BottomNav memoryId={memoryId} />}

      <SortSheet
        open={sortOpen}
        onClose={() => setSortOpen(false)}
        value={filters.sort}
        onChange={(s) => patch({ sort: s })}
      />
      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        value={filters}
        onChange={patch}
        stats={stats}
        people={suggestions?.people ?? []}
      />
      <BulkEditSheet
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        memoryId={memoryId}
        photoIds={[...selected]}
        onApplied={() => { setBulkOpen(false); exitSelect(); }}
      />
    </div>
  );
}
