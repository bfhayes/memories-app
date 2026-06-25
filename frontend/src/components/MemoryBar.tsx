import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import Photo from './ui/Photo';
import type { MemoryDetail } from '../lib/types';

/** Top bar inside a Memory: back tile + MEMORY / name + cover avatar. */
export default function MemoryBar({
  memory,
  back,
  right,
}: {
  memory: MemoryDetail;
  back?: string | (() => void);
  right?: React.ReactNode;
}) {
  const navigate = useNavigate();
  const onBack = () => {
    if (typeof back === 'function') back();
    else if (typeof back === 'string') navigate(back);
    else navigate(-1);
  };
  return (
    <div className="flex items-center gap-3 px-5 pt-3 pb-2 sm:px-6">
      <button
        onClick={onBack}
        aria-label="Back"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-white border border-line text-muted hover:text-ink active:scale-95 transition shadow-card"
      >
        <ChevronLeft size={22} strokeWidth={2.4} />
      </button>
      <Link to={`/m/${memory.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-faint">Memory</div>
          <div className="truncate text-[19px] font-extrabold text-ink tracking-[-0.01em]">{memory.name}</div>
        </div>
      </Link>
      {right}
      <Photo
        src={memory.coverThumbKey ? `/api/files/${memory.coverThumbKey}` : null}
        tone={memory.coverTone}
        className="h-[42px] w-[42px] shrink-0 rounded-full"
      />
    </div>
  );
}
