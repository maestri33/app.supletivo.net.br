---
version: alpha
name: "Supletivo Brasil — Web App (app.supletivo.net.br)"
description: "Design system para a aplicação unificada do Supletivo Brasil, atendendo alunos, promotores e equipe interna. Shell focado em ergonomia móvel (100dvh), formulários de alta usabilidade (Login, OTP, Matrícula), transições de tema fluidas (Aluno vs Staff) e acessibilidade WCAG AA rigorosa."

colors:
  primary: "#00734d"
  primary-deep: "#005238"
  secondary: "#ffc400"
  secondary-soft: "#ffd75e"
  accent-blue: "#002776"
  accent-blue-bright: "#1e6fe0"
  ink: "#0b1220"
  ink-muted: "#5b647a"
  paper: "#ffffff"
  paper-bg: "#f8fafc"
  hairline: "#d6dbe6"
  semantic-danger: "#b91c1c"
  semantic-danger-bg: "#fee2e2"
  semantic-success: "#15803d"
  semantic-success-bg: "#dcfce7"
  semantic-warning: "#92400e"
  semantic-warning-bg: "#fef3c7"
  semantic-info: "#0369a1"
  semantic-info-bg: "#e0f2fe"

typography:
  headline:
    fontFamily: "Inter"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.20
    letterSpacing: -0.4px
  milestone:
    fontFamily: "Archivo Black"
    fontSize: "32px"
    fontWeight: 400
    lineHeight: 1.10
  card-title:
    fontFamily: "Inter"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "Inter"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.50
  body-sm:
    fontFamily: "Inter"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.50
  caption:
    fontFamily: "Inter"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.40
  button:
    fontFamily: "Inter"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.20
  otp-digit:
    fontFamily: "Inter"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.00

rounded:
  sm: "6px"
  md: "10px"
  card: "16px"
  card-lg: "24px"
  pill: "999px"

spacing:
  xxs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
  section: "64px"

components:
  button-primary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "14px 24px"
  button-primary-hover:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "14px 24px"
  button-action:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.paper}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "14px 20px"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "14px 20px"
  input-text:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "14px 16px"
  input-otp:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.otp-digit}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  card-surface:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.card}"
    padding: "20px"
  alert-danger:
    backgroundColor: "{colors.semantic-danger-bg}"
    textColor: "{colors.semantic-danger}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  alert-success:
    backgroundColor: "{colors.semantic-success-bg}"
    textColor: "{colors.semantic-success}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  alert-warning:
    backgroundColor: "{colors.semantic-warning-bg}"
    textColor: "{colors.semantic-warning}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  alert-info:
    backgroundColor: "{colors.semantic-info-bg}"
    textColor: "{colors.semantic-info}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  top-nav:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    height: "56px"
  badge-status:
    backgroundColor: "{colors.secondary-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
---

## Overview

O `app.supletivo.net.br` é o **núcleo autenticado e operacional** da plataforma Supletivo Brasil. Ele acolhe tanto o estudante em sua jornada de estudos e provas quanto o promotor acompanhando suas indicações e a equipe de secretaria/administração.

Diferente da landing page pública (`supletivo.net.br`), cujo foco é atração e conversão cinematográfica, o design do aplicativo prioriza **ergonomia operacional, ausência de atrito cognitivo e estabilidade tátil**. O layout utiliza um modelo "app-like" de viewport travado (`100dvh`), rolagem interna confinada (`.app-scroll`) e alvos de toque generosos adaptados ao uso em transporte público ou em celulares de telas menores.

## Colors

A paleta de cores preserva integralmente a identidade nacional elevada do `supletivo.net.br`, estabelecendo consistência cognitiva para o aluno que acabou de concluir seu pré-cadastro na landing page.

