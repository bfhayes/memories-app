import type {
  MemorySummary, MemoryDetail, Contributor, PhotoPage, PhotoSummary,
  PhotoDetail, Person, Suggestions, MemoryStats,
} from '../lib/types';

const BASE = '/api';

// The acting identity, set by MemoryProvider. Attributed on every write.
let activeContributorId: number | null = null;
export function setActiveContributor(id: number | null) {
  activeContributorId = id;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const isForm = options.body instanceof FormData;
  if (!isForm && options.body !== undefined) headers.set('Content-Type', 'application/json');
  if (activeContributorId != null) headers.set('X-Contributor-Id', String(activeContributorId));

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch { /* ignore */ }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  // Memories
  getMemories: () => request<MemorySummary[]>('/memories'),
  getMemory: (id: number) => request<MemoryDetail>(`/memories/${id}`),
  createMemory: (data: { name: string; password: string; yearLabel?: string; coverTone?: string }) =>
    request<MemorySummary>('/memories', { method: 'POST', body: JSON.stringify(data) }),
  unlockMemory: (id: number, password: string) =>
    request<{ ok: boolean }>(`/memories/${id}/unlock`, { method: 'POST', body: JSON.stringify({ password }) }),

  // Identity
  getContributors: (id: number) => request<Contributor[]>(`/memories/${id}/contributors`),
  addContributor: (id: number, name: string) =>
    request<Contributor>(`/memories/${id}/contributors`, { method: 'POST', body: JSON.stringify({ name }) }),

  // Library
  getPhotos: (id: number, params: Record<string, string | number | undefined>) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') qs.set(k, String(v));
    return request<PhotoPage>(`/memories/${id}/photos?${qs.toString()}`);
  },
  getStats: (id: number) => request<MemoryStats>(`/memories/${id}/stats`),
  getSuggestions: (id: number) => request<Suggestions>(`/memories/${id}/suggestions`),
  uploadPhoto: (id: number, form: FormData) =>
    request<{ duplicate: boolean; photo: PhotoSummary }>(`/memories/${id}/photos`, { method: 'POST', body: form }),
  bulkEdit: (id: number, body: {
    photoIds: number[];
    date?: { value: string; confidence: string; label?: string };
    location?: string;
    addPeople?: string[];
    addTags?: string[];
  }) => request<{ ok: boolean; updated: number }>(`/memories/${id}/photos/bulk`, { method: 'PATCH', body: JSON.stringify(body) }),

  // Photo detail
  getPhoto: (photoId: number) => request<PhotoDetail>(`/photos/${photoId}`),
  patchPhoto: (photoId: number, body: Record<string, unknown>) =>
    request<PhotoDetail>(`/photos/${photoId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deletePhoto: (photoId: number) =>
    request<{ ok: boolean; id: number }>(`/photos/${photoId}`, { method: 'DELETE' }),
  addPerson: (photoId: number, name: string) =>
    request<Person>(`/photos/${photoId}/people`, { method: 'POST', body: JSON.stringify({ name }) }),
  removePerson: (photoId: number, personId: number) =>
    request<{ ok: boolean }>(`/photos/${photoId}/people`, { method: 'DELETE', body: JSON.stringify({ personId }) }),
  addTag: (photoId: number, tag: string) =>
    request<{ tag: string }>(`/photos/${photoId}/tags`, { method: 'POST', body: JSON.stringify({ tag }) }),
  removeTag: (photoId: number, tag: string) =>
    request<{ ok: boolean }>(`/photos/${photoId}/tags`, { method: 'DELETE', body: JSON.stringify({ tag }) }),
};
