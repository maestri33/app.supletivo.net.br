// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

const isNode = process.env.DEPLOY_TARGET === 'node';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: isNode
    ? node({ mode: 'standalone' })
    : cloudflare({ imageService: 'passthrough' }),
  redirects: {
    '/login': {
      status: 308,
      destination: '/',
    },
    '/autenticacao/login': {
      status: 308,
      destination: '/',
    },
    '/painel': {
      status: 308,
      destination: '/student',
    },
    '/aluno': {
      status: 308,
      destination: '/student',
    },
    '/matricula': {
      status: 308,
      destination: '/student/enrollment',
    },
    '/documentos': {
      status: 308,
      destination: '/student/enrollment',
    },
    '/provas': {
      status: 308,
      destination: '/student/enrollment',
    },
    '/promotor': {
      status: 308,
      destination: '/promoter',
    },
    '/promotor/adesao': {
      status: 308,
      destination: '/promoter/candidate',
    },
    '/polo': {
      status: 308,
      destination: '/hub',
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
