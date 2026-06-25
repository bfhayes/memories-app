import { readUnlocked } from '../lib/auth';
import type { CFContext } from '../lib/env';

export const onRequest = [
  // Global error boundary + lightweight request logging.
  async (context: CFContext) => {
    const url = new URL(context.request.url);
    const start = Date.now();
    console.log(`→ ${context.request.method} ${url.pathname}`);
    try {
      const response = await context.next();
      console.log(`← ${context.request.method} ${url.pathname} ${response.status} (${Date.now() - start}ms)`);
      return response;
    } catch (err) {
      console.error(`✗ ${url.pathname} ERROR (${Date.now() - start}ms):`, err);
      return Response.json(
        { error: 'Internal server error', detail: err instanceof Error ? err.message : String(err) },
        { status: 500 },
      );
    }
  },
  // Access middleware — reads the signed cookie into unlockedMemories. Never blocks.
  async (context: CFContext) => {
    context.data.unlockedMemories = await readUnlocked(context.request, context.env.AUTH_SECRET);
    return context.next();
  },
];
