# AI & Engineering Guidelines — `app.supletivo.net.br`

> **DIRETIVA DE HERANÇA**: As diretrizes gerais de governança, arquitetura e engenharia do ecossistema estão centralizadas em **[`../AGENTS.md`](../AGENTS.md)** e a arquitetura v2 em **[`../repo-api-supletivo/docs/adr/ADR-0004-app-supletivo-v2-architecture.md`](../repo-api-supletivo/docs/adr/ADR-0004-app-supletivo-v2-architecture.md)**.

---

## 1. Papéis e Escopo Canônico (ADR-0004 D1/D2/D5)

- O sistema opera com **apenas dois papéis**:
  - **`client`** (exibido como Aluno / `student` na interface): jornada completa `lead` / `payment_pending` → `pre_enrolled` → `enrolled` / `exam_scheduled` → `awaiting_pickup` / `graduated`.
  - **`admin`**: painel administrativo unificado em `/admin/*` (`/admin/dashboard`, `/admin/documentos`, `/admin/credenciais-siga`, `/admin/taxa-parceira`, `/admin/provas`, `/admin/diplomas`).
- **Recursos congelados / removidos**: zero suporte a `promoter`, `candidate`, `training`, `hub`, `polo`, `staff`, `coordinator`, TypeSafe SSR, `PixCheckout` ou CNH no upload de RG/CIN.
- **Pagamentos**: cobrança única de matrícula via **InfinitePay** (`POST /v1/checkout/create`). O Asaas permanece restrito à Taxa Parceira (PIX saída em 2 parcelas) dentro de `/admin/taxa-parceira`.

---

## 2. Proxy SSR, Mídia Privada e Segurança de Cache

- `/api/v1/*` (`src/pages/api/[...path].ts`) traduz estritamente para `${URL_BACKEND}/v1/*` (padrão `https://api.supletivo.net.br`), com cache público apenas em `GET /v1/catalog/pricing` e `GET /v1/catalog/contact`.
- `/media/*` (`src/pages/media/[...path].ts`) encaminha para `${URL_BACKEND}/v1/media/*` preservando `Authorization` e impondo `Cache-Control: private, no-store, max-age=0`, `Vary: Authorization` e `X-Content-Type-Options: nosniff`.
- Arquivos privados e PDFs autenticados nunca são embutidos via `<img src="/v1/media/...">` ou `<a href="/media/...">` sem JWT: usar `fetchPrivateMedia`, `openPrivateMedia`, `fetchAuthenticatedBlob` e `openAuthenticatedApiFile` (`src/lib/private-media.ts`).

---

## 3. Navegação Adaptativa e UI

- Todas as telas autenticadas utilizam `RootLayout.astro` + `AppHeader.astro` + `RoleAdaptiveNavDock.svelte` + `RoleRouteGuard.svelte`.
- Quando o usuário possui ambos os papéis (`client` e `admin`), `RoleTabsHeader.svelte` permite alternar entre `/student` e `/admin/dashboard`.
- Idioma: código, tipos, rotas e commits 100% em inglês (Conventional Commits); textos visíveis ao usuário 100% em português (PT-BR).
