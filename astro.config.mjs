// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

const isCloudflare = process.env.DEPLOY_TARGET === 'cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: isCloudflare
    ? cloudflare({ imageService: 'passthrough' })
    : node({ mode: 'standalone' }),
  redirects: {
    '/login': {
      status: 308,
      destination: '/autenticacao/login',
    },
  },
  integrations: [svelte(), react()],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['zod'],
    },
  },
});
