/// <reference types="astro/client" />

declare module "cloudflare:workers" {
  export const env: {
    URL_BACKEND?: string;
    PUBLIC_TURNSTILE_SITE_KEY?: string;
  };
}
