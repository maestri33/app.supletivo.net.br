---
name: role-status-dock
description: Especificação e guia canônico do sistema de navegação adaptativa multi-role e multi-status para app.supletivo.net.br (Tabs de Status + Dock Adaptativo).
version: 1.0.0
updated_at: 2026-09-26
---

# Skill & Guia Arquitetural: Navegação Adaptativa Multi-Role e Multi-Status

> **MANDATO DE ENGENHARIA**: Toda navegação principal de aplicação e acompanhamento de etapas operacionais em `app.supletivo.net.br` DEVE seguir estritamente este padrão. É expressamente proibido hardcodar menus estáticos divergentes ou sobrepor rodapés institucionais em áreas logadas.

---

## 1. Visão Geral e Arquitetura em 4 Camadas

A arquitetura desacopla a representação de estado da interface visual através de 4 camadas bem delimitadas:

```
┌────────────────────────────────────────────────────────┐
│  Camada 1: Apresentação de Estado Superior (Tabs)       │
│  Tabs.tsx (Aceternity UI + Motion layoutId Pill)       │
│  Renderiza as etapas/status canônicos do perfil ativo │
└──────────────────────────┬─────────────────────────────┘
                           │ Dispara evento / prop
                           ▼
┌────────────────────────────────────────────────────────┐
│  Camada 2: Orquestrador Adaptativo                      │
│  RoleAdaptiveNavDock.tsx                               │
│  Gerencia estado (controlado ou via window events)     │
└──────────────────────────┬─────────────────────────────┘
                           │ Seleciona adaptador
                           ▼
┌────────────────────────────────────────────────────────┐
│  Camada 3: Adaptadores Especializados por Perfil       │
│  studentDockAdapter / promoterDockAdapter / ...        │
│  Mapeia (Role + Status) ➔ FloatingDockItem[]           │
│  Injeta badges (!, contagens), rotas, travas e ações   │
└──────────────────────────┬─────────────────────────────┘
                           │ Retorna itens para renderização
                           ▼
┌────────────────────────────────────────────────────────┐
│  Camada 4: Casca de Navegação Inferior (Dock/Bar)      │
│  - Opção 1: Bottom Tab Bar Nativa (bottom-0, safe-area)│
│  - Opção 2: FloatingDock (cápsula flutuante zero-g)    │
└────────────────────────────────────────────────────────┘
```

---

## 2. Matriz Canônica de Roles e Status

Os papéis e estados refletem os modelos do backend Django Ninja (`src/lib/roles.ts`):

### 2.1. Aluno (`student` / `aluno`)
| Status / Etapa | Identificador | Badge Dock | Ação Principal / Destaque |
|---|---|---|---|
| **1. Envio de Documentos** | `awaiting_documents` | `!` (Warning) | Foco em **Documentação**; provas e certificado inativos. |
| **2. Análise da Secretaria** | `documents_under_review` | `•` (Info) | Foco em **Documentação** (em validação pelo polo). |
| **3. Prova Liberada** | `exam_released` | `Liberada` (Success) | Foco em **Provas & Avaliações**; agendamento presencial. |
| **4. Emissão de Diploma** | `awaiting_diploma_issuance` | `Emissão` (Info) | Foco em **Certificação e Diploma** (registro MEC). |
| **5. Formado / Concluído** | `veteran` | `Concluído` (Success) | Diploma digital liberado para download ICP-Brasil. |

### 2.2. Promotor / Consultor (`promoter` / `promotor`)
| Status / Etapa | Identificador | Badge Dock | Ação Principal / Destaque |
|---|---|---|---|
| **1. Credenciamento** | `candidate` | `Onboarding` | Acesso restrito a termo de adesão, docs e chave PIX. |
| **2. Treinamento Obrigatório** | `training` | `Travado` (Danger) | Painel geral travado; foco exclusivo no LMS regulatório. |
| **3. Promotor Ativo** | `active` | `Nº Leads` (Success) | Acesso completo: Painel, Leads, Comissões no PIX. |
| **4. Acesso Suspenso** | `suspended` | `Suspenso` (Danger) | Captação bloqueada; apenas Suporte à Coordenação. |

### 2.3. Coordenador de Hub / Polo (`hub` / `polo`)
| Status / Etapa | Identificador | Badge Dock | Ação Principal / Destaque |
|---|---|---|---|
| **1. Fila Documental** | `pending_validation` | `5` (Warning) | Fila prioritária de conferência física e digital. |
| **2. Bancas & Provas** | `pending_exams` | `2` (Info) | Lançamento de atas de avaliação e bancas presenciais. |
| **3. Entrega de Diplomas** | `ready_diplomas` | `4` (Success) | Livro de registros e entrega física de diplomas. |

---

## 3. Como Utilizar o Sistema

### 3.1. Uso do `RoleStatusTabs` (Tabs + Dock Integrados)
Utilize este componente quando a tela permitir a visualização de etapas ou em ambientes de homologação/showcase:

