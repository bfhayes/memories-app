import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Heart, X, Trash2, MapPin } from 'lucide-react';
import { clsx } from 'clsx';
import { useMemory } from '../context/MemoryContext';
import { usePhoto, useSuggestions } from '../hooks/queries';
import { usePhotoEditor } from '../hooks/usePhotoEditor';
import { useLike } from '../hooks/useLike';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import { confidenceLabel, formatDay, formatFileSize, relativeTime } from '../lib/format';
import Photo from '../components/ui/Photo';
import Avatar from '../components/ui/Avatar';
import Spinner from '../components/ui/Spinner';
import Sheet from '../components/ui/Sheet';
import Button from '../components/ui/Button';
import AutosaveNote from '../components/ui/AutosaveNote';
import MetaCard from '../components/detail/MetaCard';
import FieldHistory from '../components/detail/FieldHistory';
import DateEditor from '../components/editors/DateEditor';
import ChipSuggestInput from '../components/editors/ChipSuggestInput';
import type { PhotoDate } from '../lib/types';

function AutoTextarea({
  value, placeholder, onSave,
}: { value: string; placeholder: string; onSave: (v: string) => void }) {
  const [text, setText] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);
  const editingRef = useRef(false); // focused or has unsaved keystrokes
  const debounced = useDebouncedCallback(onSave, 700);

  // Adopt the server value ONLY when not actively editing, so background polling / a concurrent
  // editor never clobbers what you're typing. Your save still wins (and prior text is kept in history).
  useEffect(() => { if (!editingRef.current) setText(value); }, [value]);
  useEffect(() => {
    const el = ref.current;
    if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; }
  }, [text]);

  return (
    <textarea
      ref={ref}
      value={text}
      placeholder={placeholder}
      onFocus={() => { editingRef.current = true; }}
      onChange={(e) => { editingRef.current = true; setText(e.target.value); debounced(e.target.value); }}
      onBlur={() => { onSave(text); editingRef.current = false; }}
      rows={2}
      className="w-full resize-none bg-transparent text-[17px] font-medium leading-[1.55] text-body placeholder:text-placeholder outline-none"
    />
  );
}

