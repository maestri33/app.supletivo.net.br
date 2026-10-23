App `.88` publicado, Worker `68c5c611-d875-4ad0-ae97-aa5fde5d664e`, integrado ao backend `.88` de identidade.

Aluno continua RG somente. Promotor reconhece RG/CNH no primeiro arquivo e usa o mesmo estado de captura, ACK, frente/verso/inteiro, reenvio e proteção contra GET antigo. Um arquivo com ambos os lados encerra a coleta; uma face pede a que falta, sem esperar OCR. Arquivo não reconhecido/ilegível não inventa lado; indisponibilidade agora tem mensagem de nova tentativa. Clientes aguardam60s, compatível com renderização PDF e análise.

27 testes app passaram; Astro117arquivos sem erros/avisos e build concluído. Chamadas reais Cloudflare classificaram frente, verso, RGinteiro, CNHdigitalPDF e recusaram PNG em branco. Na reanálise do RG do canário pela fila real `.88`, nome/CPF/nascimento conferiram, dados persistiram e a UI recarregada mostrou RG aprovado, frenteverso no mesmo arquivo e Continuar matrícula. Confirmação observada no GOWA às20:21:25UTC.

A evidência desta rodada é reanálise do arquivo já salvo, sem novo upload pela UI. CNHPDF teve leitura real correta sem mudar conta de promotor. Cadastro completo do promotor, selfie ao vivo, nova captura por dispositivo e endereço ainda exigem testes próprios; não declaro plataforma inteira pronta nem fecho a issue.

Documentação: `docs/rg-capture-release-2026-10-11.md`; captura de tela `docs/rg-capture-v88-canary.png`; backend#22 contém artefato e rollback. Rollback do Worker para `.87`: versão `cd7d7dc1-fde4-4407-9016-f6e4fcb1036a`.