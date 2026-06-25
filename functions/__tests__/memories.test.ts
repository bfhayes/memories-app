import { describe, it, expect } from 'vitest';
import { onRequestPost } from '../api/memories/index';
import { onRequestPost as unlock } from '../api/memories/[id]/unlock';
import { onRequestGet as listContributors } from '../api/memories/[id]/contributors';
import { createContext, createRequest } from './helpers';

describe('POST /api/memories', () => {
  it('rejects a missing name', async () => {
    const res = await onRequestPost(createContext({
      request: createRequest('POST', '/api/memories', { password: 'secret' }),
    }));
    expect(res.status).toBe(400);
  });

  it('rejects a too-short password', async () => {
    const res = await onRequestPost(createContext({
      request: createRequest('POST', '/api/memories', { name: 'Jeff Rice', password: 'ab' }),
    }));
    expect(res.status).toBe(400);
  });
});

describe('POST /api/memories/:id/unlock', () => {
  it('rejects a non-numeric id', async () => {
    const res = await unlock(createContext({
      params: { id: 'abc' },
      request: createRequest('POST', '/api/memories/abc/unlock', { password: 'x' }),
    }));
    expect(res.status).toBe(400);
  });
});

describe('access control', () => {
  it('hides contributors of a locked memory (404)', async () => {
    const res = await listContributors(createContext({
      params: { id: '5' },
      unlockedMemories: [], // not unlocked
      request: createRequest('GET', '/api/memories/5/contributors'),
    }));
    expect(res.status).toBe(404);
  });

  it('lists contributors when unlocked', async () => {
    const res = await listContributors(createContext({
      params: { id: '5' },
      unlockedMemories: [5],
      request: createRequest('GET', '/api/memories/5/contributors'),
    }));
    expect(res.status).toBe(200);
  });
});
