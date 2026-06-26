import { useCallback, useRef } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { api } from '../api/client';
import type { PhotoDetail, PhotoPage } from '../lib/types';

/**
 * Toggle the signed-in contributor's "love" for a photo. Updates every cached photo list and the
 * photo-detail cache optimistically, then reconciles with the server's authoritative count.
 */
export function useLike(memoryId: number) {
  const qc = useQueryClient();
  const pendingRef = useRef<Set<number>>(new Set());

  return useCallback(async (photoId: number, currentlyLiked: boolean) => {
    // Prevent rapid like→unlike races from landing out of order: ignore a toggle while one is in flight.
    if (pendingRef.current.has(photoId)) return;

    const next = !currentlyLiked;
    const delta = next ? 1 : -1;

    const applyLists = (likeCount: number | null, likedByMe: boolean) => {
      qc.setQueriesData<InfiniteData<PhotoPage>>({ queryKey: ['photos', memoryId] }, (old) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((pg) => ({
            ...pg,
            photos: pg.photos.map((p) =>
              p.id === photoId
                ? { ...p, likedByMe, likeCount: likeCount ?? Math.max(0, p.likeCount + delta) }
                : p,
            ),
          })),
        };
      });
      qc.setQueryData<PhotoDetail>(['photo', photoId], (old) =>
        old ? { ...old, likedByMe, likeCount: likeCount ?? Math.max(0, old.likeCount + delta) } : old,
      );
    };

    pendingRef.current.add(photoId);
    // Cancel in-flight polls so a stale list/detail fetch can't overwrite the optimistic toggle.
    await qc.cancelQueries({ queryKey: ['photos', memoryId] });
    await qc.cancelQueries({ queryKey: ['photo', photoId] });

    applyLists(null, next); // optimistic
    try {
      const res = next ? await api.likePhoto(photoId) : await api.unlikePhoto(photoId);
      applyLists(res.likeCount, res.likedByMe); // authoritative
      qc.invalidateQueries({ queryKey: ['stats', memoryId] });
    } catch {
      qc.invalidateQueries({ queryKey: ['photos', memoryId] });
      qc.invalidateQueries({ queryKey: ['photo', photoId] });
    } finally {
      pendingRef.current.delete(photoId);
    }
  }, [qc, memoryId]);
}
