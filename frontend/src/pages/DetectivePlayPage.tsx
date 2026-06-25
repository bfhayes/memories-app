import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { X, Mic, SkipForward } from 'lucide-react';
import { clsx } from 'clsx';
import { useMemory } from '../context/MemoryContext';
import { usePhotosInfinite, useStats, useSuggestions } from '../hooks/queries';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { api } from '../api/client';
import { missionByKey } from '../lib/missions';
import Photo from '../components/ui/Photo';
import Avatar from '../components/ui/Avatar';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import DateEditor from '../components/editors/DateEditor';
import ChipSuggestInput from '../components/editors/ChipSuggestInput';
import type { PhotoDate } from '../lib/types';

const CHEERS = [
  'That’s a real gift to the family 💛',
  'Every detail helps a memory live on.',
  'You’re bringing this story back to life.',
  'Wonderful — keep them coming!',
  'Future generations thank you 🙏',
];

export default function DetectivePlayPage() {
  const { memory, memoryId } = useMemory();
  const { mission: missionKey } = useParams();
  const mission = missionByKey(missionKey ?? '');
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: stats } = useStats(memoryId);
  const { data: suggestions } = useSuggestions(memoryId);
  const query = usePhotosInfinite(memoryId, { filter: mission?.filter, sort: 'recent_uploaded' }, !!mission);
  const queue = useMemo(() => query.data?.pages.flatMap((p) => p.photos) ?? [], [query.data]);

  const [index, setIndex] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [busy, setBusy] = useState(false);

  // Per-photo drafts
  const [draftDate, setDraftDate] = useState<PhotoDate>({ value: null, confidence: 'unknown', label: null });
  const [draftText, setDraftText] = useState('');
  const textRef = useRef<HTMLTextAreaElement>(null);
  const speech = useSpeechRecognition((t) => setDraftText((prev) => (prev ? `${prev} ${t}` : t)));

  const current = queue[index];

  // Refresh library + stats only when leaving, so the queue stays stable while playing.
  useEffect(() => () => {
    qc.invalidateQueries({ queryKey: ['photos', memoryId] });
    qc.invalidateQueries({ queryKey: ['stats', memoryId] });
  }, [qc, memoryId]);

  // Reset drafts when the photo changes.
  useEffect(() => {
    setDraftDate({ value: null, confidence: 'unknown', label: null });
    setDraftText('');
  }, [current?.id]);

  // When we run off the end, load more or finish.
  useEffect(() => {
    if (!mission || query.isLoading) return;
    if (index < queue.length) return;
    if (query.hasNextPage) { query.fetchNextPage(); return; }
    navigate(`/m/${memoryId}/detective/done`, { state: { completed, missionTitle: mission.title } });
  }, [index, queue.length, query.hasNextPage, query.isLoading, mission]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mission || !memory) { navigate(`/m/${memoryId}/detective`); return null; }

  const total = stats ? mission.count(stats) : queue.length;
  const advance = () => setIndex((i) => i + 1);
  const cheer = CHEERS[completed % CHEERS.length];

  const saveAndNext = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); setCompleted((c) => c + 1); advance(); }
    finally { setBusy(false); }
  };

  if (query.isLoading || (!current && query.hasNextPage)) {
    return <div className="grid min-h-[100dvh] place-items-center text-terracotta"><Spinner size={28} /></div>;
  }
  if (!current) {
    return <div className="grid min-h-[100dvh] place-items-center text-muted"><Spinner size={26} /></div>;
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-xl flex-col px-5 pt-4 safe-top sm:px-6">
      {/* Header + progress */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/m/${memoryId}/detective`)} aria-label="Close" className="grid h-10 w-10 place-items-center rounded-full bg-chip text-muted hover:text-ink active:scale-95">
          <X size={20} strokeWidth={2.4} />
        </button>
        <div className="flex-1">
          <div className="flex items-baseline justify-between">
            <span className="text-[15px] font-extrabold text-ink">{mission.title}</span>
            <span className="text-[14px] font-bold text-muted2">{Math.min(completed + 1, total)} / {total}</span>
          </div>
          <ProgressBar value={total ? completed / total : 0} height={8} className="mt-1.5" color={mission.color} />
        </div>
      </div>

      {/* Photo */}
      <div className="mt-5 flex justify-center">
        <Photo src={current.thumbUrl} tone={current.tone} loading="eager" className="w-full rounded-[22px] shadow-feature" imgClassName="max-h-[42vh] object-contain bg-bezel" />
      </div>

      <h2 className="mt-5 text-center text-[24px] font-extrabold tracking-[-0.01em] text-ink">{mission.prompt}</h2>

      {/* Mission editor */}
      <div className="mt-4 flex-1">
        {mission.key === 'date' && (
          <DateEditor value={draftDate} onChange={setDraftDate} />
        )}

        {mission.key === 'people' && (
          <div>
            <div className="grid grid-cols-2 gap-2.5">
              {(suggestions?.people ?? []).slice(0, 8).map((p) => (
                <button
                  key={p.id}
                  disabled={busy}
                  onClick={() => saveAndNext(async () => { await api.addPerson(current.id, p.name); })}
                  className="flex items-center gap-2.5 rounded-[16px] border border-line bg-white px-3 py-3 text-left shadow-card transition active:scale-95"
                >
                  <Avatar name={p.name} accent={p.accent} size={34} />
                  <span className="truncate text-[16px] font-bold text-ink">{p.name}</span>
                </button>
              ))}
            </div>
            <div className="mt-3">
              <ChipSuggestInput
                placeholder="Add someone new"
                suggestions={[]}
                existing={[]}
                onAdd={(name) => saveAndNext(async () => { await api.addPerson(current.id, name); })}
              />
            </div>
          </div>
        )}

        {mission.key === 'story' && (
          <div>
            <div className="relative">
              <textarea
                ref={textRef}
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                placeholder="Who’s here, what’s happening, what you remember…"
                rows={4}
                className="w-full resize-none rounded-[16px] border border-line bg-white p-4 pr-14 text-[17px] font-medium leading-[1.5] text-body placeholder:text-placeholder outline-none focus:border-terracotta focus:ring-4 focus:ring-terracotta/10"
              />
              {speech.supported && (
                <button
                  onClick={speech.toggle}
                  aria-label="Dictate"
                  className={clsx('absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full transition active:scale-90', speech.listening ? 'bg-terracotta text-white animate-pulse' : 'bg-chip text-muted')}
                >
                  <Mic size={20} />
                </button>
              )}
            </div>
          </div>
        )}

        {mission.key === 'place' && (
          <ChipSuggestInput
            placeholder="Town, place, or address"
            suggestions={suggestions?.locations ?? []}
            existing={[]}
            onAdd={(loc) => saveAndNext(async () => { await api.patchPhoto(current.id, { location: loc }); })}
          />
        )}
      </div>

      {/* Encouragement */}
      {completed > 0 && (
        <div className="mb-2 rounded-full bg-sage-tint px-4 py-2 text-center text-[14px] font-bold text-sage-dark">{cheer}</div>
      )}

      {/* Actions */}
      <div className="sticky bottom-0 flex flex-col gap-2.5 bg-page/90 py-3 backdrop-blur safe-bottom">
        {mission.key === 'date' && (
          <Button block disabled={busy || draftDate.confidence === 'unknown'} onClick={() => saveAndNext(async () => { await api.patchPhoto(current.id, { date: draftDate }); })}>
            Save date
          </Button>
        )}
        {mission.key === 'story' && (
          <Button block disabled={busy || !draftText.trim()} onClick={() => saveAndNext(async () => { await api.patchPhoto(current.id, { about: draftText.trim() }); })}>
            Save memory
          </Button>
        )}
        <button onClick={advance} className="flex items-center justify-center gap-1.5 py-2 text-[16px] font-bold text-muted hover:text-ink">
          <SkipForward size={17} /> {mission.key === 'people' ? 'No one I know' : 'Skip for now'}
        </button>
      </div>
    </div>
  );
}
