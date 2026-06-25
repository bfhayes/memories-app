import type { Contributor } from './types';

// "Pick your name" identity, remembered per-Memory on this device.
const KEY = (memoryId: number) => `memories.identity.${memoryId}`;
const ONBOARD_KEY = 'memories.onboarded';

export function getIdentity(memoryId: number): Contributor | null {
  try {
    const raw = localStorage.getItem(KEY(memoryId));
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (v && typeof v.id === 'number' && typeof v.name === 'string') return v as Contributor;
  } catch { /* ignore */ }
  return null;
}

export function setIdentity(memoryId: number, contributor: Contributor): void {
  try { localStorage.setItem(KEY(memoryId), JSON.stringify(contributor)); } catch { /* ignore */ }
}

export function clearIdentity(memoryId: number): void {
  try { localStorage.removeItem(KEY(memoryId)); } catch { /* ignore */ }
}

export function hasOnboarded(): boolean {
  try { return localStorage.getItem(ONBOARD_KEY) === '1'; } catch { return false; }
}

export function markOnboarded(): void {
  try { localStorage.setItem(ONBOARD_KEY, '1'); } catch { /* ignore */ }
}
