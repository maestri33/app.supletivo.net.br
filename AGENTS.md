# app.supletivo.net.br — Diretrizes do Projeto

Este projeto é a aplicação unificada de autenticação e portal multi-role (Aluno, Promotor, Secretaria) da plataforma **Supletivo.net.br** (**Supletivo Brasil**).

## 🏷️ Marca & Identidade
- Marca Oficial: **Supletivo.net.br** / **Supletivo Brasil**.
- Marcas descontinuadas: Não referenciar `maestri.group` ou `v7m` em UI, layouts ou textos públicos.

## 🧭 Escopo & Responsabilidades do `app.supletivo.net.br`
- **Autenticação**:
  - `/autenticacao/login` (login direto para usuários cadastrados).
  - `/autenticacao/otp` (validação de código OTP recebido via WhatsApp/SMS após pré-cadastro ou login).
- **Redirecionamento de Registro**:
  - O fluxo de cadastro inicial do público é originado nas landing pages (`supletivo.net.br/registro/contato` e `supletivo.net.br/registro/cpf`).
  - Após validação/criação, o usuário é direcionado para `app.supletivo.net.br/autenticacao/otp`.
- **Áreas Logadas (Multi-Role)**:
  - Aluno: `/painel`, `/matricula`, `/provas`, `/documentos`
  - Promotor / Secretaria: sub-rotas dedicadas sob controle de acesso por role.

## 🌐 Convenção de Idiomas e Rotas
- **Código e APIs (100% Inglês)**: nomes de variáveis, tipos TypeScript, funções, commits, endpoints (`/api/v1/...`).
- **Interface e Mensagens (100% PT-BR)**: textos da interface, validações de formulário, toasts, notificações.
- **Rotas e URLs de Frontend (100% PT-BR)**: Todas as rotas do usuário final devem ser estritamente em português (`/autenticacao/login`, `/autenticacao/otp`, `/painel`, etc.).

## ⚡ Arquitetura Técnica
- **Astro 5+ (SSR)**: Zero-JS por padrão para cascas, layouts e páginas estáticas.
- **Svelte 5 (Runes)**: Ilhas interativas (`$state`, `$derived`, `$props`, `$bindable`) sob `src/components/interactive/`. Validadas sempre com `svelte-autofixer`.
