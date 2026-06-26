import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { LibraryFilter, LibrarySort } from '../lib/types';

export function useMemories() {
  return useQuery({ queryKey: ['memories'], queryFn: api.getMemories });
}

export function useContributors(memoryId: number, enabled = true) {
  return useQuery({
    queryKey: ['contributors', memoryId],
    queryFn: () => api.getContributors(memoryId),
    enabled: enabled && memoryId > 0,
  });
}

export function useStats(memoryId: number, enabled = true) {
  return useQuery({
    queryKey: ['stats', memoryId],
    queryFn: () => api.getStats(memoryId),
    enabled: enabled && memoryId > 0,
    refetchInterval: 8000, // live progress as others contribute (pauses when tab is hidden)
  });
}

export function useSuggestions(memoryId: number, enabled = true) {
  return useQuery({
    queryKey: ['suggestions', memoryId],
    queryFn: () => api.getSuggestions(memoryId),
    enabled: enabled && memoryId > 0,
    staleTime: 1000 * 60,
  });
}

export interface LibraryParams {
  filter?: LibraryFilter;
  sort?: LibrarySort;
  q?: string;
  decade?: number;
  person?: number;
  tag?: string;
  contributor?: number;
}

const PAGE_SIZE = 30;

export function usePhotosInfinite(
  memoryId: number,
  params: LibraryParams,
  enabled = true,
  pollMs: number | false = false,
) {
  return useInfiniteQuery({
    queryKey: ['photos', memoryId, params],
    initialPageParam: 0,
    enabled: enabled && memoryId > 0,
    refetchInterval: pollMs,
    queryFn: ({ pageParam }) =>
      api.getPhotos(memoryId, {
        filter: params.filter,
        sort: params.sort,
        q: params.q,
        decade: params.decade,
        person: params.person,
        tag: params.tag,
        contributor: params.contributor,
        limit: PAGE_SIZE,
        offset: pageParam,
      }),
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
  });
}

export function usePhoto(photoId: number) {
  return useQuery({
    queryKey: ['photo', photoId],
    queryFn: () => api.getPhoto(photoId),
    enabled: photoId > 0,
    refetchInterval: 5000, // see others' edits within a few seconds (pauses when tab is hidden)
  });
}
