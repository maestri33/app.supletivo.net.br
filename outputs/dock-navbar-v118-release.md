Atualização de 13/10/2026 — publicada v0.0.0-sandbox.118.

- Removidos prefixos numéricos dos botões documentais e de pagamento do aluno/candidato.
- Sair foi movido do dock de aluno/promotor para a navbar e usa a limpeza canônica de sessão.
- Indicar está no dock do candidato (#referral) e do promotor ativo (/promoter/active/dashboard#referral). Foi retirado o atalho duplicado do cabeçalho do candidato.
- Grade e demais estados documentais continuam usando o servidor.

Commit final: 4c1f61c6d636555d559348f3e049341381292d67.
Worker publicado: a9b0f21a-547b-44a5-ba8e-56e3e86d2072.
Rollback imediato (v115): f8546745-76f5-4d7f-bc79-b34926190d4f. Base anterior às mudanças: d3f272ce-b6a4-477c-aec2-c6b7e7a7cd6a (v112).

Verificações: typecheck, build Cloudflare, checkpoint fast; 19 testes de cadastro/navegação/rolagem incluindo aluno lead, navbar Sair, logout com sessão limpa e candidato em 320/390/1280 px; 5 testes de dock de liberação passaram; o teste do novo botão Indicar do ativo também passou.

Smoke real: sessão de Victor, promotor ATIVO. Clique em Indicar abriu o link real e ações de compartilhamento; navbar mostra Sair, dock mostra Painel/Indicar/Leads/Comissões/Documentos. A conta não foi resetada; candidato e aluno foram exercitados nos testes com fixtures, não se declara teste real desses estados nesta publicação.

Evidência local: outputs/dock-navbar-v118-production.png. Os screenshots candidate-dock-* em test-results são fixtures.
