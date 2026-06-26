import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { X, Mic, SkipForward, Check } from 'lucide-react';
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
import type { PhotoDate, Person } from '../lib/types';

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
  const [storyOpen, setStoryOpen] = useState(false); // optional "tell more" on non-story missions

  // Per-photo drafts
  const [draftDate, setDraftDate] = useState<PhotoDate>({ value: null, confidence: 'unknown', label: null });
  const [draftText, setDraftText] = useState('');
  const [taggedPeople, setTaggedPeople] = useState<Person[]>([]); // tag several before advancing
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
    setStoryOpen(false);
    setTaggedPeople([]);
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
  const advance = () => { if (busy) return; setIndex((i) => i + 1); };
  const cheer = CHEERS[completed % CHEERS.length];

  // The optional "tell more" story is captured in draftText on non-story missions. Save it too when
  // the user moves on, so going above-and-beyond never gets lost. (Only when the photo has no story.)
  const flushStory = async () => {
    if (mission.key !== 'story' && current && !current.hasStory && draftText.trim()) {
      await api.patchPhoto(current.id, { about: draftText.trim() });
      return true;
    }
    return false;
  };

  const saveAndNext = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); await flushStory(); setCompleted((c) => c + 1); advance(); }
    finally { setBusy(false); }
  };

  const skip = async () => {
    if (busy) return;
    setBusy(true);
    try { if (await flushStory()) setCompleted((c) => c + 1); }
    finally { setBusy(false); }
    setIndex((i) => i + 1);
  };

  // People mission: tag several before advancing. Each tap saves immediately (optimistically).
  const isTagged = (name: string) => taggedPeople.some((t) => t.name.toLowerCase() === name.toLowerCase());
  const togglePerson = async (p: Person) => {
    if (!current) return;
    if (isTagged(p.name)) {
      const existing = taggedPeople.find((t) => t.name.toLowerCase() === p.name.toLowerCase())!;
      setTaggedPeople((prev) => prev.filter((t) => t.id !== existing.id));
      try { await api.removePerson(current.id, existing.id); } catch { /* will reconcile on reload */ }
    } else {
      setTaggedPeople((prev) => [...prev, p]); // optimistic (suggested people carry their real id)
      try { await api.addPerson(current.id, p.name); } catch { /* ignore */ }
    }
  };
  const addNewPerson = async (name: string) => {
    if (!current || isTagged(name)) return;
    try { const person = await api.addPerson(current.id, name); setTaggedPeople((prev) => [...prev, person]); } catch { /* ignore */ }
  };
  const removeTagged = async (p: Person) => {
    if (!current) return;
    setTaggedPeople((prev) => prev.filter((t) => t.id !== p.id));
    try { await api.removePerson(current.id, p.id); } catch { /* ignore */ }
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

      {/* Photo — shown whole (uncropped) at its natural aspect ratio, capped in height. */}
      <div className="mt-5 flex justify-center">
        <Photo
          src={current.thumbUrl}
          tone={current.tone}
          contain
          loading="eager"
          className="w-full rounded-[22px] shadow-feature"
          style={{ aspectRatio: current.width && current.height ? `${current.width} / ${current.height}` : '4 / 3', maxHeight: '42vh' }}
        />
      </div>

      <h2 className="mt-5 text-center text-[24px] font-extrabold tracking-[-0.01em] text-ink">{mission.prompt}</h2>

      {/* Mission editor */}
      <div className="mt-4 flex-1">
        {mission.key === 'date' && (
          <DateEditor value={draftDate} onChange={setDraftDate} />
        )}

        {mission.key === 'people' && (
          <div>
            {taggedPeople.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {taggedPeople.map((p) => (
                  <span key={p.id} className="flex items-center gap-1.5 rounded-full bg-terracotta py-1.5 pl-2.5 pr-2 text-[15px] font-bold text-white">
                    {p.name}
                    <button onClick={() => removeTagged(p)} aria-label={`Remove ${p.name}`} className="text-white/80 hover:text-white">
                      <X size={15} strokeWidth={2.6} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="mb-2 text-[14px] font-semibold text-muted">Tap everyone you recognize — there’s often more than one.</p>
            <div className="grid grid-cols-2 gap-2.5">
              {(suggestions?.people ?? []).slice(0, 8).map((p) => {
                const sel = isTagged(p.name);
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePerson(p)}
                    className={clsx(
                      'flex items-center gap-2.5 rounded-[16px] border px-3 py-3 text-left shadow-card transition active:scale-95',
                      sel ? 'border-terracotta bg-tint' : 'border-line bg-white',
                    )}
                  >
                    <Avatar name={p.name} accent={p.accent} size={34} />
                    <span className="min-w-0 flex-1 truncate text-[16px] font-bold text-ink">{p.name}</span>
                    {sel && <Check size={18} strokeWidth={3} className="shrink-0 text-terracotta" />}
                  </button>
                );
              })}
            </div>
            <div className="mt-3">
              <ChipSuggestInput
                placeholder="Add someone new"
                suggestions={[]}
                existing={taggedPeople.map((p) => p.name)}
                onAdd={(name) => addNewPerson(name)}
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

        {/* Optional: go above and beyond — add a story even when this isn't the story mission. */}
        {mission.key !== 'story' && !current.hasStory && (
          <div className="mt-5">
            {!storyOpen ? (
              <button
                onClick={() => setStoryOpen(true)}
                className="flex items-center gap-1.5 text-[15px] font-bold text-sage-dark hover:text-sage"
              >
                ✍️ Tell more about this photo
              </button>
            ) : (
              <div>
                <p className="mb-2 text-[14px] font-semibold text-muted">Anything else you remember? (optional)</p>
                <div className="relative">
                  <textarea
                    autoFocus
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    placeholder="Who’s here, what was happening, the story behind it…"
                    rows={3}
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
                <p className="mt-1.5 text-[13px] text-faint">Saved when you continue.</p>
              </div>
            )}
          </div>
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
        {mission.key === 'people' && (
          <Button block disabled={busy || taggedPeople.length === 0} onClick={() => saveAndNext(async () => { /* people already tagged on tap */ })}>
            Next{taggedPeople.length ? ` · ${taggedPeople.length} tagged` : ''}
          </Button>
        )}
        {mission.key === 'story' && (
          <Button block disabled={busy || !draftText.trim()} onClick={() => saveAndNext(async () => { await api.patchPhoto(current.id, { about: draftText.trim() }); })}>
            Save memory
          </Button>
        )}
        <button onClick={skip} disabled={busy} className="flex items-center justify-center gap-1.5 py-2 text-[16px] font-bold text-muted hover:text-ink disabled:opacity-50 disabled:pointer-events-none">
          <SkipForward size={17} /> {mission.key === 'people' ? 'No one I know' : 'Skip for now'}
        </button>
      </div>
    </div>
  );
}
