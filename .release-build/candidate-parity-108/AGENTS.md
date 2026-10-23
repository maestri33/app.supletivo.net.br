# AI & Engineering Guidelines — `app.supletivo.net.br`

> **DIRETIVA DE HERANÇA**: As diretrizes gerais de governança, arquitetura e engenharia do ecossistema estão centralizadas em **[`supletivo.net.br/AGENTS.md`](../supletivo.net.br/AGENTS.md)** e o Design System canônico em **[`supletivo.net.br/DESIGN.md`](../supletivo.net.br/DESIGN.md)**.
> Todo agente que operar neste repositório DEVE seguir rigorosamente este documento e as instruções abaixo.

---

## 🛑 REGRA MANDATÓRIA Nº 1: PROIBIDO CONJECTURAR OU ADIVINHAR
- **NÃO TENTE ADIVINHAR, SUPOR OU CRIAR FLUXOS FUTUROS POR CONTA PRÓPRIA.**
- O usuário já possui a arquitetura inteira desenhada na cabeça e vai passar cada etapa no tempo certo.
- Limite-se estritamente ao que foi pedido. Criar "o que você acha que vem depois" gera código inútil e dá o dobro de trabalho para desfazer.

---

## 🔑 2. Regras de Ouro da Aplicação

1. **O Aluno NÃO Estuda na Nossa Plataforma:**
   - O app é o motor de matrícula, conferência de documentos, pagamentos e afiliação.
   - Assim que o aluno é matriculado e aprovado, ele é **redirecionado para o ambiente virtual da instituição parceira credenciada**, que é quem entrega o ensino.
2. **Zero Formulários ("O Aluno Não Digita"):**
   - Não criamos formulários longos de cadastro de endereço ou dados pessoais.
   - O documento (RG, CNH, Comprovante de Residência) é capturado e os dados são extraídos automaticamente via IA/OCR.
3. **Login Universal e Zero-Button ("Validação e Ir"):**
   - Não existe "StudentLogin" ou login por perfil. **Todos entram pelo mesmo lugar** na raiz do app.
   - **Sem botões de enviar**: O campo de telefone valida e avança sozinho ao completar 11 dígitos; o OTP valida e loga sozinho ao completar os 6 dígitos.
   - A rota de destino pós-login é resolvida **dinamicamente pelo backend conforme a Role e o Estado** do indivíduo.
4. **Navegação Multi-Role e Regra de Ouro das Abas (`EnvironmentTabs` / `Tabs`)**:
   - Este app atende estritamente aos 3 papéis de negócio: **Aluno (`aluno`)**, **Promotor (`promotor`)** e **Coordenador do Polo (`polo`)**. Papéis administrativos (`admin`, `staff`) são terminantemente proibidos no app.
   - **Regra de Ouro (Zero Tabs vs Multi-Role)**:
     - **Usuário com 1 único papel**: **ZERO TABS**. Nenhuma barra de abas é exibida no topo, entrando de forma transparente e direta no seu ambiente.
     - **Usuário com 2 ou 3 papéis**: DEVE obrigatoriamente utilizar o componente canônico [`EnvironmentTabs`](./src/components/interactive/EnvironmentTabs.tsx) / [`Tabs`](./src/components/ui/tabs.tsx) posicionado **estritamente na PARTE SUPERIOR** (`sticky top-0 z-30` com glassmorphism, funcionando como barra superior de navegação / sub-header).
   - **Guia Canônico de Implementação**: Consulte **[`docs/skills/multi-role-tabs/SKILL.md`](./docs/skills/multi-role-tabs/SKILL.md)** para regras de ciclo de vida, acessibilidade WAI-ARIA, integração com o backend e instruções para alterações futuras.

---

