import { defineMiddleware } from 'astro:middleware';

const PUBLIC_EXACT = new Set([
  '/',
  '/cpf',
  '/email',
  '/register',
  '/checkout',
  '/planos',
  '/recuperar-numero',
  '/healthz',
  '/icon.svg',
  '/favicon.ico',
]);

const PUBLIC_PREFIXES = [
  '/_astro',
  '/fonts',
  '/api',
  '/media',
  '/autenticacao',
  '/pix',
  '/promoter/candidate',
  '/promotor/adesao',
];

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  let response: Response;

  // Exact public routes or prefix matches bypass edge auth
  if (PUBLIC_EXACT.has(pathname) || PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    response = await next();
  } else {
    // Developer / sandbox / payment redirect bypass
    const searchParams = url.searchParams;
    if (
      searchParams.has('sandbox') ||
      searchParams.has('demo') ||
      searchParams.get('payment') === 'confirmed'
    ) {
      response = await next();
    } else {
      // Protected application routes (student, hub, promoter)
      const isProtected =
        pathname.startsWith('/student') ||
        pathname.startsWith('/hub') ||
        pathname.startsWith('/promoter') ||
        pathname.startsWith('/promotor');

      if (isProtected) {
        const token = context.cookies.get('supletivo.token')?.value;
        const session = context.cookies.get('supletivo.session')?.value;

        if (!token && !session) {
          return context.redirect('/', 302);
        }
      }

      response = await next();
    }
  }

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

