# 🎓 app.supletivo.net.br — Portal do Aluno EJA

Aplicação **Next.js 16** (Turbopack) que opera o portal completo do aluno da plataforma **Supletivo Brasil**: funil de conversão, matrícula documental com KYC, portal acadêmico e agendamento de provas presenciais.

**Domínio de produção:** `app.supletivo.net.br`
**Porta de dev:** `:3020` | **Porta do container:** `:3000`

---

## 📐 Arquitetura

```
app.supletivo.net.br/
├── packages/ui/           → Design System compartilhado (@v7m/ui)
│   ├── src/components/    → 70+ componentes React (Radix, Motion, Tailwind)
│   ├── src/primitives/    → Primitivas base (Button, Card, Dialog, etc.)
│   ├── src/tokens/        → Design tokens CSS (cores, tipografia, espaçamento)
│   └── src/themes/        → Temas (supletivo.css, staff.css)
├── src/
│   ├── app/(funil)/       → Funil de conversão (7 telas sequenciais)
│   ├── app/_lead/         → State machine do lead (916 linhas)
│   ├── app/matricula/     → Wizard de matrícula KYC (4 steps + awaiting)
│   ├── app/aluno/         → Portal do aluno matriculado
│   ├── app/provas/        → Agendamento de provas & diplomação
│   ├── components/        → Componentes específicos do app
│   └── lib/               → APIs, sessão, validações, utilitários
├── tests/e2e/             → Testes E2E com Playwright
├── Dockerfile             → Build Docker multi-stage (standalone)
└── pnpm-workspace.yaml    → Workspace (root + packages/ui)
```

### Modelo de Proxy (Zero-CORS)

O browser **nunca** fala diretamente com o backend Django. O `next.config.ts` reescreve:

```
Browser → /api/*   → Next.js Rewrite → URL_BACKEND/api/*   (Django Ninja)
Browser → /media/* → Next.js Rewrite → URL_BACKEND/media/* (uploads)
```

Isso elimina CORS, mixed-content e expõe zero credenciais de infraestrutura ao cliente.

---

## 🚀 Primeiros Passos

```bash
# 1. Instalar dependências
pnpm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# Editar URL_BACKEND com o endereço do seu backend Django

# 3. Iniciar servidor de desenvolvimento
pnpm dev          # http://localhost:3020

# 4. Verificar tipos TypeScript
pnpm check-types

# 5. Compilar para produção
pnpm build
```

### Docker

```bash
docker build -t app-supletivo \
  --build-arg URL_BACKEND=http://backend-web:8000 .

docker run -p 3000:3000 \
  -e URL_BACKEND=http://backend-web:8000 \
  app-supletivo
```

---

## 🗺️ Jornadas do Usuário

O app gerencia **4 personas** sequenciais com transição automática:

```
Lead → Matriculando → Aluno → Veterano (Diplomado)
```

### Fluxo 1: Funil de Conversão (`/(funil)/*`)

| Rota | Tela | Comportamento |
|:---|:---|:---|
| `/` | Telefone | Máscara celular BR, auto-submit no 11º dígito, suporte a `?ref=UUID` |
| `/login` | OTP WhatsApp | 6 dígitos segmentados, auto-submit no 6º, cooldown de 60s para reenvio |
| `/cpf` | Consulta CPF | Caixas 3-3-3-2, validação matemática, consulta Receita Federal, animação de credencial |
| `/email` | E-mail | Detecção de typo de domínio, bloqueio de provedores temporários, animação de envio |
| `/planos` | Pagamento | Comparativo Pix à Vista vs Cartão Parcelado, modal de confirmação |
| `/checkout` | Gateway Asaas | QR Code Pix + Cartão de Crédito, polling de confirmação a cada 3s |
| `/painel` | Reengajamento | Retomada de fatura pendente para leads que saíram |

**State Machine:** `src/app/_lead/use-lead-flow.ts` (916 linhas) controla todos os estados, timers, transições e chamadas de API do funil.

### Fluxo 2: Matrícula & KYC Documental (`/matricula`)

Wizard sequencial de 4 steps com tratamento de conflito (`409 WRONG_STATUS`):

| Step | Componente | O que faz |
|:---|:---|:---|
| 0 | `step-rg.tsx` | Upload frente/verso de RG/CIN. **Rejeita CNH** (regra MEC para EJA). OCR + classificação documental com IA. Chat de parentesco (`kinship-chat.tsx`) se filiação não for extraída automaticamente. |
| 1 | `step-address.tsx` | CEP com preenchimento automático via ViaCEP + IBGE. |
| 2 | `step-education.tsx` | Nível de ensino (Fundamental/Médio), última série cursada e turno. |
| 3 | `step-selfie.tsx` | Captura facial (liveness) + assinatura digital do contrato com hash, IP e timestamp (`contract-reveal.tsx`). |
| — | `AwaitingRelease` | Polling a cada 8s até deferimento pela coordenação. Redireciona via `/login?relogin=1`. |

### Fluxo 3: Portal do Aluno (`/aluno`)

Painel do aluno matriculado com estados dinâmicos:

- **`awaiting_documents`:** Upload de documentos complementares (Certidão, Histórico Escolar, Reservista).
- **`blood_type_pending`:** Coleta obrigatória do tipo sanguíneo (ABO + Rh) via `BloodTypeCard`.
- **`documents_under_review`:** Documentação em análise pela secretaria.
- **`exam_released`:** Aluno apto para agendamento de prova.
- **`ActiveBlocksBanner`:** Banners dinâmicos de pendências com ações corretivas.

### Fluxo 4: Provas & Diplomação (`/provas`)

