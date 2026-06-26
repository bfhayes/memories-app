import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useMemories } from '../hooks/queries';
import Brand from '../components/Brand';
import Photo from '../components/ui/Photo';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import type { MemorySummary } from '../lib/types';

function MemoryCard({ memory }: { memory: MemorySummary }) {
  return (
    <Link
      to={`/m/${memory.id}`}
      className="group flex items-center gap-3.5 rounded-[22px] border border-line bg-white p-[13px] shadow-card transition active:scale-[0.99] hover:shadow-feature"
    >
      <Photo
        src={memory.coverThumbKey ? `/api/files/${memory.coverThumbKey}` : null}
        tone={memory.coverTone}
        className="h-[70px] w-[70px] shrink-0 rounded-[16px]"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[21px] font-extrabold text-ink tracking-[-0.01em]">{memory.name}</div>
        <div className="mt-0.5 truncate text-[15px] font-medium text-muted2">
          {[memory.yearLabel, `${memory.photoCount.toLocaleString()} photo${memory.photoCount === 1 ? '' : 's'}`]
            .filter(Boolean)
            .join(' · ')}
        </div>
      </div>
      <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full bg-chip text-muted2 transition group-hover:text-terracotta">
        <Lock size={17} strokeWidth={2.4} />
      </span>
    </Link>
  );
}

export default function HubPage() {
  const { data: memories, isLoading } = useMemories();

  return (
    <div className="mx-auto min-h-[100dvh] max-w-xl px-5 pb-16 pt-6 safe-top sm:px-6">
      <Brand />

      <header className="mt-8">
        <h1 className="text-[33px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink">
          Family Memories
        </h1>
        <p className="mt-3 text-[17px] leading-relaxed text-muted">
          A warm, private place to preserve the photos that matter — and fill in the stories together,
          a little at a time.
        </p>
      </header>

      <main className="mt-7">
        {isLoading ? (
          <div className="grid place-items-center py-16 text-terracotta"><Spinner size={28} /></div>
        ) : !memories || memories.length === 0 ? (
          <EmptyState glyph="🖼️" title="No memories yet">
            Your family memories will appear here.
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-3">
            {memories.map((m) => (
              <MemoryCard key={m.id} memory={m} />
            ))}
          </div>
        )}
      </main>

      <footer className="mt-10 flex items-center justify-center gap-1.5 text-[14px] font-medium text-faint">
        <Lock size={14} /> Each memory is password-protected
      </footer>
    </div>
  );
}
