import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { processImage } from '../lib/image';

export type UploadStatus =
  | 'queued' | 'processing' | 'uploading' | 'done' | 'duplicate' | 'error';

export interface UploadItem {
  id: string;
  file: File;
  preview: string;
  status: UploadStatus;
  progress: number; // 0..1 (upload phase)
  error?: string;
  photoId?: number;
}

const CONCURRENCY = 3;
const STALL_TIMEOUT_MS = 120_000; // a single upload that makes no progress for this long fails
let counter = 0;

function xhrUpload(
  url: string,
  form: FormData,
  contributorId: number | null,
  onProgress: (p: number) => void,
  register: (xhr: XMLHttpRequest) => void,
): Promise<{ duplicate: boolean; photo: { id: number } }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.timeout = STALL_TIMEOUT_MS;
    if (contributorId != null) xhr.setRequestHeader('X-Contributor-Id', String(contributorId));
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(e.loaded / e.total); };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); }
        catch { reject(new Error('Bad response')); }
      } else {
        let msg = `Upload failed (${xhr.status})`;
        try { msg = JSON.parse(xhr.responseText).error || msg; } catch { /* ignore */ }
        reject(new Error(msg));
      }
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.ontimeout = () => reject(new Error('Upload timed out'));
    xhr.onabort = () => reject(new DOMException('Aborted', 'AbortError'));
    register(xhr);
    xhr.send(form);
  });
}

/**
 * Upload queue. itemsRef is the single source of truth; React state mirrors it. A small pool keeps
 * CONCURRENCY uploads in flight. Removing an item aborts its in-flight request, and a stalled upload
 * times out rather than showing "loading" forever.
 */
export function useUploader(memoryId: number, contributorId: number | null) {
  const qc = useQueryClient();
  const [items, setItems] = useState<UploadItem[]>([]);
  const itemsRef = useRef<UploadItem[]>([]);          // authoritative store — never reset from state
  const activeRef = useRef(0);
  const xhrsRef = useRef<Map<string, XMLHttpRequest>>(new Map());
  const removedRef = useRef<Set<string>>(new Set());

  const commit = useCallback(() => { setItems(itemsRef.current.slice()); }, []);

  const patch = useCallback((id: string, p: Partial<UploadItem>) => {
    const i = itemsRef.current.findIndex((x) => x.id === id);
    if (i === -1) return; // item was removed — ignore late writes
    itemsRef.current[i] = { ...itemsRef.current[i], ...p };
    commit();
  }, [commit]);

  const processOne = useCallback(async (id: string) => {
    const item = itemsRef.current.find((x) => x.id === id);
    if (!item || removedRef.current.has(id)) return;
    try {
      patch(id, { status: 'processing' });
      const processed = await processImage(item.file);
      if (removedRef.current.has(id)) return;

      const form = new FormData();
      form.append('original', item.file, item.file.name);
      form.append('thumb', new File([processed.thumb], 'thumb.jpg', { type: 'image/jpeg' }));
      form.append('meta', JSON.stringify({
        fileName: item.file.name,
        width: processed.width,
        height: processed.height,
        tone: processed.tone,
      }));

      patch(id, { status: 'uploading', progress: 0 });
      const res = await xhrUpload(
        `/api/memories/${memoryId}/photos`,
        form,
        contributorId,
        (prog) => patch(id, { progress: prog }),
        (xhr) => xhrsRef.current.set(id, xhr),
      );
      if (removedRef.current.has(id)) return;
      patch(id, { status: res.duplicate ? 'duplicate' : 'done', progress: 1, photoId: res.photo?.id });
    } catch (e) {
      if (removedRef.current.has(id) || (e instanceof DOMException && e.name === 'AbortError')) return;
      patch(id, { status: 'error', error: e instanceof Error ? e.message : 'Failed' });
    } finally {
      xhrsRef.current.delete(id);
    }
  }, [memoryId, contributorId, patch]);

  // Keep CONCURRENCY uploads in flight. Claims each item synchronously so it can't be picked twice.
  const pump = useCallback(() => {
    while (activeRef.current < CONCURRENCY) {
      const next = itemsRef.current.find((it) => it.status === 'queued');
      if (!next) break;
      activeRef.current += 1;
      patch(next.id, { status: 'processing' }); // claim
      processOne(next.id).finally(() => {
        activeRef.current -= 1;
        qc.invalidateQueries({ queryKey: ['photos', memoryId] });
        qc.invalidateQueries({ queryKey: ['stats', memoryId] });
        pump();
      });
    }
  }, [processOne, patch, qc, memoryId]);

  const addFiles = useCallback((files: File[] | FileList) => {
    const arr = Array.from(files).filter(
      (f) => f.type.startsWith('image/') || /\.(jpe?g|png|gif|heic|heif|webp|tiff?)$/i.test(f.name),
    );
    if (arr.length === 0) return;
    for (const file of arr) {
      itemsRef.current.push({
        id: `u${++counter}`,
        file,
        preview: URL.createObjectURL(file),
        status: 'queued',
        progress: 0,
      });
    }
    commit();
    pump();
  }, [commit, pump]);

  const removeItem = useCallback((id: string) => {
    removedRef.current.add(id);
    xhrsRef.current.get(id)?.abort(); // abort an in-flight upload
    const it = itemsRef.current.find((x) => x.id === id);
    if (it) URL.revokeObjectURL(it.preview);
    itemsRef.current = itemsRef.current.filter((x) => x.id !== id);
    commit();
  }, [commit]);

  const retry = useCallback((id: string) => {
    const it = itemsRef.current.find((x) => x.id === id);
    if (!it || it.status !== 'error') return;
    removedRef.current.delete(id); // re-allow writes if it was previously removed
    patch(id, { status: 'queued', progress: 0, error: undefined });
    pump();
  }, [patch, pump]);

  const reset = useCallback(() => {
    itemsRef.current.forEach((it) => { removedRef.current.add(it.id); xhrsRef.current.get(it.id)?.abort(); URL.revokeObjectURL(it.preview); });
    itemsRef.current = [];
    commit();
  }, [commit]);

  useEffect(() => () => {
    itemsRef.current.forEach((it) => { xhrsRef.current.get(it.id)?.abort(); URL.revokeObjectURL(it.preview); });
  }, []);

  const isFinal = (s: UploadStatus) => s === 'done' || s === 'duplicate' || s === 'error';
  const total = items.length;
  const finished = items.filter((i) => isFinal(i.status)).length;
  const succeeded = items.filter((i) => i.status === 'done').length;
  const duplicates = items.filter((i) => i.status === 'duplicate').length;
  const failed = items.filter((i) => i.status === 'error').length;
  const inFlight = items.some((i) => !isFinal(i.status));
  const overall = total === 0 ? 0
    : items.reduce((s, i) => s + (isFinal(i.status) ? 1 : i.progress), 0) / total;

  return {
    items, addFiles, removeItem, reset, retry,
    total, finished, succeeded, duplicates, failed, inFlight, overall,
  };
}
