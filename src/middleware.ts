import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  const headers = response.headers;

  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; media-src 'self' blob:; connect-src 'self' https://*.supletivo.net.br https://*.v7m.live https://challenges.cloudflare.com https://static.cloudflareinsights.com https://pay.infinitepay.io https://api.infinitepay.io; frame-src 'self' https://challenges.cloudflare.com https://pay.infinitepay.io; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'"
  );

  return response;
});
