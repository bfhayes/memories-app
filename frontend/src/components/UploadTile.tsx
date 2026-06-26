import { Check, X, Copy, RotateCcw } from 'lucide-react';
import type { UploadItem } from '../hooks/useUploader';

function Ring({ progress }: { progress: number }) {
  const r = 13;
  const c = 2 * Math.PI * r;
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" className="-rotate-90">
      <circle cx="17" cy="17" r={r} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
      <circle
        cx="17" cy="17" r={r} fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0.04, progress))}
        style={{ transition: 'stroke-dashoffset 0.2s ease' }}
      />
    </svg>
  );
}

export default function UploadTile({ item, onRemove, onRetry }: { item: UploadItem; onRemove: (id: string) => void; onRetry?: (id: string) => void }) {
  const inProgress = item.status === 'queued' || item.status === 'processing' || item.status === 'uploading';

  return (
    <div className="relative aspect-square overflow-hidden rounded-[16px] bg-sand">
      <img src={item.preview} alt="" className="h-full w-full object-cover" />

      {inProgress && (
        <div className="absolute inset-0 grid place-items-center bg-black/35">
          <Ring progress={item.status === 'uploading' ? item.progress : 0.08} />
        </div>
      )}

      {item.status === 'done' && (
        <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-sage text-white shadow">
          <Check size={17} strokeWidth={3} />
        </span>
      )}

      {item.status === 'duplicate' && (
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-black/55 px-2 py-1 text-[12px] font-bold text-white">
          <Copy size={13} /> Already added
        </div>
      )}

      {item.status === 'error' && (
        <button
          type="button"
          onClick={() => onRetry?.(item.id)}
          aria-label="Couldn’t add — tap to retry"
          className="absolute inset-0 grid place-items-center gap-1.5 bg-[#A23D2F]/65 px-2 text-center text-white active:bg-[#A23D2F]/80"
        >
          <RotateCcw size={22} strokeWidth={2.4} />
          <span className="text-[12px] font-bold leading-tight">Couldn’t add — tap to retry</span>
        </button>
      )}

      {inProgress && (
        <button
          onClick={() => onRemove(item.id)}
          aria-label="Remove"
          className="absolute left-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/55 text-white active:scale-90"
        >
          <X size={14} strokeWidth={2.6} />
        </button>
      )}
    </div>
  );
}
