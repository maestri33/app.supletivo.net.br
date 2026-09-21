import type { APIRoute } from 'astro';

export const prerender = false;

const URL_BACKEND = process.env.URL_BACKEND ?? 'https://api.supletivo.net.br';

export const ALL: APIRoute = async ({ request, url }) => {
  const targetUrl = new URL(url.pathname + url.search, URL_BACKEND);

  const headers = new Headers(request.headers);
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

  const body =
    request.method !== 'GET' && request.method !== 'HEAD'
      ? await request.arrayBuffer()
      : undefined;

  try {
    const res = await fetch(targetUrl.toString(), {
      method: request.method,
      headers,
      body,
      redirect: 'manual',
    });

    const responseHeaders = new Headers(res.headers);
    // Remove headers that should not be forwarded
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error(`[api-proxy] Error proxying ${request.method} ${url.pathname} to backend:`, err?.message);
    return new Response(
      JSON.stringify({
        error: 'backend_unavailable',
        message: 'Serviço temporariamente indisponível. Tente novamente em instantes.',
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
