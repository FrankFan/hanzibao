export async function onRequestGet(context) {
  const raw = String(context.params.char ?? '');
  const withoutExt = raw.endsWith('.json') ? raw.slice(0, -5) : raw;
  const char = decodeURIComponent(withoutExt);

  if (!char) return new Response('Bad Request', { status: 400 });

  const cache = caches.default;
  const cacheKey = new Request(context.request.url, context.request);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const upstream = `https://cdn.jsdelivr.net/npm/hanzi-writer-data@latest/${encodeURIComponent(char)}.json`;
  const upstreamRes = await fetch(upstream, {
    cf: { cacheEverything: true, cacheTtl: 31536000 },
  });

  if (!upstreamRes.ok) {
    return new Response('Not Found', { status: upstreamRes.status });
  }

  const headers = new Headers(upstreamRes.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');

  const res = new Response(upstreamRes.body, { status: upstreamRes.status, headers });
  context.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}
