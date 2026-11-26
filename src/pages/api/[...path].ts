import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const ALL: APIRoute = async (context) => {
  const { request, url } = context;
  const backendUrl =
    (env as { URL_BACKEND?: string })?.URL_BACKEND ??
    import.meta.env.URL_BACKEND ??
    'https://api.supletivo.net.br';

  const pathname = url.pathname;
  const targetPath = pathname.startsWith('/api/v1/')
    ? pathname.slice('/api'.length)
    : pathname;
  const targetUrl = new URL(targetPath + url.search, backendUrl);
  if (!targetUrl.pathname.startsWith('/v1/')) {
    return new Response(
      JSON.stringify({
        error: 'invalid_path',
        message: 'Caminho de API inválido.',
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    );
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
      lk === 'expect' ||
      lk === 'cf-ray' ||
      lk === 'cf-visitor'
    ) {
      continue;
    }
    headers.set(key, val);
  }
  headers.set('host', targetUrl.host);
  headers.set('x-forwarded-host', url.host);
  headers.set('x-forwarded-proto', url.protocol.replace(':', ''));

  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip');
  if (clientIp) {
    headers.set('x-forwarded-for', clientIp);
  }

  const hasBody = !['GET', 'HEAD'].includes(request.method);
  const body = hasBody ? await request.arrayBuffer() : undefined;

  try {
    const res = await fetch(targetUrl.toString(), {
      method: request.method,
      headers,
      body,
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
    });

    const responseHeaders = new Headers(res.headers);
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');

    const isPublicCatalog =
      request.method === 'GET' &&
      res.ok &&
      (targetPath === '/v1/catalog/pricing' || targetPath === '/v1/catalog/contact');

    if (isPublicCatalog) {
      responseHeaders.set(
        'Cache-Control',
        'public, max-age=30, s-maxage=300, stale-while-revalidate=60'
      );
    } else if (request.headers.has('authorization') || !res.ok) {
      responseHeaders.set('Cache-Control', 'private, no-store');
    }

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[api-proxy] Error proxying ${request.method} ${url.pathname} to backend:`, errorMsg);
    return new Response(
      JSON.stringify({
        error: 'backend_unavailable',
        message: 'Serviço temporariamente indisponível. Tente novamente em instantes.',
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '5',
          'Cache-Control': 'no-store',
        },
      }
    );
  }
};
