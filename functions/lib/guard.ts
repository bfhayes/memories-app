import type { CFContext } from './env';
import { first } from './db';

/** 403 unless the caller has unlocked `memoryId`. Returns null when access is OK. */
export function requireMemoryAccess(context: CFContext, memoryId: number): Response | null {
  if (!context.data.unlockedMemories.includes(memoryId)) {
    // 404, not 403 — don't leak which Memory ids exist.
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  return null;
}

export interface Caller {
  id: number;
  name: string;
  accent: string;
}

/**
 * Resolve the acting contributor from the X-Contributor-Id header, validating that the
 * contributor belongs to `memoryId`. Returns null for anonymous/invalid (writes still work
 * but are attributed to "Someone").
 */
export async function getCaller(context: CFContext, memoryId: number): Promise<Caller | null> {
  const raw = context.request.headers.get('X-Contributor-Id');
  const id = raw ? parseInt(raw, 10) : NaN;
  if (!Number.isInteger(id)) return null;
  const row = await first<{ id: number; name: string; accent: string }>(
    context.env.DB,
    'SELECT id, name, accent FROM contributors WHERE id = ? AND memory_id = ?',
    id,
    memoryId,
  );
  return row ?? null;
}
