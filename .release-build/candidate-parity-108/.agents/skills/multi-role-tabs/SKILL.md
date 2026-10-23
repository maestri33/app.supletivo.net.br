---
name: multi-role-tabs
description: Diretiva canônica, arquitetura e guia de uso do componente Tabs/EnvironmentTabs posicionado na parte superior para alternância entre múltiplos papéis (Aluno, Promotor, Coordenador do Polo) em app.supletivo.net.br.
---

# Multi-Role Tabs — Diretiva Canônica & Guia de Uso

> **Escopo**: `app.supletivo.net.br`  
> **Componentes Centrais**: [`src/components/ui/tabs.tsx`](file:///c:/rep/app.supletivo.net.br/src/components/ui/tabs.tsx) e [`src/components/interactive/EnvironmentTabs.tsx`](file:///c:/rep/app.supletivo.net.br/src/components/interactive/EnvironmentTabs.tsx)  
> **Contrato de Roles**: [`src/lib/roles.ts`](file:///c:/rep/app.supletivo.net.br/src/lib/roles.ts)  
> **Design System**: [`supletivo.net.br/DESIGN.md`](file:///c:/rep/supletivo.net.br/DESIGN.md) (Pátria Amada Refinada)

---

## 1. Visão Geral e Contexto de Negócio

No ecossistema **Supletivo Brasil**, o usuário realiza login único passwordless via OTP. Dependendo do seu histórico na plataforma, um mesmo usuário físico pode possuir mais de um papel ativo simultaneamente:
- Um **Aluno** concluindo o Ensino Médio que também atua como consultor/afiliado indicando novos alunos (**Promotor**).
- Um **Coordenador do Polo Regional** credenciado que também conclui seus estudos ou atua na captação regional.

### 🚫 Restrição Estrita de Papéis no App
Este repositório (`app.supletivo.net.br`) atende **exclusivamente aos 3 públicos de negócio**:
1. `aluno` — **🎓 Aluno** (Ambiente de Formação)
2. `promotor` — **💼 Promotor** (Consultoria Educacional e Comissões)
3. `polo` — **🏫 Coordenador do Polo** (Secretaria Regional e Validação Documental)

> ⚠️ **PROIBIÇÃO MANDATÓRIA**: Qualquer papel administrativo (`admin`, `staff`, `superuser`) é estritamente proibido neste ambiente. A governança global pertence a domínios técnicos isolados (`*.v7m.live` / Django Admin).

---

## 2. A Regra de Ouro (Zero Tabs vs Multi-Role)

O componente de abas NÃO deve ser exibido indiscriminadamente. Ele existe **única e exclusivamente para usuários multi-role**:

| Quantidade de Papéis Normalizados | Comportamento Obrigatório na Interface |
| :--- | :--- |
| **1 Único Papel** (`['aluno']`, `['promotor']` ou `['polo']`) | **ZERO TABS**. Nenhuma barra de abas deve ser renderizada no topo. O ambiente entra direto, limpo e sem poluição visual. |
| **2 ou 3 Papéis** (ex: `['aluno', 'promotor']` ou `['aluno', 'promotor', 'polo']`) | **ABAS ATIVAS NO TOPO**. A barra de navegação superior é renderizada contendo **apenas** os papéis que o usuário possui. |

---

## 3. Posicionamento Mandatório: PARTE SUPERIOR (`sticky top-0 z-30`)

O componente de abas deve residir **estritamente na parte superior da interface**:
- Posicionado imediatamente abaixo do cabeçalho institucional (`AppHeader.astro`).
- Estilizado com `sticky top-0 z-30`, backdrop-blur-xl e borda sutil (`border-white/10`).
- Centralizado e com formato em pílula ergonômica.
- **Proibido** empurrar as abas para o meio da tela, rodapé ou abaixo de banners textuais.

---

## 4. Integração com Backend e Ciclo de Vida de Dados

### 4.1. Emissão de Roles no Backend (`backend.supletivo.net.br`)
1. O backend armazena papéis na tabela `users_user_role` (`UserRole`), onde papéis ativos possuem `revoked_at IS NULL`.
2. No login OTP ([`users/auth/service.py:login`](file:///c:/rep/backend.supletivo.net.br/users/auth/service.py#L789)), o backend coleta `roles.active_roles(user)` e grava a lista completa no JWT.
3. O endpoint [`GET /api/v1/clients/whoami`](file:///c:/rep/backend.supletivo.net.br/api/base.py#L111) expõe:
   ```json
   {
     "external_id": "0191b98f-...",
     "roles": ["student", "promoter", "coordinator"],
     "name": "Lucas Maestri"
   }
   ```

### 4.2. Normalização no Frontend (`normalizeUserRoles`)
O utilitário canônico [`src/lib/roles.ts`](file:///c:/rep/app.supletivo.net.br/src/lib/roles.ts) mapeia a multiplicidade de estados internos do backend para os 3 ambientes de topo:

```ts
export function normalizeUserRoles(backendRoles: string[] = []): AppEnvironment[] {
  const envSet = new Set<AppEnvironment>();

  for (const rawRole of backendRoles) {
    const role = rawRole.toLowerCase().trim();

    if (["lead", "enrollment", "student", "veteran", "aluno"].includes(role)) {
      envSet.add("aluno");
    } else if (["candidate", "promoter", "training", "promotor"].includes(role)) {
      envSet.add("promotor");
    } else if (["coordinator", "hub_coordinator", "polo"].includes(role)) {
      envSet.add("polo");
    }
  }

  if (envSet.size === 0) return ["aluno"];

  // Ordem canônica de exibição
  const order: AppEnvironment[] = ["aluno", "promotor", "polo"];
  return order.filter((env) => envSet.has(env));
}
```

* **Deduplicação de Sub-Estados**: Um aluno que possui `["student", "veteran"]` é agrupado em `["aluno"]` (tamanho 1 ➔ Zero Tabs).
* **Bloqueios Operacionais**: Sub-estados como `training` no promotor continuam controlando travas internas do painel sem gerar abas espúrias.

---

## 5. Como Utilizar os Componentes

### 5.1. `EnvironmentTabs` (Componente de Negócio Alto Nível)
Use quando precisar renderizar a casca multi-role automática a partir da lista de papéis do usuário:

```tsx
import { EnvironmentTabs } from "@/components/interactive/EnvironmentTabs";

export function MeuAmbiente({ roles, studentName, partnerUrl }: { roles: string[]; studentName: string; partnerUrl?: string }) {
  return (
    <EnvironmentTabs
      roles={roles}
      studentName={studentName}
      partnerUrl={partnerUrl}
      stickyTop={true}
    />
  );
}
```

### 5.2. `Tabs` (Primitiva UI Acessível)
Use quando precisar compor abas customizadas respeitando o WAI-ARIA APG:

```tsx
import { Tabs } from "@/components/ui/tabs";

const abas = [
  { title: "🎓 Aluno", value: "aluno", content: <PainelAluno /> },
  { title: "💼 Promotor", value: "promotor", content: <PainelPromotor /> },
];

export function NavegacaoSuperior() {
  return (
    <Tabs
      tabs={abas}
      tablistWrapperClassName="sticky top-0 z-30 py-3 bg-[var(--ink)]/80 backdrop-blur-xl border-b border-white/10"
      activeTabClassName="bg-[var(--blue)] text-white shadow-lg shadow-[var(--blue)]/50"
    />
  );
}
```

### 5.3. Padrões de Acessibilidade e Engenharia
- **WAI-ARIA APG**: Estrutura estrita com `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls` e `aria-labelledby`.
- **Roving Tabindex**: Foco via teclado com setas `ArrowLeft` e `ArrowRight`, além de teclas `Home` e `End`.
- **Prevenção de Foco Oculto (React 19)**: Painéis inativos usam o atributo booleano nativo `inert={!isActive}` e `hidden={!isActive}`.
- **Física Antigravity e Kill-Switch**: `motion/react` com spring physics e bypass completo quando `useReducedMotion()` for detectado.
- **Tokens do Design System**: Uso estrito de `var(--blue)`, `var(--yellow)`, `var(--green)`, `var(--ink)`, `var(--paper)` e proibição de valores hexadecimais soltos.

---

## 6. Instruções para Alterações Futuras (Governança & Evolução)

Sempre que a arquitetura de papéis ou a interface de abas precisar evoluir, **siga obrigatoriamente este checklist**:

1. **Validação Prévia de Escopo**:
   - Confirme se a nova regra ou papel se enquadra exclusivamente em `aluno`, `promotor` ou `polo`.
   - Lembre-se: **Apenas o usuário valida, homologa e aprova regras de negócio.**
2. **Atualização no Backend**:
   - Se um novo sub-papel for criado, declare a regra em `backend.supletivo.net.br/core/settings.py` (`ROLE_RULES`).
3. **Atualização de Contratos no Frontend**:
   - Adicione o papel em `BackendRole` e ajuste o agrupamento em `normalizeUserRoles()` em [`src/lib/roles.ts`](file:///c:/rep/app.supletivo.net.br/src/lib/roles.ts).
4. **Atualização de Conteúdo em `EnvironmentTabs.tsx`**:
   - Defina o painel visual correspondente em `allTabsMap` respeitando a paleta Pátria Amada Refinada e sem hexadecimais soltos.
5. **Atualização deste Documento (`SKILL.md`)**:
   - Toda alteração estrutural no comportamento de abas, mapeamento ou visual DEVE ser registrada neste arquivo.
   - Mantenha os links de arquivo canônicos atualizados.
6. **Bateria de Testes & CI/CD**:
   - Execute `pnpm check-types` (deve retornar 0 erros).
   - Execute `pnpm run lint` (deve respeitar a política de tokens do ESLint).
   - Execute `pnpm run check` (`astro check` com 0 erros).
   - Gere screenshots das permutações de papéis e apresente ao usuário antes de qualquer merge.
