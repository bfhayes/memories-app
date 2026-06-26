import { useEffect, useMemo, useRef, useState } from 'react';
import PhotoTile from './PhotoTile';
import Spinner from './ui/Spinner';
import type { PhotoSummary } from '../lib/types';

// Responsive column count from the container width (avoids CSS `columns`, which Safari renders
// buggily — tiles vanish on re-render). 2 cols on phones → up to 5 on a wide desktop.
function useColumns(ref: React.RefObject<HTMLDivElement | null>): number {
  const [cols, setCols] = useState(2);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setCols(Math.max(2, Math.min(5, Math.floor(el.clientWidth / 210))));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return cols;
}

/** Masonry photo grid built from JS-distributed flex columns, with infinite scroll. */
export default function PhotoGrid({
  photos,
  memoryId,
  selectMode = false,
  selectedIds,
  onToggle,
  onToggleLike,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: {
  photos: PhotoSummary[];
  memoryId: number;
  selectMode?: boolean;
  selectedIds?: Set<number>;
  onToggle?: (id: number) => void;
  onToggleLike?: (id: number, liked: boolean) => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const cols = useColumns(containerRef);

  // Round-robin into columns — stable across re-renders (an item's column never changes as the
  // list grows), so selecting a photo never reflows the grid.
  const columns = useMemo(() => {
    const arr: PhotoSummary[][] = Array.from({ length: cols }, () => []);
    photos.forEach((p, i) => arr[i % cols].push(p));
    return arr;
  }, [photos, cols]);

  useEffect(() => {
    if (!hasNextPage || !onLoadMore) return;
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) onLoadMore(); },
      { rootMargin: '600px 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, onLoadMore, photos.length]);

  return (
    <div ref={containerRef}>
      <div className="flex gap-2.5">
        {columns.map((col, ci) => (
          <div key={ci} className="flex min-w-0 flex-1 flex-col">
            {col.map((p) => (
              <PhotoTile
                key={p.id}
                photo={p}
                memoryId={memoryId}
                selectMode={selectMode}
                selected={selectedIds?.has(p.id)}
                onToggle={onToggle}
                onToggleLike={onToggleLike}
              />
            ))}
          </div>
        ))}
      </div>
      {hasNextPage && (
        <div ref={sentinel} className="grid place-items-center py-8 text-terracotta">
          {isFetchingNextPage && <Spinner size={24} />}
        </div>
      )}
    </div>
  );
}
