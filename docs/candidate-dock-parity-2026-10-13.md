# Dock e cadastro do candidato — 13/10/2026

## Comportamento implementado, ainda sem deploy desta alteração

- Mesmo construtor de dock documental para aluno em matrícula e promotor candidato: identidade, endereço, escolaridade e selfie.
- Aluno aceita somente RG; candidato aceita RG ou CNH. Não foi alterada a regra de o aluno lead pagar antes de enviar documentos.
- Candidato: `#documents`, `#address`, `#education`, `#selfie` selecionam conteúdo real. Etapas futuras ficam indisponíveis até os requisitos existentes do servidor; aprovadas ficam consultáveis.
- `Comece a indicar`: botão com SVG no cabeçalho, acessível desde o cadastro inicial; abre `#referral`, com link e compartilhamento. A seção não ocupa a tela documental.
- Upload: um espaço, escolha câmera/arquivo no modal. Campo só existe após a consulta inicial para evitar corrida com a hidratação; não foi alterada a análise autoritativa do servidor.
- Escolaridade e biometria mantêm regras existentes de cada papel. PIX de recebimento continua antes da escolaridade, sem cobrança de inscrição do promotor.

## Evidência técnica

Artefato isolado: `.release-build/candidate-parity-108`, snapshot do índice anterior ao commit concorrente `.109`; NÃO publicar esse artefato antigo sobre a versão atual.
Typecheck após geração de tipos: passou. Builds Node e Cloudflare: passaram. Checkpoint fast: passou.
18 testes de navegação/upload/escolaridade/rolagem: passaram após correção da corrida do campo de arquivo.
3 tamanhos, 320/390/1280: navegação, destaque ativo, consulta de etapas aprovadas, ausência de overflow horizontal e separação conteúdo/dock passaram.
9 cenários de recuperação de selfie passaram no ciclo anterior; não são prova de biometria real em produção.
Screenshots em `outputs/candidate-dock-*-20261013.png` usam fixtures locais e não representam uma homologação de conta real.

## Produção observada

O shell já publicado em `.107`, Worker `10e4d6d5-8f51-4e0a-8a72-5f7d56f049b3`, foi medido em sessão real: cabeçalho 0–65 px, conteúdo 65–645 px, dock 645–731 px; o conteúdo usa scroll interno.
Rollback dessa etapa: Worker `c41aeae6-a991-45b0-8a6d-bbb3405af124` (consultar a versão ativa antes de executar; outra execução publicou depois).
Victor já estava como promotor ATIVO na sessão real, por isso não foi apagado/resetado para simular candidato durante alterações concorrentes.

## Pendência concreta de integração e release

Outra execução alterou arquivos do mesmo app e registrou `.109` enquanto esta tarefa estava em testes. Há alterações sem commit em app/roles/aluno/polo/API. A aba Admin reapareceu na produção observada, divergindo de AGENTS.md; isso está fora deste patch.
1. Coordenar/pausear o outro escritor, registrar o trabalho dele em commit e integrar este patch na base final. Preservar mudanças alheias; não usar `git add .`.
2. Reconsultar version.v7m.live e reservar o próximo patch, reexecutar build/checks sobre a base integrada, identificar o artefato por commit.
3. Deploy do artefato integrado, smoke real de candidato/aluno, medir geometria mobile, verificar RG/CNH e indicador ativo. Só então registrar evidência de produção e rollback atual.

Patch das alterações preparadas: `outputs/candidate-parity-20261013.patch`.
