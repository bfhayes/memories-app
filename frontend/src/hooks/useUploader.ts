import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { processImage } from '../lib/image';

export type UploadStatus = 'queued' | 'processing' | 'uploading' | 'done' | 'duplicate' | 'error';

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
let counter = 0;

function xhrUpload(
  url: string,
  form: FormData,
  contributorId: number | null,
  onProgress: (p: number) => void,
): Promise<{ duplicate: boolean; photo: { id: number } }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    if (contributorId != null) xhr.setRequestHeader('X-Contributor-Id', String(contributorId));
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
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
    xhr.send(form);
  });
}

export function useUploader(memoryId: number, contributorId: number | null) {
  const qc = useQueryClient();
  const [items, setItems] = useState<UploadItem[]>([]);
  const itemsRef = useRef<UploadItem[]>([]);
  const activeRef = useRef(0);
  itemsRef.current = items;

  const update = useCallback((id: string, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const processOne = useCallback(async (item: UploadItem) => {
    try {
      update(item.id, { status: 'processing' });
      const processed = await processImage(item.file);
      const form = new FormData();
      form.append('original', item.file, item.file.name);
      const thumbFile = new File([processed.thumb], 'thumb.jpg', { type: 'image/jpeg' });
      form.append('thumb', thumbFile);
      form.append('meta', JSON.stringify({
        fileName: item.file.name,
        width: processed.width,
        height: processed.height,
        tone: processed.tone,
        exifDate: processed.exifDate,
      }));
      update(item.id, { status: 'uploading', progress: 0 });
      const res = await xhrUpload(
        `/api/memories/${memoryId}/photos`,
        form,
        contributorId,
        (p) => update(item.id, { progress: p }),
      );
      update(item.id, {
        status: res.duplicate ? 'duplicate' : 'done',
        progress: 1,
        photoId: res.photo?.id,
      });
    } catch (e) {
      update(item.id, { status: 'error', error: e instanceof Error ? e.message : 'Failed' });
    }
  }, [memoryId, contributorId, update]);

  // Pump: keep CONCURRENCY uploads in flight.
  const pump = useCallback(() => {
    while (activeRef.current < CONCURRENCY) {
      const next = itemsRef.current.find((it) => it.status === 'queued');
      if (!next) break;
      activeRef.current += 1;
      // Mark immediately so the pump doesn't pick it again.
      itemsRef.current = itemsRef.current.map((it) =>
        it.id === next.id ? { ...it, status: 'processing' } : it);
      setItems(itemsRef.current);
      processOne(next).finally(() => {
        activeRef.current -= 1;
        qc.invalidateQueries({ queryKey: ['photos', memoryId] });
        qc.invalidateQueries({ queryKey: ['stats', memoryId] });
        pump();
      });
    }
  }, [processOne, qc, memoryId]);

  const addFiles = useCallback((files: File[] | FileList) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/') || /\.(jpe?g|png|gif|heic|heif|webp|tiff?)$/i.test(f.name));
    if (arr.length === 0) return;
    const newItems: UploadItem[] = arr.map((file) => ({
      id: `u${++counter}`,
      file,
      preview: URL.createObjectURL(file),
      status: 'queued',
      progress: 0,
    }));
    setItems((prev) => {
      itemsRef.current = [...prev, ...newItems];
      return itemsRef.current;
    });
    // Kick the pump on the next tick so state has settled.
    setTimeout(pump, 0);
  }, [pump]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const it = prev.find((x) => x.id === id);
      if (it) URL.revokeObjectURL(it.preview);
      itemsRef.current = prev.filter((x) => x.id !== id);
      return itemsRef.current;
    });
  }, []);

  const reset = useCallback(() => {
    itemsRef.current.forEach((it) => URL.revokeObjectURL(it.preview));
    itemsRef.current = [];
    setItems([]);
  }, []);

  useEffect(() => () => { itemsRef.current.forEach((it) => URL.revokeObjectURL(it.preview)); }, []);

  const total = items.length;
  const finished = items.filter((i) => i.status === 'done' || i.status === 'duplicate' || i.status === 'error').length;
  const succeeded = items.filter((i) => i.status === 'done').length;
  const duplicates = items.filter((i) => i.status === 'duplicate').length;
  const failed = items.filter((i) => i.status === 'error').length;
  const inFlight = items.some((i) => i.status === 'uploading' || i.status === 'processing' || i.status === 'queued');
  // Overall progress blends per-item upload progress.
  const overall = total === 0 ? 0
    : items.reduce((s, i) => s + (i.status === 'done' || i.status === 'duplicate' || i.status === 'error' ? 1 : i.progress), 0) / total;

  return {
    items, addFiles, removeItem, reset,
    total, finished, succeeded, duplicates, failed, inFlight, overall,
  };
}
