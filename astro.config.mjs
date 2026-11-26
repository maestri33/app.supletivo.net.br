// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
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
    '/onboarding': {
      status: 308,
      destination: '/student/enrollment',
    },
    '/contrato': {
      status: 308,
      destination: '/student/enrollment/selfie',
    },
    '/recuperar-numero': {
      status: 308,
      destination: '/autenticacao/recuperar-numero',
    },
    '/checkout': {
      status: 308,
      destination: 'https://supletivo.net.br',
    },
    '/planos': {
      status: 308,
      destination: 'https://supletivo.net.br/#planos',
    },
    '/register': {
      status: 308,
      destination: 'https://supletivo.net.br',
    },
    '/email': {
      status: 308,
      destination: 'https://supletivo.net.br',
    },
    '/cpf': {
      status: 308,
      destination: 'https://supletivo.net.br',
    },
    '/polo': {
      status: 308,
      destination: '/admin/dashboard',
    },
    '/hub': {
      status: 308,
      destination: '/admin/dashboard',
    },
    '/hub/index': {
      status: 308,
      destination: '/admin/dashboard',
    },
    '/hub/active': {
      status: 308,
      destination: '/admin/dashboard',
    },
    '/hub/active/dashboard': {
      status: 308,
      destination: '/admin/dashboard',
    },
    '/hub/active/exams': {
      status: 308,
      destination: '/admin/dashboard',
    },
    '/hub/active/operations': {
      status: 308,
      destination: '/admin/dashboard',
    },
    '/hub/review': {
      status: 308,
      destination: '/admin/documentos',
    },
    '/hub/review/promoters': {
      status: 308,
      destination: '/admin/dashboard',
    },
    '/hub/review/students': {
      status: 308,
      destination: '/admin/dashboard',
    },
    '/student/index': {
      status: 308,
      destination: '/student',
    },
  },
  integrations: [svelte()],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['zod'],
    },
  },
});
