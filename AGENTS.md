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

---

## 📋 3. Issues de Referência para Desenvolvimento
- **[Issue #9 — Login Universal Zero-Button](https://github.com/maestri33/app.supletivo.net.br/issues/9)**: Telefone sem botão ➔ OTP sem botão ➔ Handoff por Role/Estado.
- **[Issue #7 — Componente Zero-Form de Comprovante de Residência](https://github.com/maestri33/app.supletivo.net.br/issues/7)**: IA Front + OCR Backend + Reconhecimento de Titular em 1 clique.
- **[Issue #6 — Componente de Verificação de Documento (RG / CNH)](https://github.com/maestri33/app.supletivo.net.br/issues/6)**: Estados Vermelho / Laranja / Glass, triagem IA e regra CNH PDF oficial.