### Cores de Ação e Estrutura
- **Verde Ação (`{colors.primary}` #00734d)**: Ações seguras de progresso (ex: "Iniciar Prova", "Confirmar Matrícula", "Enviar Documento").
- **Amarelo Destaque (`{colors.secondary}` #ffc400)**: Conclusão de etapas cruciais, botão principal de avanço e tags de atenção prioritária. Texto obrigatório em `{colors.ink}` (11.8:1 - AAA).
- **Azul Institucional (`{colors.accent-blue}` #002776)**: Fundo de headers autenticados e barras de navegação institucional.
- **Neutros de Alto Desempenho**: Fundo suave `{colors.paper-bg}` (#f8fafc) e cartões em branco puro `{colors.paper}` (#ffffff).

### Tematização Fluida (Aluno vs Staff)
O design suporta transição de tema limpa e fluida via atributo `data-theme`:
- **Tema Aluno (`data-theme="student"` ou default)**: Predominância de superfícies claras acolhedoras, com acentos em verde e amarelo.
- **Tema Staff / Secretaria (`data-theme="staff"` ou `admin`)**: Transição fluida de variáveis CSS para tons sóbrios (azul ardósia, cinza técnico), alta densidade de dados por tela e controles compactos para gestão de matrículas e relatórios em massa.

### Feedback Semântico (Validado WCAG AA)
- **Erro (`#b91c1c` sobre `#fee2e2`)**: 4.9:1 de contraste — para OTP expirado ou campos de CPF inconsistentes.
- **Sucesso (`#15803d` sobre `#dcfce7`)**: 4.5:1 de contraste — para aprovação de documento ou login autenticado.
- **Aviso (`#92400e` sobre `#fef3c7`)**: 5.2:1 de contraste — para prazos de envio de histórico escolar.
- **Informação (`#0369a1` sobre `#e0f2fe`)**: 4.8:1 de contraste — para instruções pedagógicas.

## Typography

- **Fonte Primária do App**: `'Inter', system-ui, -apple-system, sans-serif`.
  A `Inter` garante neutralidade máxima e excelente legibilidade em formulários complexos, inputs de OTP e visualização de notas.
- **Fonte de Conquista / Milestones**: `'Archivo Black', system-ui, sans-serif`.
  Reservada exclusivamente para telas de celebração: "Parabéns, seu diploma foi emitido!", emissão de certificados e carimbos de validação.

### Escala Operacional
- **Milestone**: `{typography.milestone}` (32px) — celebrações de etapa.
- **Headline**: `{typography.headline}` (28px) — títulos de página autenticada.
- **Card Title**: `{typography.card-title}` (20px) — cabeçalhos de disciplinas e módulos.
- **Body**: `{typography.body}` (16px) — textos e opções de múltipla escolha.
- **Body Small**: `{typography.body-sm}` (14px) — legendas e metadados de provas.
- **OTP Digit**: `{typography.otp-digit}` (24px) — campo de 6 dígitos numéricos.

## Layout

- **Shell Travado (`100dvh`)**: O documento `html, body` não rola. Evita o bug de rolagem dupla em WebViews iOS e Android.
- **Scroller Confinado (`.app-scroll`)**: Faixa vertical única com suporte a `overscroll-behavior: contain` e preenchimento de segurança `env(safe-area-inset-top)` e `env(safe-area-inset-bottom)`.
- **Área de Toque Mínima**: 48px de altura em todos os inputs e botões primários.

## Elevation & Depth

- **Nível 0**: Fundo limpo em `{colors.paper-bg}` (#f8fafc).
- **Nível 1 (Cards Operacionais)**: Fundo branco com borda sutil de 1px `{colors.hairline}` (#d6dbe6) e elevação suave (`0 2px 4px rgba(0,0,0,0.03)`).
- **Nível 2 (Modais e Bottom Sheets)**: Elevação moderada com sombreamento difuso (`0 10px 25px -5px rgba(0,0,0,0.1)`) e backdrop escuro com desfoque de 4px.

## Shapes

- **Entradas e Campos (`rounded.md` / 10px)**: Padrão ergonômico para campos de CPF, telefone e inputs de código.
- **Cards (`rounded.card` / 16px)**: Cartões de módulos de aula, simulados e avisos da secretaria.
- **Botões de Ação Primária (`rounded.pill` ou `rounded.md`)**: Arredondamento harmônico com o pivô.

## Components

### 1. Fluxo de Autenticação OTP
- Tela limpa com digitação sequencial de 6 dígitos centralizados.
- Teclado numérico mobile acionado automaticamente via `inputmode="numeric"`.
- Temporizador de reenvio de código com aviso semântico claro.

### 2. Painel do Aluno (`/painel`)
- Barra superior fixa com nome do estudante e status da matrícula.
- Card de progresso geral com indicador em `{colors.primary}` (#00734d).
- Lista de disciplinas com cards clicáveis que indicam: Não Iniciado, Em Andamento, Concluído.

### 3. Sala de Provas (`/provas`)
- Interface limpa sem distrações laterais.
- Questões numeradas com seleção de alternativas em cards com anel de foco visível (`:focus-visible`).

## Do's and Don’ts

### DO's
- **DO**: Garanta que todos os formulários suportem navegação completa via teclado e leitores de tela.
- **DO**: Mantenha os tokens de cores sincronizados com o pivô `supletivo.net.br/DESIGN.md`.
- **DO**: Implemente temas como variáveis CSS nativas aplicadas no seletor raiz `[data-theme]`.
- **DO**: Valide que todo texto sobre amarelo use `{colors.ink}` (#0b1220).

### DON'Ts
- **DON'T**: Nunca introduza dependências de design com nomes legados (ex: `v7m` ou `maestri.group`).
- **DON'T**: Nunca use cores de contraste inferior a 4.5:1 em alertas de validação de formulário.
- **DON'T**: Nunca permita rolagem de tela inteira que oculte os botões de ação fixa em fluxos de prova.
