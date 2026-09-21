import type { APIRoute } from 'astro';

export const prerender = false;

const URL_BACKEND = process.env.URL_BACKEND ?? 'https://api.supletivo.net.br';

export const ALL: APIRoute = async ({ request, url }) => {
  const targetUrl = new URL(url.pathname + url.search, URL_BACKEND);

  const headers = new Headers(request.headers);
  headers.set('host', targetUrl.host);

  try {
    const res = await fetch(targetUrl.toString(), {
      method: request.method,
      headers,
      redirect: 'manual',
    });

    const responseHeaders = new Headers(res.headers);
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error(`[media-proxy] Error proxying ${url.pathname}:`, err?.message);
    return new Response('Not Found', { status: 404 });
  }
};
