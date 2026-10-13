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
- Publicado: app `.112`, Worker `d3f272ce-b6a4-477c-aec2-c6b7e7a7cd6a`, código `df6bb9a8b75206ed0f9575d319078e50ad95a0e9`. Rollback: Worker `668a12ce-cf1e-4055-a51f-e261b181ab66`.
- Os contratos foram publicados primeiro no backend `.110`; o backend `.113` também corrige a inferência indevida de papel de aluno após revogação.
- Smoke autenticado de produção: painel e arquivo de documentos do promotor carregam dados reais; abas agora respeitam os papéis ativos. Não foi feita nova aprovação documental ou transação financeira.
- Acesso e financeiro do aluno ativo permanecem sem smoke real: a consulta de produção encontrou zero registros Student e Enrollment. Não foram criados estados fictícios para apresentar a tela como testada.
- Apenas o usuário homologa a entrega.
