---
version: alpha
name: app.supletivo.net.br-design
description: "Design system specification for app.supletivo.net.br (Multi-Role WebApp: Student, Promoter, Polo Coordinator). Integrates Pátria Amada Refinada design tokens with state-driven Status Tabs, Adaptive Floating Dock, and high-density dashboard interfaces."

colors:
  primary: "#ffc400"           # Yellow conversion & primary action
  on-primary: "#0b1220"        # Dark text on yellow
  primary-hover: "#ffd75e"
  canvas: "#ffffff"            # Paper default
  canvas-dark: "#0b1220"       # Deep ink for night sections
  surface-1: "#f5f7f3"         # Paper soft for background alternation
  surface-card: "#ffffff"      # Elevated white card
  surface-card-dark: "#121d33" # Ink soft for dark mode card
  hairline: "#e3e7ee"          # Neutral 1px card border
  hairline-dark: "rgba(255, 255, 255, 0.12)"
  ink: "#0b1220"               # Text primary
  muted-on-light: "#49536a"    # Secondary text on light (5.1:1 AA)
  muted-on-dark: "#b9c3db"     # Secondary text on dark (7.8:1 AAA)
  brand-green: "#00734d"       # Approved status, MEC diploma validity
  brand-green-deep: "#005238"
  brand-blue: "#002776"        # Academic authority, active tabs, header
  brand-blue-deep: "#001a52"
  semantic-danger: "#b91c1c"   # Rejected document, urgent validation error
  semantic-danger-bg: "#fee2e2"
  semantic-success: "#15803d"  # Document approved, payment confirmed
  semantic-success-bg: "#dcfce7"
  semantic-warning: "#92400e"  # Pending document, under review
  semantic-warning-bg: "#fef3c7"
  semantic-info: "#0369a1"     # Instructions & partner school redirect
  semantic-info-bg: "#e0f2fe"

typography:
  display:
    fontFamily: "Archivo Black, system-ui, sans-serif"
    fontWeight: 400
    lineHeight: 1.08
  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontWeight: 400
    lineHeight: 1.50
  button:
    fontFamily: "Inter, system-ui, sans-serif"
    fontWeight: 600
    lineHeight: 1.20

rounded:
  sm: 6px
  input: 10px
  card: 18px
  hero: 28px
  pill: 999px

spacing:
  container: "68rem"
  gutter: "clamp(1.25rem, 4vw, 2.5rem)"
  dock-bottom-clearance: "88px" # Clearance so cards never collide with dock
---

# Design System — `app.supletivo.net.br`

## 1. Princípios de Interface do WebApp
1. **Multi-Role Dinâmico**: A interface se adapta sem recarregar a página ao papel ativo do usuário (`Aluno`, `Promotor` ou `Coordenador de Polo`), mantendo estabilidade visual e identidade coesa.
2. **Zero Colisão de Rodapé**: Em áreas autenticadas, rodapés institucionais estáticos são banidos. O espaço inferior é reservado para a navegação adaptativa (`RoleAdaptiveNavDock`) com folga mínima de 88px (`--dock-bottom-clearance`).
3. **Ergonomia e Clareza de Status**: O aluno deve saber instantaneamente sua situação (matrícula, conferência de documentos ou liberado para o AVA parceiro). Badges de status usam contraste auditado WCAG AA (> 4.5:1).

## 2. Padrões de Navegação Canônica

### Camada Superior: Tabs de Status (`RoleStatusTabs.tsx`)
- **Aparência**: Pílula animada de layout com transição fluida (`layoutId`).
- **Estado Ativo**: Fundo `--blue` com texto branco ou `--yellow` com texto `--ink`.
- **Estados Canônicos do Aluno**:
  - `Lead`: Aguardando conclusão da matrícula.
  - `Enrollment`: Pagamento confirmado, aguardando envio/conferência de documentos.
  - `Active`: Matrícula aprovada, acesso liberado ao ambiente do parceiro credenciado.
  - `Veteran`: Concluinte / processo de emissão do diploma oficial.

### Camada Inferior: Dock Adaptativo (`RoleAdaptiveNavDock.tsx`)
- **Estilo**: Cápsula flutuante zero-g centralizada na base da tela (`fixed bottom-4`).
- **Backdrop**: `rgba(11, 18, 32, 0.85)` com `backdrop-filter: blur(16px)` e borda suave de 1px.
- **Ícones**: Lucide Icons com área de toque mínima de 44x44px. Badges de atenção (`!`) em vermelho `--danger` para documentos pendentes.

## 3. Cartões Operacionais e Formulários

### Cartão de Documento (`DocumentUploadCard`)
- **Superfície**: Fundo branco com borda de 1px em `--line-light` e raio de 18px.
- **Estados Visuais**:
  - *Pendente*: Borda pontilhada neutra com botão de upload claro.
  - *Em Análise*: Borda `--warning`, badge amarelo suave.
  - *Aprovado*: Borda `--success` com ícone de checkmark verde institucional.
  - *Recusado*: Borda `--danger` com motivo da recusa em texto legível (`--danger`).
