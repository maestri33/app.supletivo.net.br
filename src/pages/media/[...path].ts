import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const ALL: APIRoute = async (context) => {
  const { request, url } = context;
  const backendUrl =
    (env as { URL_BACKEND?: string })?.URL_BACKEND ??
    import.meta.env.URL_BACKEND ??
    'https://api.supletivo.net.br';

  const targetPath = url.pathname.startsWith('/v1/media/')
    ? url.pathname
    : `/v1${url.pathname}`;
  const targetUrl = new URL(targetPath + url.search, backendUrl);
  if (!targetUrl.pathname.startsWith('/v1/media/')) {
    return new Response('Bad Request', {
      status: 400,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const headers = new Headers();
  for (const [key, val] of request.headers.entries()) {
    const lk = key.toLowerCase();
    if (
      lk === 'content-length' ||
      lk === 'connection' ||
      lk === 'keep-alive' ||
      lk === 'transfer-encoding' ||
      lk === 'upgrade' ||
      lk === 'cf-ray' ||
      lk === 'cf-visitor'
    ) {
      continue;
    }
    headers.set(key, val);
  }
  headers.set('host', targetUrl.host);

  try {
    const res = await fetch(targetUrl.toString(), {
      method: request.method,
      headers,
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
    });

    const responseHeaders = new Headers(res.headers);
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');

    responseHeaders.set('Cache-Control', 'private, no-store, max-age=0');
    responseHeaders.set('Vary', 'Authorization');
    responseHeaders.set('X-Content-Type-Options', 'nosniff');

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[media-proxy] Error proxying ${url.pathname}:`, errorMsg);
    return new Response('Not Found', {
      status: 404,
      headers: { 'Cache-Control': 'no-cache, no-store' },
    });
  }
};
