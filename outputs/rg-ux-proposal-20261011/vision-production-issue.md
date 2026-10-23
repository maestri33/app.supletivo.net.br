**Decisão expressa atual do proprietário: toda IA da plataforma deve utilizar exclusivamente Cloudflare Workers AI**, incluindo texto, visão, OCR/extração documental e demais workloads de inferência. Esta decisão substitui os provedores e as dependências de configuração citados na versão anterior desta issue.

O trabalho é integrar e comprovar Workers AI nos processos reais do backend, com segredos apenas no servidor. Bancos principais permanecem no Azure; D1 atende dados de borda. Esta issue registra decisão e critérios pendentes, sem afirmar que a integração Cloudflare já tenha sido promovida ou que o canário tenha passado.

Relacionada à correção de captura [app#17](https://github.com/maestri33/app.supletivo.net.br/issues/17) e ao acompanhamento de promoção/OCR [backend#18](https://github.com/maestri33/backend.supletivo.net.br/issues/18). Checks do frontend não comprovam inferência em produção.

## Diagnóstico histórico do fluxo anterior

- O runtime inspecionado usava `IA_PROVIDERS=fake`; a configuração MiniMax apontava para loopback na porta 9999 sem serviço disponível, e OmniRoute não tinha modelo/chave de visão configurados.
- Um arquivo autorizado contendo RG completo foi salvo como frente após classificação totalmente indefinida e fallback do frontend. Não houve reconhecimento comprovado de `full`.
- Na investigação anterior, uma credencial externa permitiu listar modelos (HTTP 200), mas a requisição de visão respondeu HTTP 402 por saldo insuficiente. Isso explica a indisponibilidade daquela alternativa; não é plano para a integração atual.
- A UI corrigida preserva resultado indefinido como falha explícita, sem atribuir frente e sem novo upload por suposição.

MiniMax/OmniRoute são apenas histórico diagnóstico. Restaurá-los, resolver o saldo daquela conta ou aguardar login Infisical não são requisitos nem soluções desta issue. Nenhuma credencial, dado pessoal, imagem ou caminho privado de documento é publicado aqui.

## Implementação requerida

1. Integrar **Cloudflare Workers AI exclusiva** para texto, reconhecimento visual e OCR/extração. Selecionar modelos por capacidade real e esquema oficial vigente; comprovar inferência, sem tratar listagem de modelos ou presença de token como sucesso.
2. Aplicar a integração à configuração efetiva do processo web e do qcluster/worker documental. Ambos devem chamar Workers AI; produção não pode usar fake ou fallback para outro provedor de IA.
3. Manter credenciais e chamadas somente no servidor, em configuração protegida do backend ou secrets/bindings Cloudflare conforme o runtime. Não gravar tokens em fonte, frontend, bundle ou imagem.
4. Preservar bancos principais no Azure e D1 na borda. Esta mudança de IA não autoriza migração do banco principal.
5. Consumir a classificação real `front/back/full` sem atribuição por slot esperado. Captura indefinida mantém erro/incerteza recuperável pelo mesmo espaço, sem exigir digitação manual de dados pessoais.
6. Executar reconhecimento e OCR reais Cloudflare com documentos autorizados do canário. Preservar pagamentos, recebimentos e dados válidos; não forçar campos, parecer ou status para aparentar sucesso.
7. Atualizar o guard de release para recusar provider fake ou não Cloudflare, endpoint loopback/de desenvolvimento, configuração Cloudflare incompleta, diferenças entre web e worker e falha de inferência real.

## Critérios de aceite

- Toda IA coberta pelo runtime usa Cloudflare Workers AI, incluindo inferência textual, visão e OCR/extração; não há caminho produtivo para outro provedor nem aprovação por fixture.
- Web e qcluster têm configuração efetiva Cloudflare, coerente e utilizável. Segredos ficam exclusivamente no servidor/ambiente externo ao artefato.
- Smoke autenticado comprova inferência textual e visão reais Cloudflare. Health geral, listagem de modelos, token disponível ou código preparado não substituem esses resultados.
- O arquivo autorizado com RG completo é reconhecido como `full`, recebido nesse slot e não solicita outra face.
- Frente e verso isolados são reconhecidos em qualquer ordem; cada face pode ser enviada imediatamente e a outra coletada sem esperar OCR, conforme app#17.
- Classificação totalmente indefinida não vira frente por fallback, não gera aprovação fictícia e permite nova triagem no mesmo espaço.
- O worker usa OCR/extração Cloudflare real; campos, parecer e próximo estado ficam persistidos no backend e consultáveis. Nenhum preenchimento ou avanço manual é usado como evidência.
- Falha de Workers AI gera estado recuperável e orientação pública, preservando arquivos recebidos sem ficar indefinidamente em pending.
- O guard de release bloqueia fake, provedor não Cloudflare, loopback de desenvolvimento, configuração ausente, divergência web/worker e falha de inferência real.
- Evidências de modelo/runtime/canário são registradas sem tokens, dados pessoais ou caminhos privados de documentos. A homologação permanece exclusiva do proprietário.

Integração, inferência real, canário e promoção continuam pendentes até haver evidência específica. A correção local da UI não comprova o serviço de IA. Esta atualização documental não executa commit, deploy, mudança de runtime ou versão global.