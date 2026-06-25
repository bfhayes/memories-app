import { useLocation, useNavigate } from 'react-router-dom';
import { useMemory } from '../context/MemoryContext';
import { useStats } from '../hooks/queries';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';

const CONFETTI = ['#C4704F', '#7A8B6F', '#C9A14A', '#8C7BA0', '#B08A6B'];
const DOTS = Array.from({ length: 18 }, (_, i) => ({
  left: (i * 53) % 100,
  delay: (i % 6) * 0.25,
  color: CONFETTI[i % CONFETTI.length],
  size: 8 + (i % 3) * 4,
}));

export default function DetectiveDonePage() {
  const { memory, memoryId } = useMemory();
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: { completed?: number; missionTitle?: string } };
  const { data: stats } = useStats(memoryId);
  const completed = state?.completed ?? 0;

  if (!memory) return null;

  return (
    <div className="relative mx-auto flex min-h-[100dvh] max-w-xl flex-col items-center overflow-hidden px-6 pb-12 pt-10 text-center safe-top">
      {/* Confetti */}
      <div className="pointer-events-none absolute inset-0">
        {DOTS.map((d, i) => (
          <span
            key={i}
            className="absolute top-0 rounded-[2px]"
            style={{
              left: `${d.left}%`,
              width: d.size,
              height: d.size,
              background: d.color,
              animation: `confettiFall 2.6s ${d.delay}s ease-in both`,
            }}
          />
        ))}
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center">
        <span className="grid h-[104px] w-[104px] place-items-center rounded-full bg-terracotta text-[52px] shadow-btn animate-pop-in">🏆</span>
        <h1 className="mt-6 text-[33px] font-extrabold tracking-[-0.02em] text-ink">You’re on a roll!</h1>
        <p className="mt-3 max-w-xs text-[17px] leading-relaxed text-muted">
          {completed > 0
            ? `You added ${completed} detail${completed === 1 ? '' : 's'} just now. Thank you for keeping these memories alive.`
            : 'Thank you for helping preserve these memories.'}
        </p>

        {stats && (
          <div className="mt-8 w-full rounded-[22px] border border-line bg-white p-5 shadow-card">
            <div className="flex items-baseline justify-between">
              <span className="text-[16px] font-extrabold text-ink">{memory.name}</span>
              <span className="text-[16px] font-extrabold text-terracotta">{stats.completion}% complete</span>
            </div>
            <ProgressBar value={stats.completion / 100} className="mt-2.5" />
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <Stat label="added now" value={completed} />
              <Stat label="still to do" value={stats.needsInfo} />
              <Stat label="contributors" value={stats.contributors} />
            </div>
          </div>
        )}
      </div>

      <div className="relative mt-6 w-full">
        <Button block onClick={() => navigate(`/m/${memoryId}/detective`)}>Keep going</Button>
        <Button block variant="outline" className="mt-2.5" onClick={() => navigate(`/m/${memoryId}/library`)}>Done for now</Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[14px] bg-sand py-3">
      <div className="text-[22px] font-extrabold text-ink">{value.toLocaleString()}</div>
      <div className="text-[12px] font-bold uppercase tracking-[0.04em] text-faint">{label}</div>
    </div>
  );
}