```tsx
import { RoleStatusTabs } from "@/components/interactive/RoleStatusTabs";

export default function MinhaPagina() {
  return (
    <div className="w-full">
      <RoleStatusTabs initialRole="aluno" initialVariant="bottom-bar" />
    </div>
  );
}
```

### 3.2. Uso do `RoleAdaptiveNavDock` em Páginas de Produção (Modo Controlado)
```tsx
import { RoleAdaptiveNavDock } from "@/components/interactive/RoleAdaptiveNavDock";

export default function StudentDashboard({ studentData }) {
  return (
    <div className="min-h-dvh">
      {/* Conteúdo principal */}
      <main className="pb-28">
        <h1>Meu Curso</h1>
      </main>

      {/* Dock adaptado ao estado real do backend */}
      <RoleAdaptiveNavDock
        role="aluno"
        variant="bottom-bar"
        studentState={{
          status: studentData.status, // ex: 'awaiting_documents'
          pendingDocsCount: studentData.pending_docs_count,
        }}
        currentPath="/student/enrollment"
      />
    </div>
  );
}
```

### 3.3. Uso no Modo Autônomo (Disparo Global via Eventos)
Qualquer módulo Svelte ou Astro pode sincronizar o Dock sem acoplamento direto:

```ts
// Notificar troca de status do aluno
window.dispatchEvent(
  new CustomEvent("supletivo:student-state", {
    detail: { status: "exam_released", pendingDocsCount: 0 },
  })
);

// Notificar trava ou paywall
window.dispatchEvent(
  new CustomEvent("supletivo:lock-change", {
    detail: { isLocked: true },
  })
);
```

---

## 4. Variantes Visuais e Ergonomia Touch

1. **`variant="bottom-bar"` (Padrão Mandatório para Aplicação)**:
   - Fixado em `bottom-0`, `z-40`, com fundo `bg-brand-ink/90 backdrop-blur-2xl`.
   - Borda superior de 2px com gradiente patriótico (`brand-green` ➔ `brand-yellow` ➔ `brand-blue`).
   - Padding inferior dinâmico: `pb-[env(safe-area-inset-bottom)]`.
   - **Zero colisão com rodapé**: Suprime o rodapé institucional em telas de app (`showFooter={false}`).

2. **`variant="floating"` (Cápsula Flutuante Antigravity)**:
   - Cápsula elevada centralizada em `bottom-6 left-1/2 -translate-x-1/2`.
   - Usada em landing pages ou telas institucionais que não possuem rodapé fixo.

---

## 5. 🛡️ Protocolo Obrigatório para Alterações Futuras (Governança)

> **AVISO IMPORTANTE**: Nunca altere a lógica de status ou itens de navegação sem seguir este protocolo.

### Caso 1: Adicionar um Novo Status a um Perfil Existente
1. **Tipagem**: Adicione o literal em `src/lib/roles.ts` (ex: `StudentStatus` ou `CandidateStatus`).
2. **Adaptador**: Abra o adaptador correspondente em `src/components/interactive/dock/` (ex: `studentDockAdapter.tsx`).
   - Mapeie o novo status para o item que deve receber `isActive: true`.
   - Configure o `badge` e `badgeVariant` apropriados (`warning`, `info`, `success`, `danger`).
3. **Tabs de Status**: Atualize `src/components/interactive/RoleStatusTabs.tsx` adicionando o novo item no array de tabs do papel (`title`, `value`, `badge`, `content`).
4. **Atualização deste Documento**: Adicione a nova linha na tabela da **Seção 2** deste documento.
5. **Testes**: Execute `npm run check-types` e adicione/atualize os testes E2E em `tests/e2e/`.

### Caso 2: Adicionar um Novo Perfil / Role
1. **Tipos Canônicos**: Atualize `UserRole` em `src/lib/roles.ts` e `src/components/interactive/dock/types.ts`.
2. **Novo Adaptador**: Crie `src/components/interactive/dock/{novoRole}DockAdapter.tsx` implementando a função `get{Role}DockItems(state, ctx): FloatingDockItem[]`.
3. **Exportação**: Exporte o novo adaptador em `src/components/interactive/dock/index.ts`.
4. **Acoplamento no Orquestrador**: Adicione o novo `case "{novoRole}":` no `switch (activeRole)` em `RoleAdaptiveNavDock.tsx`.
5. **Tabs**: Adicione o novo seletor e abas correspondentes em `RoleStatusTabs.tsx`.
6. **Atualização deste Documento**: Registre a nova tabela na **Seção 2** e a motivação técnica.

### Checklist Pré-Commit Mandatório
- [ ] `npm run check-types` executou com código de saída 0.
- [ ] `npm run build` compilou com sucesso tanto para Node quanto para Cloudflare.
- [ ] `pwsh scripts/checkpoint/checkpoint.ps1 -Tier fast` validado.
- [ ] O oráculo de versão global (`https://version.v7m.live/api/version`) foi consultado e respeitado.
- [ ] Este documento (`docs/skills/role-status-dock.md`) foi mantido atualizado.
