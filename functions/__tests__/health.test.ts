import { describe, it, expect } from 'vitest';
import { onRequestGet } from '../api/health';

describe('GET /api/health', () => {
  it('returns ok', async () => {
    const res = await onRequestGet();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });
});
