import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const backendUrl =
    (env as { URL_BACKEND?: string })?.URL_BACKEND ??
    import.meta.env.URL_BACKEND ??
    'https://api.supletivo.net.br';

  const target = new URL(`/v1/auth/confirm-link${context.url.search}`, backendUrl);
  return new Response(null, {
    status: 302,
    headers: {
      Location: target.toString(),
      'Cache-Control': 'no-store',
    },
  });
};