## 📋 3. Issues de Referência para Desenvolvimento
- **[Issue #9 — Login Universal Zero-Button](https://github.com/maestri33/app.supletivo.net.br/issues/9)**: Telefone sem botão ➔ OTP sem botão ➔ Handoff por Role/Estado.
- **[Issue #7 — Componente Zero-Form de Comprovante de Residência](https://github.com/maestri33/app.supletivo.net.br/issues/7)**: IA Front + OCR Backend + Reconhecimento de Titular em 1 clique.
- **[Issue #6 — Componente de Verificação de Documento (RG / CNH)](https://github.com/maestri33/app.supletivo.net.br/issues/6)**: Estados Vermelho / Laranja / Glass, triagem IA e regra CNH PDF oficial.
- **[Issue #13 — Reestruturação de Ambientes e Rotas em Inglês](https://github.com/maestri33/app.supletivo.net.br/issues/13)**: Sub-rotas por role, status de 1 palavra e redirects 308.

---

## 🗺️ 4. Arquitetura Canônica de Rotas e Ambientes

1. **Raiz Única Pública (`/`)**:
   - É a **única rota do app que não exige autenticação**.
   - Renderiza o `UniversalLogin` (telefone ➔ OTP) diretamente.
   - Detecção síncrona/client-side: se já autenticado, redireciona imediatamente para o ambiente correspondente (`hub` > `promoter` > `student`).
   - Se acessado com parâmetros de marketing (`ref`, `utm_*`) sem intenção de promotor, redireciona 308 para `https://supletivo.net.br` (preservando atribuição).

2. **Rotas em Inglês e Status de 1 Palavra**:
   - **Student (`/student`)**:
     - `/student/lead`: Aluno recém-captado com checkout/pagamento pendente.
     - `/student/enrollment`: Aluno pago em fase de coleta/validação documental.
   - **Promoter (`/promoter`)**:
     - `/promoter/candidate`: Aspirante a promotor com pré-cadastro.
     - `/promoter/training`: Promotor em treinamento / trava de LMS pendente (status de atenção).
     - `/promoter/active`: Promotor ativo e apto com painel de links e PIX.
   - **Hub / Polo (`/hub`)**:
     - `/hub/active`: Painel operacional do polo regional.
     - `/hub/review`: Fila de conferência de documentos e selfies (status de atenção).

3. **Compatibilidade e Redirecionamentos 308**:
   - Todas as rotas legadas em português (`/painel`, `/matricula`, `/documentos`, `/provas`, `/aluno`, `/promotor`, `/polo`, `/login`) redirecionam via HTTP 308 para as novas rotas em inglês.
   - Guards client-side e SSR garantem que usuários deslogados tentando acessar `/student/*`, `/promoter/*` ou `/hub/*` sejam devolvidos para `/`.

---

## 🧭 5. Sistema Mandatório de Navegação Adaptativa Multi-Role e Multi-Status

> **DIRETIVA MANDATÓRIA**: Toda navegação principal e exibição de etapas operacionais na aplicação (`student`, `promoter`, `hub`) **DEVE obrigatoriamente utilizar a arquitetura unificada de Tabs de Status + Dock Adaptativo**.
> É expressamente proibido hardcodar menus fixos, barras estáticas ou rodapés institucionais que colidam com a navegação em páginas internas.

1. **Separação de Camadas (Status no Topo + Dock na Base)**:
   - **Tabs Superiores (`Tabs` / `RoleStatusTabs`)**: Exibem os **Status/Etapas canônicos** do perfil ativo com animação física do pill via `motion/react`.
   - **Dock Inferior (`RoleAdaptiveNavDock` / `FloatingDock`)**: Reage instantaneamente à troca de status, alterando itens visíveis, rotas de destino, destaque ativo, ações primárias, travas e badges contextuais (`!`, contagem de pendências, `Liberada`, `Concluído`, `Travado`).
2. **Eliminação de Colisão com Rodapé (Opção 1 Nativa)**:
   - Em páginas de aplicação, o rodapé institucional de landing page é suprimido (`showFooter={false}`).
   - O Dock opera por padrão como uma **Bottom Tab Bar Nativa** (`variant="bottom-bar"`), fixada ao `bottom-0` com gradiente de marca superior, preenchimento seguro de safe-area (`pb-[env(safe-area-inset-bottom)]`) e suporte a alternância para `variant="floating"`.
3. **Documentação Técnica e Guia de Manutenção**:
   - Consulte a especificação canônica completa e instruções de alteração futura em **[`docs/skills/role-status-dock.md`](./docs/skills/role-status-dock.md)**.