| Estado | Descrição |
|:---|:---|
| `exam_released` | Apto. Escolha de polo, data e turno (`exam-schedule.tsx`). |
| `exam_scheduled` | Comprovante com QR Code, endereço e regras. |
| `exam_failed` | Reagendamento e recuperação. |
| `awaiting_documentation_dispatch` | Despacho ao Diário Oficial. |
| `awaiting_diploma_issuance` | Confecção e assinatura digital do diploma. |
| `awaiting_pickup` / `veteran` | Diploma emitido — retirada ou download. |

---

## 🧩 Design System (`packages/ui`)

O pacote `@v7m/ui` contém **70+ componentes** React compartilhados:

### Componentes do Funil
- `FunnelEntryCard` — Container card das telas do funil
- `OtpInput` — Input segmentado de 6 dígitos com cola automática
- `CpfInputBoxes` — Input CPF em caixas 3·3·3-2
- `StudentCredentialCard` — Animação de carteirinha holográfica
- `PricingPlanCard` — Card de seleção de plano com selo de desconto
- `PlanConfirmModal` — Modal de confirmação de plano

### Componentes da Matrícula
- `IdentityDocumentCapture` — Upload frente/verso com preview
- `BiometricsLivenessCapture` — Captura facial em tempo real
- `ContractSigner` — Assinatura digital com gravação de IP/UA/timestamp
- `StudentContractReveal` — Visualizador do contrato com checkbox
- `Stepper` — Wizard multi-step com indicador de progresso

### Componentes Acadêmicos
- `BloodTypeCard` — Coleta tipo sanguíneo ABO+Rh
- `DocumentResolutionDrawer` — Drawer de resolução de pendências
- `DocumentInspectorModal` — Inspeção de documentos enviados

### Primitivas Base
`Button`, `Card`, `Badge`, `Dialog`, `Input`, `Select`, `Table`, `Tabs`, `Spinner`, `LoadingOverlay`, `ErrorBox`, `GenericModal`, `ConfirmDialog`, `StatusPill`, `BackLink`

### Tokens CSS
Design tokens em `packages/ui/src/tokens/`: `colors`, `typography`, `spacing`, `radius`, `shadows`, `blur`, `durations`.

---

## 🔐 Segurança & Resiliência

### Headers de Segurança
- **CSP** (Content-Security-Policy): `default-src 'self'`, connect limitado a domínios autorizados
- **Permissions-Policy**: `camera=(self)` para KYC biométrico, mic e geo bloqueados
- **X-Content-Type-Options**: `nosniff`
- **Referrer-Policy**: `strict-origin-when-cross-origin`

### Sessão & JWT
- Tokens armazenados em `localStorage` (`supletivo.session`)
- **Mutex de Silent Refresh**: múltiplos 401 simultâneos coalescem em uma única chamada de refresh
- Sessão do lead (pré-autenticação) separada da sessão JWT do aluno

### Dead Socket Auto-Retry
`request()` intercepta `TypeError: Failed to fetch` (keep-alive expirado) e executa retry automático em `[250ms, 900ms]`.

### Tratamento de Conflito (409)
Se o backend retorna `409 WRONG_STATUS`, o stepper do `/matricula` se auto-corrige para o step esperado pelo servidor.

---

## 📁 Variáveis de Ambiente

| Variável | Server/Client | Descrição |
|:---|:---|:---|
| `URL_BACKEND` | Server only | URL do Django Ninja (default: `http://backend-web:8000`) |
| `NEXT_PUBLIC_API_BASE_URL` | Client | Vazio = same-origin (recomendado) |
| `GIT_SHA` | Build-time | Hash do commit (exibido em `/healthz`) |
| `BUILD_AT` | Build-time | Timestamp do build |

---

## 🧪 Testes

```bash
# Testes E2E com Playwright
pnpm test:e2e

# Testes E2E com browser visível
pnpm test:e2e:headed
```

Suítes disponíveis em `tests/e2e/`:
- `lead-check.spec.ts` — Tela de telefone
- `lead-login.spec.ts` — OTP
- `lead-cpf.spec.ts` — Consulta CPF
- `lead-email.spec.ts` — Validação de e-mail
- `lead-planos.spec.ts` — Seleção de plano
- `lead-checkout.spec.ts` — Checkout Asaas
- `lead-painel.spec.ts` — Reengajamento
- `matricula-rg.spec.ts` — Upload RG
- `matricula-endereco.spec.ts` — Endereço
- `matricula-escolaridade.spec.ts` — Escolaridade
- `aluno-painel.spec.ts` — Portal do aluno
- `funnel-and-matricula.spec.ts` — Fluxo completo integrado

---

## 📦 Stack Técnica

| Tecnologia | Versão | Uso |
|:---|:---|:---|
| Next.js | 16.3.1 | Framework (Turbopack, standalone) |
| React | 19.2.4 | UI Library |
| TypeScript | 5.x | Tipagem estática |
| Tailwind CSS | 4.x | Estilização utility-first |
| Motion | 13.x | Animações declarativas |
| React Hook Form | 7.x | Gerenciamento de formulários |
| Zod | 4.x | Validação de schemas |
| TanStack Query | 5.x | Cache e estado assíncrono |
| Radix UI | — | Primitivas acessíveis (Dialog, Select, Tabs) |
| Sonner | 2.x | Toast notifications |
| Playwright | 1.x | Testes E2E |

---

## 🏗️ Deploy

O Dockerfile usa build **multi-stage** com output `standalone` do Next.js:

1. **deps** — Instala dependências via pnpm
2. **builder** — Compila com `next build` (standalone output)
3. **runner** — Imagem mínima Alpine com apenas `server.js`, `.next/static` e `public`

Imagem final: **~120MB** com healthcheck em `/healthz`.

---

## 📄 Licença

Proprietário — © Maestri Group / Supletivo Brasil. Todos os direitos reservados.
