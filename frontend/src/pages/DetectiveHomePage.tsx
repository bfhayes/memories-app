import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Dices } from 'lucide-react';
import { useMemory } from '../context/MemoryContext';
import { useStats } from '../hooks/queries';
import { MISSIONS } from '../lib/missions';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';

export default function DetectiveHomePage() {
  const { memory, memoryId } = useMemory();
  const navigate = useNavigate();
  const { data: stats, isLoading } = useStats(memoryId);

  if (!memory) return null;

  const go = (key: string) => navigate(`/m/${memoryId}/detective/${key}`);
  const surprise = () => {
    if (!stats) return;
    const best = [...MISSIONS].filter((m) => m.count(stats) > 0).sort((a, b) => b.count(stats) - a.count(stats))[0];
    if (best) go(best.key);
  };

  return (
    <div className="mx-auto min-h-[100dvh] max-w-xl px-5 pb-16 pt-4 safe-top sm:px-6">
      <div className="flex items-center">
        <span className="text-[14px] font-bold uppercase tracking-[0.08em] text-sage">🔍 Photo Detective</span>
      </div>

      <header className="mt-5">
        <h1 className="text-[33px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink">Let’s solve some mysteries</h1>
        <p className="mt-3 text-[17px] leading-relaxed text-muted">
          Help fill the gaps — one photo at a time. Every little detail you add brings a memory back to life.
        </p>
      </header>

      {isLoading ? (
        <div className="grid place-items-center py-16 text-terracotta"><Spinner size={28} /></div>
      ) : stats && stats.needsInfo === 0 ? (
        <EmptyState glyph="🏆" title="Everything’s filled in!" action={<Button block onClick={() => navigate(`/m/${memoryId}/library`)}>Back to library</Button>}>
          This memory is beautifully complete. Thank you for helping preserve it.
        </EmptyState>
      ) : (
        <>
          <div className="mt-7 flex flex-col gap-3">
            {stats && MISSIONS.map((m) => {
              const count = m.count(stats);
              return (
                <button
                  key={m.key}
                  onClick={() => go(m.key)}
                  disabled={count === 0}
                  className="flex items-center gap-4 rounded-[22px] border border-line bg-white p-4 text-left shadow-card transition enabled:active:scale-[0.99] enabled:hover:shadow-feature disabled:opacity-45"
                >
                  <span className="grid h-[58px] w-[58px] shrink-0 place-items-center rounded-[18px] text-[26px]" style={{ background: m.tint }}>{m.glyph}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[20px] font-extrabold tracking-[-0.01em] text-ink">{m.title}</span>
                    <span className="block text-[15px] font-semibold" style={{ color: m.color }}>
                      {count > 0 ? `${count.toLocaleString()} photo${count === 1 ? '' : 's'} to go` : 'All done 🎉'}
                    </span>
                  </span>
                  <ChevronRight size={22} className="text-chevron" />
                </button>
              );
            })}

            <button
              onClick={surprise}
              className="flex items-center justify-center gap-2 rounded-[22px] border-2 border-dashed py-5 text-[16px] font-bold text-muted transition hover:border-sage hover:text-sage-dark active:scale-[0.99]"
              style={{ borderColor: 'var(--color-dashed)' }}
            >
              <Dices size={20} /> Surprise me
            </button>
          </div>

          {stats && (
            <footer className="mt-8 flex items-center justify-center gap-2 rounded-full bg-sage-tint px-4 py-2.5 text-[14px] font-bold text-sage-dark">
              🔥 {stats.completion}% complete · {stats.total.toLocaleString()} photos in this memory
            </footer>
          )}

          <Button block variant="outline" className="mt-6" onClick={() => navigate(`/m/${memoryId}/library`)}>
            <ChevronLeft size={20} /> Back to Library
          </Button>
        </>
      )}
    </div>
  );
}
