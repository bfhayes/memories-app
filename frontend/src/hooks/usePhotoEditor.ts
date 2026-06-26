import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { PhotoDate, PhotoDetail } from '../lib/types';

/**
 * Autosave editor for a single photo. Every setter persists immediately (no Save button),
 * updates the cache optimistically, and reconciles with the server. Exposes `saving` and
 * `savedAt` for the "✓ Saved automatically" indicator.
 */
export function usePhotoEditor(photoId: number, memoryId: number) {
  const qc = useQueryClient();
  const [pending, setPending] = useState(0);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const patchCache = useCallback(
    (updater: (p: PhotoDetail) => PhotoDetail) => {
      qc.setQueryData<PhotoDetail>(['photo', photoId], (prev) => (prev ? updater(prev) : prev));
    },
    [qc, photoId],
  );

  const invalidateLists = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['photos', memoryId] });
    qc.invalidateQueries({ queryKey: ['stats', memoryId] });
    qc.invalidateQueries({ queryKey: ['suggestions', memoryId] });
  }, [qc, memoryId]);

  const run = useCallback(
    async (optimistic: (() => void) | null, serverCall: () => Promise<PhotoDetail | null>) => {
      setPending((p) => p + 1);
      setError(null);
      optimistic?.();
      try {
        const fresh = await serverCall();
        if (fresh) qc.setQueryData(['photo', photoId], fresh);
        setSavedAt(Date.now());
        invalidateLists();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not save');
        qc.invalidateQueries({ queryKey: ['photo', photoId] }); // rollback via refetch
      } finally {
        setPending((p) => p - 1);
      }
    },
    [qc, photoId, invalidateLists],
  );

  return {
    saving: pending > 0,
    savedAt,
    error,

    setDate: (date: PhotoDate) =>
      run(() => patchCache((p) => ({ ...p, date })), () => api.patchPhoto(photoId, { date })),

    setLocation: (location: string) =>
      run(
        () => patchCache((p) => ({ ...p, location: location.trim() || null })),
        () => api.patchPhoto(photoId, { location }),
      ),

    setAbout: (about: string) =>
      run(
        () => patchCache((p) => ({ ...p, about: about.trim() || null })),
        () => api.patchPhoto(photoId, { about }),
      ),

    setNotes: (notes: string) =>
      run(
        () => patchCache((p) => ({ ...p, notes: notes.trim() || null })),
        () => api.patchPhoto(photoId, { notes }),
      ),

    addPerson: (name: string) =>
      run(null, async () => {
        await api.addPerson(photoId, name);
        return api.getPhoto(photoId);
      }),

    removePerson: (personId: number) =>
      run(
        () => patchCache((p) => ({ ...p, people: p.people.filter((x) => x.id !== personId) })),
        async () => {
          await api.removePerson(photoId, personId);
          return null;
        },
      ),

    addTag: (tag: string) =>
      run(
        () => patchCache((p) => (p.tags.includes(tag) ? p : { ...p, tags: [...p.tags, tag] })),
        async () => {
          await api.addTag(photoId, tag);
          return null;
        },
      ),

    removeTag: (tag: string) =>
      run(
        () => patchCache((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) })),
        async () => {
          await api.removeTag(photoId, tag);
          return null;
        },
      ),
  };
}

export type PhotoEditor = ReturnType<typeof usePhotoEditor>;
