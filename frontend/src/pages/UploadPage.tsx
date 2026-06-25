import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, ImagePlus } from 'lucide-react';
import { clsx } from 'clsx';
import { useMemory } from '../context/MemoryContext';
import { useUploader } from '../hooks/useUploader';
import UploadTile from '../components/UploadTile';
import ProgressBar from '../components/ui/ProgressBar';
import Button from '../components/ui/Button';

export default function UploadPage() {
  const { memory, memoryId, identity } = useMemory();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const up = useUploader(memoryId, identity?.id ?? null);

  if (!memory) return null;

  const pick = () => inputRef.current?.click();
  const allDone = up.total > 0 && !up.inFlight;
  const pct = Math.round(up.overall * 100);

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-xl flex-col">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files) up.addFiles(e.target.files); e.target.value = ''; }}
      />

      <header className="flex items-center gap-2 px-5 pt-4 pb-2 safe-top sm:px-6">
        <Link to={`/m/${memoryId}`} className="flex items-center gap-1 text-[16px] font-bold text-muted hover:text-ink">
          <ChevronLeft size={20} /> {up.inFlight ? 'Uploading' : 'Back'}
        </Link>
      </header>

      <div className="flex-1 px-5 pb-32 sm:px-6">
        {up.total === 0 && (
          <div className="pt-2">
            <h1 className="text-[31px] font-extrabold leading-[1.12] tracking-[-0.02em] text-ink">Add photos</h1>
            <p className="mt-2 text-[17px] leading-relaxed text-muted">
              Pick as many as you like — they upload right away. No forms, no dates to fill in. You can
              add the details later, together.
            </p>

            <button
              onClick={pick}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files) up.addFiles(e.dataTransfer.files);
              }}
              className={clsx(
                'mt-7 flex w-full flex-col items-center justify-center gap-3 rounded-[26px] border-2 border-dashed bg-sand px-6 py-16 text-center transition',
                dragOver ? 'border-terracotta bg-tint' : 'border-[var(--color-dashed)] hover:border-terracotta',
              )}
            >
              <span className="grid h-20 w-20 place-items-center rounded-[24px] bg-white text-[34px] shadow-card">📷</span>
              <span className="mt-2 text-[20px] font-extrabold text-ink">Choose photos</span>
              <span className="text-[15px] text-muted">From your camera roll, or drag them here</span>
            </button>
          </div>
        )}

        {up.total > 0 && (
          <div className="pt-2">
            {!allDone ? (
              <div className="rounded-[22px] border border-line bg-white p-5 shadow-card">
                <div className="flex items-baseline justify-between">
                  <span className="text-[19px] font-extrabold text-ink">Uploading…</span>
                  <span className="text-[19px] font-extrabold text-terracotta">{pct}%</span>
                </div>
                <p className="mt-1 text-[15px] font-medium text-muted2">
                  {up.finished} of {up.total} photo{up.total === 1 ? '' : 's'} complete
                </p>
                <ProgressBar value={up.overall} className="mt-3" />
              </div>
            ) : (
              <div className="flex flex-col items-center rounded-[22px] border border-line bg-white px-5 py-7 text-center shadow-card animate-scale-in">
                <span className="grid h-[88px] w-[88px] place-items-center rounded-full bg-sage-tint text-sage">
                  <Check size={48} strokeWidth={3} />
                </span>
                <h2 className="mt-4 text-[24px] font-extrabold tracking-[-0.01em] text-ink">
                  {up.succeeded > 0 ? 'Your photos are safely saved' : 'All set'}
                </h2>
                <p className="mt-2 text-[16px] leading-relaxed text-muted">
                  {up.succeeded > 0
                    ? `${up.succeeded} photo${up.succeeded === 1 ? '' : 's'} added. Thank you for helping preserve them.`
                    : 'Nothing new to add.'}
                  {up.duplicates > 0 && ` ${up.duplicates} were already here.`}
                  {up.failed > 0 && ` ${up.failed} couldn’t be added.`}
                </p>
              </div>
            )}

            <div className="mt-6">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-[13px] font-bold uppercase tracking-[0.07em] text-faint">This batch</span>
                <button onClick={pick} className="text-[15px] font-bold text-terracotta hover:underline">+ Add more</button>
              </div>
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {up.items.map((it) => (
                  <UploadTile key={it.id} item={it} onRemove={up.removeItem} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky actions */}
      <div className="sticky bottom-0 border-t border-line-divider bg-warm/95 px-5 py-4 backdrop-blur safe-bottom sm:px-6">
        {up.total === 0 ? (
          <Button block onClick={pick}><ImagePlus size={20} /> Choose photos</Button>
        ) : allDone ? (
          <div className="flex flex-col gap-2.5">
            <Button block onClick={() => navigate(`/m/${memoryId}/library`)}>Go to Library</Button>
            <Button block variant="outline" onClick={up.reset}>Upload more</Button>
            <p className="text-center text-[14px] text-faint">Add dates, names, and stories anytime — no rush.</p>
          </div>
        ) : (
          <p className="text-center text-[15px] font-semibold text-muted">
            Keep this screen open while {up.total - up.finished} photo{up.total - up.finished === 1 ? '' : 's'} finish uploading…
          </p>
        )}
      </div>
    </div>
  );
}
