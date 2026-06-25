import { useState } from 'react';
import { X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { useSuggestions } from '../../hooks/queries';
import { useToast } from '../../context/ToastContext';
import Sheet from '../ui/Sheet';
import Button from '../ui/Button';
import DateEditor from '../editors/DateEditor';
import ChipSuggestInput from '../editors/ChipSuggestInput';
import type { PhotoDate } from '../../lib/types';

export default function BulkEditSheet({
  open, onClose, memoryId, photoIds, onApplied,
}: {
  open: boolean;
  onClose: () => void;
  memoryId: number;
  photoIds: number[];
  onApplied: () => void;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const { data: suggestions } = useSuggestions(memoryId);
  const [date, setDate] = useState<PhotoDate | null>(null);
  const [location, setLocation] = useState('');
  const [people, setPeople] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const n = photoIds.length;
  const hasChanges = (date && date.confidence !== 'unknown') || location.trim() || people.length > 0 || tags.length > 0;

  const apply = async () => {
    if (!hasChanges) return;
    setBusy(true);
    try {
      await api.bulkEdit(memoryId, {
        photoIds,
        date: date && date.confidence !== 'unknown' ? { value: date.value ?? '', confidence: date.confidence, label: date.label ?? undefined } : undefined,
        location: location.trim() || undefined,
        addPeople: people.length ? people : undefined,
        addTags: tags.length ? tags : undefined,
      });
      qc.invalidateQueries({ queryKey: ['photos', memoryId] });
      qc.invalidateQueries({ queryKey: ['stats', memoryId] });
      qc.invalidateQueries({ queryKey: ['suggestions', memoryId] });
      toast.show(`Updated ${n} photo${n === 1 ? '' : 's'}`, 'sage');
      setDate(null); setLocation(''); setPeople([]); setTags([]);
      onApplied();
    } finally {
      setBusy(false);
    }
  };

  const removeFrom = (list: string[], v: string, set: (l: string[]) => void) => set(list.filter((x) => x !== v));

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Editing ${n} photo${n === 1 ? '' : 's'} together`}
      footer={
        <Button block onClick={apply} disabled={!hasChanges || busy}>
          {busy ? 'Applying…' : `Apply to all ${n} photo${n === 1 ? '' : 's'}`}
        </Button>
      }
    >
      <p className="mb-5 text-[15px] leading-relaxed text-muted">
        Add the same details to every selected photo — perfect for a batch from the same day or event.
      </p>

      <div className="flex flex-col gap-6">
        <div>
          <h4 className="mb-2.5 text-[13px] font-bold uppercase tracking-[0.06em] text-faint">📅 Date</h4>
          <DateEditor value={date ?? { value: null, confidence: 'unknown', label: null }} onChange={setDate} />
        </div>

        <div>
          <h4 className="mb-2.5 text-[13px] font-bold uppercase tracking-[0.06em] text-faint">📍 Location</h4>
          <ChipSuggestInput
            placeholder="Town, place, or address"
            suggestions={suggestions?.locations ?? []}
            existing={location ? [location] : []}
            onAdd={(v) => setLocation(v)}
          />
          {location && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-chip px-3 py-1.5 text-[15px] font-bold text-body">
              {location}<button onClick={() => setLocation('')}><X size={15} /></button>
            </span>
          )}
        </div>

        <div>
          <h4 className="mb-2.5 text-[13px] font-bold uppercase tracking-[0.06em] text-faint">👤 People</h4>
          {people.length > 0 && (
            <div className="mb-2.5 flex flex-wrap gap-2">
              {people.map((p) => (
                <span key={p} className="flex items-center gap-1.5 rounded-full bg-chip px-3 py-1.5 text-[15px] font-bold text-body">
                  {p}<button onClick={() => removeFrom(people, p, setPeople)}><X size={15} /></button>
                </span>
              ))}
            </div>
          )}
          <ChipSuggestInput
            placeholder="Add a person"
            suggestions={(suggestions?.people ?? []).map((p) => p.name)}
            existing={people}
            onAdd={(v) => setPeople((prev) => [...prev, v])}
          />
        </div>

        <div>
          <h4 className="mb-2.5 text-[13px] font-bold uppercase tracking-[0.06em] text-faint">🏷️ Tags</h4>
          {tags.length > 0 && (
            <div className="mb-2.5 flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t} className="flex items-center gap-1.5 rounded-full bg-chip px-3 py-1.5 text-[15px] font-bold text-body">
                  {t}<button onClick={() => removeFrom(tags, t, setTags)}><X size={15} /></button>
                </span>
              ))}
            </div>
          )}
          <ChipSuggestInput
            placeholder="Add a tag"
            suggestions={suggestions?.tags ?? []}
            existing={tags}
            onAdd={(v) => setTags((prev) => [...prev, v])}
          />
        </div>
      </div>
    </Sheet>
  );
}
