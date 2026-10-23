# Proposta de RG — regra de captura atualizada

Especificação local de 11/10/2026. A regra expressa mais recente do usuário substitui a proposta anterior de reunir frente e verso no cliente: **o estudante envia somente RG, em UM espaço de captura; cada face classificada é enviada imediatamente ao backend e a outra é solicitada sem esperar OCR. Um arquivo classificado como `full` não pede outra face.**

Implementação acompanhada em [app#17](https://github.com/maestri33/app.supletivo.net.br/issues/17). Esta atualização especifica comportamento; não realizou upload, OCR, mudança na matrícula, alteração de runtime, commit ou publicação.

## Regra de captura

1. Exibir **um único espaço** para fotografar ou anexar o RG. Não criar dois espaços, cards ou placeholders de frente e verso. O estudante não escolhe CNH nesta etapa.
2. A seleção passa pela classificação de documento/legibilidade/lado. Consumir o retorno `front`, `back` ou `full`; não atribuir a face pelo passo esperado quando o classificador informar outro lado. A classificação atual chama uma API, não IA local no dispositivo.
3. `front`: enviar a imagem imediatamente ao endpoint de frente. `back`: enviar imediatamente ao endpoint de verso. **Não guardar a primeira face no cliente aguardando a segunda para iniciar o POST.**
4. Depois do envio da primeira face, usar o mesmo espaço para pedir somente a face ainda não recebida. Não esperar OCR, aprovação, revisão humana, atualização de `next_slot` ou fim de polling para permitir a segunda captura e seu envio imediato.
5. `full`: enviar imediatamente ao endpoint completo e encerrar a coleta. **Não pedir outra face** enquanto o arquivo completo aguarda análise. Uma rejeição posterior pode pedir correção expressa do documento recebido.
6. Confirmar recebimento por ACK/mídia persistida, nunca pela existência de prévia. Classificação e recebimento não equivalem a aprovação. Análise/extração seguem assíncronas; seus resultados vêm do backend.
7. Estados com texto e ícone: vermelho incompleto/correção, laranja documento recebido aguardando parecer, glass aprovado. Uma face recebida e outra faltante conserva o recebimento parcial e pede a outra, sem bloquear a coleta por análise pendente.
8. Avanço e destino vêm do estado real da matrícula. Selfie permanece na própria etapa. Não introduzir formulários longos.

| Classificação recebida | Ação imediata | Próxima solicitação no mesmo espaço |
|---|---|---|
| `front` | POST da imagem em `photo/front` | Verso, se ainda não recebido; sem esperar OCR da frente |
| `back` | POST da imagem em `photo/back` | Frente, se ainda não recebida; sem esperar OCR do verso |
| `full` | POST do arquivo em `photo/full` | Nenhuma outra face; aguardar análise assíncrona |

Frente e verso podem chegar em qualquer ordem. Quando a outra face já tem recebimento confirmado, não solicitá-la novamente. Classificação indefinida não equivale a aprovação e não deve preencher slot por suposição.

## Contrato e retomada

Frente primeiro: **classificar front → POST front → registrar ACK → pedir verso → classificar back → POST back → registrar ACK**. OCR pode permanecer pendente durante toda a sequência. Verso primeiro usa a sequência inversa. Para `full`, fazer apenas **classificar full → POST full → registrar ACK**.

Não há GET de parecer ou polling obrigatório entre os envios. O transporte termina no ACK de cada POST, liberando o mesmo espaço para a outra captura. Consulta de análise em segundo plano não pode manter `isUploading`, esconder ações da face faltante ou transformar a coleta em espera por aprovação.

Os recebimentos são independentes. Se a frente foi recebida e o verso falhou, preservar a frente e repetir somente o verso. Timeout sem ACK deixa recebimento incerto: consultar mídia/recebimento antes de repetir, sem esperar OCR. Reabertura retoma o que está persistido. Erro ao abrir prévia ou consultar análise não apaga recebimento válido.

Consumir confirmação real por slot e manter recebimento, erro de transporte e parecer separados. Alinhar limites de arquivo frontend/backend antes de anunciar um limite. A auditoria anterior registrou 15 MB no frontend e default de 10 MB no backend, além de renderer PDF restrito às duas primeiras páginas; conferir a implementação/configuração real antes de prometer capacidade ou preservação do original.

## Evidência no código atual

| Achado | Referência | Correção necessária |
|---|---|---|
| Dois quadros vazios escondem a câmera | `StudentRgEnrollmentView.svelte:168–276`; captura de 487×629 | Um espaço de captura e ação principal visível acima do dock |
| Frente/verso classificados são ignorados, exceto full | `StudentRgEnrollmentView.svelte:73–78` | Enviar imediatamente no slot retornado, em qualquer ordem |
| A seleção já faz POST, mas bloqueia durante polling | `StudentRgEnrollmentView.svelte:67–98`, especialmente `83–94` | Preservar envio imediato; liberar a outra captura no ACK sem esperar OCR |
| Parecer/next_slot confundem ausência e análise pendente | `StudentRgEnrollmentView.svelte:29–34,57–64` | Distinguir mídia recebida de parecer; aprovação da frente não é requisito do verso |
| Resposta do POST é descartada | `StudentRgEnrollmentView.svelte:84`; `api.ts:876–905` | Registrar confirmação por slot e estado persistido |
| Badge depende da prévia; PDF usa img; object-cover corta bordas | `StudentRgEnrollmentView.svelte:179–185,216–222` | Status por recebimento/parecer; representação própria de PDF e imagem inteira |
| Captura usa label e input escondido | `StudentRgEnrollmentView.svelte:255–276` | Controles por teclado, foco visível e alvos de 48 px |
| CTA promete endereço embora matrícula possa permanecer RG | `StudentRgEnrollmentView.svelte:288–298` | Rótulo e destino derivados do servidor |

A rota `student/enrollment/rg.astro` usa `StudentRgEnrollmentView`, não `IdentityDocumentVerifier`. As evidências são de leitura do código e da captura; não houve submissão de documentos nem comprovação de OCR real nesta revisão.

## Prévia anterior obsoleta para fluxo e demonstração

**`index.html` e `screen.html` estão obsoletos como especificação do fluxo. Não são artefatos de aceitação da regra atual.** Eles demonstram primeira face local aguardando outra, dois resumos/tiles de lados e envio somente depois de reunir o documento completo. Esses comportamentos foram substituídos pela regra expressa acima.

Não usar “Só frente · local”, “Só verso · local”, “Enviando RG completo”, duas áreas de lados ou espera por aprovação como referência de implementação. Os HTMLs foram preservados sem alteração; servem apenas como referência visual histórica de Paper/Ink, tipografia, dicas e comparação clara/escura. A medição anterior em 360×640 descreve somente aquele protótipo, não comprova layout futuro nem integração.

A direção visual permanece: superfície Paper, moldura institucional Ink, Inter para leitura, Archivo Black para títulos, tokens canônicos e **um único espaço**. Manter orientação essencial visível: “Mostre as quatro bordas e evite reflexos”. Ações: **Fotografar RG** e **Escolher arquivo**, com pedido contextual da face que falta. Recebimento parcial: **“Frente recebida. Agora envie o verso.”** Não dizer “Frente aprovada” para habilitar a outra captura.

Preservar `RoleAdaptiveNavDock`, safe-area e espaço inferior. Não criar rodapé adicional, outro menu de etapas ou dock estático. O cabeçalho privilegiado Aluno/Admin observado na captura não é padrão de aluno e tem conflito de governança separado.

## Critérios de aceitação da implementação

- Em 360×640, um único espaço e ação principal visíveis acima do dock, sem overflow horizontal; controles de 48 px, foco/teclado e interação acessível.
- Somente RG no fluxo do estudante; nenhuma escolha ou aceitação de CNH.
- Frente primeiro: POST front ocorre com apenas essa face selecionada; verso pode ser capturado e enviado enquanto OCR da frente permanece pendente.
- Verso primeiro: POST back ocorre com apenas essa face selecionada; frente pode ser capturada e enviada enquanto OCR do verso permanece pendente.
- Full: um POST full, sem outra solicitação de face durante a análise assíncrona.
- Classificação diferente da face esperada: POST respeita front/back/full. Testar inválido, ilegível e lado indefinido sem aprovação fictícia.
- Estado “enviando” termina no ACK. Nenhuma espera por OCR/parecer/polling entre o primeiro recebimento e a captura/envio da face faltante.
- POST parcial/falho, ACK perdido, consulta indisponível, reload, erro de prévia, rejeição de uma face e revisão humana preservam recebimentos válidos e orientam apenas o que falta/corrigir.
- OCR/extrator real, campos persistidos e avanço por estado do backend exigem evidência com documentos autorizados; esta documentação não comprova esses resultados.
- A futura entrega identifica commit/build/deploy, smoke e rollback. Somente o proprietário homologa; esta atualização documental não executa essas etapas.