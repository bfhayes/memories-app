import { Link } from 'react-router-dom';
import { ChevronRight, Lock, Search } from 'lucide-react';
import { useMemory } from '../context/MemoryContext';
import { useStats } from '../hooks/queries';
import MemoryBar from '../components/MemoryBar';

function firstName(name: string): string {
  const n = name.trim();
  if (/^the\b/i.test(n)) return n;
  return n.split(/\s+/)[0];
}

export default function HomePage() {
  const { memory, memoryId, identity, clearIdentity } = useMemory();
  const { data: stats } = useStats(memoryId);
  if (!memory) return null;

  const needs = stats?.needsInfo ?? 0;

  return (
    <div className="mx-auto min-h-[100dvh] max-w-xl">
      <MemoryBar memory={memory} back="/" />

      <div className="px-5 pb-16 pt-3 sm:px-6">
        {identity && (
          <p className="text-[15px] font-semibold text-muted2">
            Hi {identity.name.split(/\s+/)[0]} ·{' '}
            <button onClick={clearIdentity} className="font-bold text-terracotta hover:underline">Not you?</button>
          </p>
        )}

        <h1 className="mt-3 text-[33px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink">
          Help us remember {firstName(memory.name)}
        </h1>
        <p className="mt-3 text-[17px] leading-relaxed text-muted">
          Add photos from your phone, or browse what’s here and fill in the details — names, dates, and stories.
        </p>

        <div className="mt-7 flex flex-col gap-4">
          <Link
            to={`/m/${memory.id}/upload`}
            className="group flex items-center gap-4 rounded-[24px] bg-terracotta p-5 text-white shadow-btn transition active:scale-[0.99]"
          >
            <span className="grid h-[62px] w-[62px] shrink-0 place-items-center rounded-[18px] bg-white/15 text-[30px]">📷</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[23px] font-extrabold leading-tight tracking-[-0.01em]">Upload Photos</span>
              <span className="block text-[16px] font-medium text-white/85">Add photos from your phone</span>
            </span>
            <ChevronRight size={24} className="text-white/70" />
          </Link>

          <Link
            to={`/m/${memory.id}/library`}
            className="group flex items-center gap-4 rounded-[24px] border border-line bg-white p-5 shadow-feature transition active:scale-[0.99]"
          >
            <span className="grid h-[62px] w-[62px] shrink-0 place-items-center rounded-[18px] bg-sand text-[30px]">🖼️</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[23px] font-extrabold leading-tight tracking-[-0.01em] text-ink">Photo Library</span>
              <span className="block text-[16px] font-medium text-muted2">Browse &amp; add details</span>
            </span>
            <ChevronRight size={24} className="text-chevron" />
          </Link>

          {needs > 0 && (
            <Link
              to={`/m/${memory.id}/detective`}
              className="flex items-center gap-3 rounded-[20px] px-4 py-3.5 text-white shadow-feature transition active:scale-[0.99]"
              style={{ background: 'linear-gradient(135deg, var(--color-sage), var(--color-sage-dark))' }}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/20"><Search size={20} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-extrabold">{needs.toLocaleString()} photos need your help</span>
                <span className="block text-[14px] text-white/85">Play Photo Detective</span>
              </span>
              <ChevronRight size={20} className="text-white/80" />
            </Link>
          )}
        </div>

        <footer className="mt-10 flex items-center justify-center gap-1.5 text-[14px] font-medium text-faint">
          <Lock size={14} /> Private to your family
        </footer>
      </div>
    </div>
  );
}
