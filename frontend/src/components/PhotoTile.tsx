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
}: {
  photo: PhotoSummary;
  memoryId: number;
  selectMode?: boolean;
  selected?: boolean;
  onToggle?: (id: number) => void;
}) {
  const aspect = photo.width && photo.height ? `${photo.width} / ${photo.height}` : '1 / 1';

  const inner = (
    <div
      className={clsx(
        'relative w-full overflow-hidden rounded-[16px] bg-sand transition',
        selectMode && 'cursor-pointer',
        selected && 'ring-[3px] ring-terracotta ring-offset-2 ring-offset-page',
      )}
      style={{ aspectRatio: aspect }}
    >
      <Photo src={photo.thumbUrl} tone={photo.tone} className="h-full w-full" />

      {photo.favorite && (
        <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/35 text-white backdrop-blur-[2px]">
          <Heart size={15} fill="currentColor" />
        </span>
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

  if (selectMode) {
    return (
      <div className="mb-2.5 break-inside-avoid" onClick={() => onToggle?.(photo.id)}>
        {inner}
      </div>
    );
  }
  return (
    <Link to={`/m/${memoryId}/photo/${photo.id}`} className="mb-2.5 block break-inside-avoid active:scale-[0.99]">
      {inner}
    </Link>
  );
}
