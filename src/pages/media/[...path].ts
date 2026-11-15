import type { APIRoute } from 'astro';

export const prerender = false;

const URL_BACKEND = process.env.URL_BACKEND ?? 'https://backend.supletivo.net.br';

export const ALL: APIRoute = async ({ request, url }) => {
  const targetUrl = new URL(url.pathname + url.search, URL_BACKEND);

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

    // Otimização de Edge Cache para arquivos de mídia (imagens, documentos e uploads imutáveis)
    // Reduz drasticamente o tráfego da origem (saving ~5 GB/mês) servindo hits na borda Cloudflare
    if (res.ok || res.status === 206) {
      responseHeaders.set(
        'Cache-Control',
        'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400'
      );
    }

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
