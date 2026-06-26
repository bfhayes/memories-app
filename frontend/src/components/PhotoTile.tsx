import { Link } from 'react-router-dom';
import { Heart, Check } from 'lucide-react';
import { clsx } from 'clsx';
import Photo from './ui/Photo';
import MissingBadge from './MissingBadge';
import type { PhotoSummary } from '../lib/types';

export default function PhotoTile({
  photo,
  memoryId,
  selectMode = false,
  selected = false,
  onToggle,
  onToggleLike,
}: {
  photo: PhotoSummary;
  memoryId: number;
  selectMode?: boolean;
  selected?: boolean;
  onToggle?: (id: number) => void;
  onToggleLike?: (id: number, liked: boolean) => void;
}) {
  // Reserve height with the padding-ratio technique (% of width), NOT CSS `aspect-ratio` —
  // WebKit collapses aspect-ratio to 0 height inside a CSS `columns` masonry on re-render
  // (e.g. toggling selection), which made selected tiles vanish in Safari.
  const pad = photo.width && photo.height ? (photo.height / photo.width) * 100 : 100;

  const inner = (
    <div
      className={clsx(
        'relative w-full overflow-hidden rounded-[16px] bg-sand transition',
        selected && 'ring-[3px] ring-terracotta ring-offset-2 ring-offset-page',
      )}
      style={{ paddingBottom: `${pad}%` }}
    >
      <div className="absolute inset-0">
        <Photo src={photo.thumbUrl} tone={photo.tone} className="h-full w-full" />
      </div>

      {/* Like heart — tappable straight from the grid (doesn't open the photo). */}
      {!selectMode && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleLike?.(photo.id, photo.likedByMe); }}
          aria-label={photo.likedByMe ? 'Remove love' : 'Love this photo'}
          aria-pressed={photo.likedByMe}
          className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-full bg-black/35 px-2 py-1.5 text-white backdrop-blur-[2px] transition active:scale-90"
        >
          <Heart
            size={16}
            strokeWidth={2.4}
            className={photo.likedByMe ? 'text-terracotta' : 'text-white'}
            fill={photo.likedByMe ? 'currentColor' : 'none'}
          />
          {photo.likeCount > 0 && <span className="text-[12px] font-bold leading-none">{photo.likeCount}</span>}
        </button>
      )}

      <MissingBadge photo={photo} />

      {selectMode && (
        <span
          className={clsx(
            'absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full border-2 transition',
            selected ? 'border-terracotta bg-terracotta text-white' : 'border-white/90 bg-black/25 text-transparent',
          )}
        >
          <Check size={16} strokeWidth={3} />
        </span>
      )}
    </div>
  );

  // Always a <Link> so the tile/image isn't remounted when toggling select mode.
  return (
    <Link
      to={`/m/${memoryId}/photo/${photo.id}`}
      onClick={(e) => { if (selectMode) { e.preventDefault(); onToggle?.(photo.id); } }}
      className="mb-2.5 block break-inside-avoid active:scale-[0.99]"
    >
      {inner}
    </Link>
  );
}
