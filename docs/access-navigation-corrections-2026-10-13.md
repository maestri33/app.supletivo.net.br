# Acesso ao parceiro e navegação — 2026-10-13

## Implementação local

- Dock do aluno ativo: substituição de Disciplinas por Acesso.
- `/student/active/access` mostra URL, login, senha com exibição controlada e orientações da instituição parceira.
- Duas taxas lidas do campo `partner_fees` em `/api/v1/clients/student/me`; estados, valores e agenda vêm dos pedidos financeiros reais. Ausência do campo não significa taxa paga.
- `/student/active/subjects` redireciona 308 para Acesso.
- Financeiro inclui meio/provedor, confirmação, vencimento e comprovante quando informado pelo provedor.
- Proposta do aluno lead mostra dados captados e responsáveis; botões de contato dependem dos contatos fornecidos pelo backend.
- Polo: rótulos Alunos e Provas; removidos Processos/Bancas. Novo polo e escolha de coordenador pertencem ao frontend administrativo.
- Administrador aparece como acesso externo somente para usuário cujo backend informa staff/admin/superuser.

## Evidências e limites

- Verificação Astro: zero erros/avisos, com hints relativos a alterações concorrentes.
- Build em diretório alternativo: concluído (o build inicial em `dist` encontrou bloqueio de arquivo no Windows).
- Sem deploy nem smoke autenticado desta entrega. Mudanças simultâneas de outra execução precisam ser separadas antes da publicação.
- O backend precisa publicar os campos de responsáveis e `partner_fees` antes dos frontends.
- Apenas o usuário homologa a entrega.