export default function PhotoDetailPage() {
  const { memoryId } = useMemory();
  const { photoId: photoIdParam } = useParams();
  const photoId = Number(photoIdParam);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();

  const { data: photo, isLoading } = usePhoto(photoId);
  const { data: suggestions } = useSuggestions(memoryId);
  const editor = usePhotoEditor(photoId, memoryId);
  const toggleLike = useLike(memoryId);

  const [dateOpen, setDateOpen] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);

  if (isLoading) {
    return <div className="grid min-h-[100dvh] place-items-center text-terracotta"><Spinner size={28} /></div>;
  }
  if (!photo) {
    return <div className="grid min-h-[100dvh] place-items-center text-muted">Photo not found.</div>;
  }

  const dateKnown = photo.date.confidence !== 'unknown' && !!photo.date.label;
  const conf = confidenceLabel(photo.date.confidence);

  const remove = async () => {
    if (!confirm('Remove this photo from the memory? This can’t be undone.')) return;
    await api.deletePhoto(photoId);
    qc.invalidateQueries({ queryKey: ['photos', memoryId] });
    qc.invalidateQueries({ queryKey: ['stats', memoryId] });
    toast.show('Photo removed');
    navigate(`/m/${memoryId}/library`);
  };

  return (
    <div className="mx-auto min-h-[100dvh] max-w-xl pb-16">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-page/90 px-4 py-3 backdrop-blur safe-top sm:px-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-[16px] font-bold text-muted hover:text-ink">
          <ChevronLeft size={20} /> Library
        </button>
        <span className="text-[15px] font-bold text-faint">Photo</span>
        <button
          onClick={() => toggleLike(photoId, photo.likedByMe)}
          aria-label={photo.likedByMe ? 'Remove love' : 'Love this photo'}
          aria-pressed={photo.likedByMe}
          className={clsx('flex h-10 items-center gap-1.5 rounded-full px-2.5 transition active:scale-90', photo.likedByMe ? 'text-terracotta' : 'text-muted2 hover:text-ink')}
        >
          <Heart size={24} fill={photo.likedByMe ? 'currentColor' : 'none'} strokeWidth={2.2} />
          {photo.likeCount > 0 && <span className="text-[16px] font-extrabold">{photo.likeCount}</span>}
        </button>
      </header>

      <div className="px-4 sm:px-6">
        <button onClick={() => setLightbox(true)} className="block w-full">
          <Photo
            src={photo.thumbUrl}
            tone={photo.tone}
            contain
            loading="eager"
            className="w-full rounded-[22px] shadow-feature"
            style={{ aspectRatio: photo.width && photo.height ? `${photo.width} / ${photo.height}` : '4 / 3', maxHeight: '60vh' }}
          />
        </button>

        <div className="mt-3 flex justify-center">
          <AutosaveNote saving={editor.saving} savedAt={editor.savedAt} error={editor.error} />
        </div>

        <div className="mt-4 flex flex-col gap-3.5">
          {/* DATE — emphasized, priority field */}
          <MetaCard
            label="When was this taken?"
            emphasized
            right={<FieldHistory
              activity={photo.activity}
              field="date"
              label="Date"
              onRestore={(p) => { try { const d = JSON.parse(p); editor.setDate({ value: d.value, confidence: d.confidence, label: d.label }); } catch { /* ignore */ } }}
              renderPrev={(p) => { try { return JSON.parse(p).label || 'a date'; } catch { return p; } }}
            />}
          >
            <button onClick={() => setDateOpen(true)} className="w-full text-left">
              {dateKnown ? (
                <div className="flex items-center gap-2.5">
                  <span className="text-[24px] font-extrabold tracking-[-0.01em] text-ink">{photo.date.label}</span>
                  {conf && photo.date.confidence !== 'exact' && (
                    <span className="rounded-full bg-sage-tint px-2.5 py-1 text-[13px] font-bold text-sage-dark">{conf}</span>
                  )}
                </div>
              ) : (
                <span className="text-[20px] font-extrabold text-terracotta/80">Add a date</span>
              )}
              <p className="mt-2 text-[14px] font-semibold text-muted2">⭐ The most helpful thing to add</p>
            </button>
          </MetaCard>

          {/* PEOPLE */}
          <MetaCard label="Who’s in this photo?" glyph="👤">
            {photo.people.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {photo.people.map((p) => (
                  <span key={p.id} className="flex items-center gap-2 rounded-full bg-chip py-1.5 pl-1.5 pr-2.5">
                    <Avatar name={p.name} accent={p.accent} size={26} />
                    <span className="text-[15px] font-bold text-ink">{p.name}</span>
                    <button onClick={() => editor.removePerson(p.id)} aria-label={`Remove ${p.name}`} className="text-placeholder hover:text-ink">
                      <X size={16} strokeWidth={2.6} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <ChipSuggestInput
              placeholder="Add a person"
              suggestions={(suggestions?.people ?? []).map((p) => p.name)}
              existing={photo.people.map((p) => p.name)}
              onAdd={(name) => editor.addPerson(name)}
            />
          </MetaCard>

          {/* LOCATION */}
          <MetaCard
            label="Where was this?"
            glyph="📍"
            right={<FieldHistory activity={photo.activity} field="location" label="Location" onRestore={(p) => editor.setLocation(p)} />}
          >
            {photo.location && !editingLocation ? (
              <button onClick={() => setEditingLocation(true)} className="flex w-full items-center gap-2 text-left">
                <MapPin size={18} className="text-terracotta" />
                <span className="text-[17px] font-semibold text-body">{photo.location}</span>
              </button>
            ) : editingLocation || photo.location ? (
              <ChipSuggestInput
                placeholder="Town, place, or address"
                suggestions={suggestions?.locations ?? []}
                existing={[]}
                onAdd={(loc) => { editor.setLocation(loc); setEditingLocation(false); }}
              />
            ) : (
              <button
                onClick={() => setEditingLocation(true)}
                className="flex w-full items-center gap-3 rounded-[14px] border-2 border-dashed px-4 py-4 text-left transition hover:border-terracotta"
                style={{ borderColor: 'var(--color-dashed)' }}
              >
                <span className="text-[22px]">📍</span>
                <span>
                  <span className="block text-[16px] font-bold text-ink">Add a location</span>
                  <span className="block text-[14px] text-muted">Do you know where this was taken?</span>
                </span>
              </button>
            )}
          </MetaCard>

          {/* ABOUT */}
          <MetaCard
            label="About this photo"
            glyph="✍️"
            right={<FieldHistory activity={photo.activity} field="about" label="Story" onRestore={(p) => editor.setAbout(p)} />}
          >
            <AutoTextarea
              value={photo.about ?? ''}
              placeholder="Share what you remember — who, what, the story behind it…"
              onSave={(v) => v !== (photo.about ?? '') && editor.setAbout(v)}
            />
          </MetaCard>

          {/* TAGS */}
          <MetaCard label="Tags" glyph="🏷️">
            {photo.tags.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {photo.tags.map((t) => (
                  <span key={t} className="flex items-center gap-1.5 rounded-full bg-chip px-3 py-1.5 text-[15px] font-bold text-body">
                    {t}
                    <button onClick={() => editor.removeTag(t)} aria-label={`Remove ${t}`} className="text-placeholder hover:text-ink">
                      <X size={15} strokeWidth={2.6} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <ChipSuggestInput
              placeholder="Add a tag"
              suggestions={suggestions?.tags ?? []}
              existing={photo.tags}
              onAdd={(t) => editor.addTag(t)}
            />
          </MetaCard>

          {/* PHOTO DETAILS */}
          <MetaCard label="Photo details">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[15px]">
              <dt className="font-semibold text-faint">Added</dt>
              <dd className="text-right font-medium text-body2">{formatDay(photo.meta.added)}</dd>
              <dt className="font-semibold text-faint">Source</dt>
              <dd className="text-right font-medium text-body2">{photo.meta.source}</dd>
              <dt className="font-semibold text-faint">File</dt>
              <dd className="truncate text-right font-medium text-body2">{photo.meta.file ?? '—'} · {formatFileSize(photo.meta.fileSize)}</dd>
              <dt className="font-semibold text-faint">Photo ID</dt>
              <dd className="text-right font-medium text-body2">#{photo.meta.photoId}</dd>
            </dl>
          </MetaCard>

          {/* CONTRIBUTORS */}
          <MetaCard label="Contributors · who’s helped">
            {photo.activity.length === 0 ? (
              <p className="text-[15px] text-muted">No activity yet.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {photo.activity.map((a) => (
                  <li key={a.id} className="flex items-center gap-3">
                    <Avatar name={a.name} accent={a.accent} size={34} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] leading-tight text-body">
                        <span className="font-extrabold text-ink">{a.name}</span> {a.detail}
                      </p>
                      <p className="text-[13px] text-faint">{relativeTime(a.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </MetaCard>

          <button onClick={remove} className="mx-auto mt-2 flex items-center gap-1.5 text-[15px] font-bold text-muted2 hover:text-[#A23D2F]">
            <Trash2 size={16} /> Remove photo
          </button>
        </div>
      </div>

      {/* Date editor sheet */}
      <Sheet
        open={dateOpen}
        onClose={() => setDateOpen(false)}
        title="When was this taken?"
        footer={<Button block onClick={() => setDateOpen(false)}>Done</Button>}
      >
        <p className="mb-4 text-[15px] leading-relaxed text-muted">
          Even a rough guess is a huge help. Pick how sure you are.
        </p>
        <DateEditor value={photo.date} onChange={(d: PhotoDate) => editor.setDate(d)} />
      </Sheet>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4 animate-fade-in" onClick={() => setLightbox(false)}>
          <img src={photo.url} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
          <button className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white safe-top" aria-label="Close">
            <X size={24} />
          </button>
        </div>
      )}
    </div>
  );
}
