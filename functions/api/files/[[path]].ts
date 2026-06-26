import type { CFContext } from '../../lib/env';

// GET /api/files/<key> — stream an R2 object. Keys are immutable (uuid-based), so cache hard.
export const onRequestGet = async (context: CFContext): Promise<Response> => {
  const { params, env } = context;
  const key = (Array.isArray(params.path) ? params.path.join('/') : (params.path as string)) || '';
  if (!key || key.includes('..')) return new Response('Bad request', { status: 400 });

  // Keys are `<memoryId>/<uuid>/...` — gate on the leading memory id.
  const memoryId = parseInt(key.split('/')[0], 10);
  if (isNaN(memoryId) || memoryId <= 0 || !context.data.unlockedMemories.includes(memoryId)) {
    return new Response('Not found', { status: 404 });
  }

  const obj = await env.IMAGES.get(key);
  if (!obj) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(obj.body, { headers });
};
