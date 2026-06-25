import { useEffect, useRef } from 'react';
import PhotoTile from './PhotoTile';
import Spinner from './ui/Spinner';
import type { PhotoSummary } from '../lib/types';

/** Masonry photo grid (CSS columns) with infinite scroll. */
export default function PhotoGrid({
  photos,
  memoryId,
  selectMode = false,
  selectedIds,
  onToggle,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: {
  photos: PhotoSummary[];
  memoryId: number;
  selectMode?: boolean;
  selectedIds?: Set<number>;
  onToggle?: (id: number) => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
}) {
  const sentinel = useRef<HTMLDivElement>(null);

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
    <div>
      <div className="columns-2 gap-2.5 sm:columns-3 lg:columns-4 xl:columns-5">
        {photos.map((p) => (
          <PhotoTile
            key={p.id}
            photo={p}
            memoryId={memoryId}
            selectMode={selectMode}
            selected={selectedIds?.has(p.id)}
            onToggle={onToggle}
          />
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
