import { toneFor } from './tones';

export interface ProcessedImage {
  thumb: Blob;
  width: number | null;
  height: number | null;
  tone: string;
}

const THUMB_MAX_EDGE = 1280;
const THUMB_QUALITY = 0.82;

async function decode(file: File): Promise<ImageBitmap | null> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return null;
  }
}

function averageTone(canvas: HTMLCanvasElement): string {
  try {
    const sample = document.createElement('canvas');
    sample.width = 1;
    sample.height = 1;
    const sctx = sample.getContext('2d');
    if (!sctx) return toneFor(Math.random());
    sctx.drawImage(canvas, 0, 0, 1, 1);
    const [r, g, b] = sctx.getImageData(0, 0, 1, 1).data;
    const hex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
    return `#${hex(r)}${hex(g)}${hex(b)}`;
  } catch {
    return toneFor(Math.random());
  }
}

/**
 * Make a downsized thumbnail, read natural dimensions, and sample an average tone.
 *
 * We deliberately do NOT read the EXIF date: scanned/digitized old photos carry the scan date,
 * not when the photo was taken, so it would be wrong. People set the real date by hand.
 */
export async function processImage(file: File): Promise<ProcessedImage> {
  const bitmap = await decode(file);
  if (!bitmap) {
    // Unsupported decode (e.g. some HEIC) — upload the original as its own thumb, tolerate.
    return { thumb: file, width: null, height: null, tone: toneFor(file.name) };
  }

  const { width, height } = bitmap;
  const scale = Math.min(1, THUMB_MAX_EDGE / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return { thumb: file, width, height, tone: toneFor(file.name) };
  }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const tone = averageTone(canvas);
  const thumb = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b ?? file), 'image/jpeg', THUMB_QUALITY);
  });

  return { thumb, width, height, tone };
}
