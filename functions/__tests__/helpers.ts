import { vi } from 'vitest';
import type { CFContext, Env, RequestData } from '../lib/env';

type Rows = unknown[];

// Minimal D1 mock supporting prepare().bind().all()/first()/run().
export function createMockD1(opts: { rows?: Rows; first?: unknown } = {}) {
  const rows = opts.rows ?? [];
  const statement = () => ({
    bind: vi.fn().mockReturnThis(),
    all: vi.fn().mockResolvedValue({ results: rows }),
    first: vi.fn().mockResolvedValue(opts.first ?? rows[0] ?? null),
    run: vi.fn().mockResolvedValue({ success: true, meta: { changes: 1, last_row_id: 1 } }),
  });
  return {
    prepare: vi.fn(() => statement()),
    batch: vi.fn((stmts: unknown[]) => Promise.resolve(stmts.map(() => ({ results: rows })))),
    exec: vi.fn(),
    dump: vi.fn(),
  } as unknown as D1Database;
}

export function createMockR2() {
  return {
    get: vi.fn().mockResolvedValue(null),
    put: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  } as unknown as R2Bucket;
}

export function createRequest(
  method: string,
  url: string,
  body?: unknown,
  headers?: Record<string, string>,
): Request {
  const init: RequestInit = { method, headers: headers ?? {} };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    (init.headers as Record<string, string>)['Content-Type'] = 'application/json';
  }
  return new Request(`http://localhost${url}`, init);
}

export function createContext(overrides: {
  request?: Request;
  env?: Partial<Env>;
  params?: Record<string, string>;
  unlockedMemories?: number[];
} = {}): CFContext {
  const data: RequestData = { unlockedMemories: overrides.unlockedMemories ?? [] };
  return {
    request: overrides.request ?? createRequest('GET', '/'),
    env: {
      DB: createMockD1(),
      IMAGES: createMockR2(),
      AUTH_SECRET: 'test-secret',
      ...overrides.env,
    } as Env,
    params: overrides.params ?? {},
    data,
    next: vi.fn(),
    functionPath: '',
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
  } as unknown as CFContext;
}
