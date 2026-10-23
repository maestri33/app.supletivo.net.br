A tela de RG precisa apresentar um único espaço de captura e usar a classificação real para enviar cada imagem ao slot correto, mantendo OCR assíncrono separado da coleta. A regra expressa mais recente do usuário substitui a proposta anterior de reunir frente e verso no cliente antes de enviar. O protótipo local anterior está obsoleto para fluxo/demonstração e não é artefato de aceitação desta regra.

## Comportamento esperado

- **Estudante envia somente RG, em UM espaço de captura**, com ações de fotografar ou anexar. Não exibir dois cards/placeholders de frente e verso nem seletor de CNH.
- Consumir a classificação `front`, `back` ou `full`. Não inferir a face pelo passo esperado quando a classificação informar outro lado.
- **front → POST front imediatamente**, mesmo com apenas essa face selecionada. Pedir verso no mesmo espaço se ainda não recebido, **sem esperar OCR, aprovação ou fim de polling da frente**.
- **back → POST back imediatamente**, mesmo com apenas essa face selecionada. Pedir frente no mesmo espaço se ainda não recebida, **sem esperar OCR, aprovação ou fim de polling do verso**.
- **full → POST full imediatamente**, encerrando a coleta; **não pedir outra face** enquanto a análise assíncrona está pendente. Rejeição posterior pode solicitar correção expressa do documento recebido.
- Registrar recebimento no ACK/mídia persistida. Prévia, classificação ou seleção local não equivale a recebimento nem aprovação.
- Ao confirmar a primeira face, encerrar transporte e liberar a segunda captura. OCR/extração seguem assíncronos; consulta de parecer não bloqueia ações da face faltante.
- Estados com texto/ícone: vermelho incompleto/correção, laranja recebido aguardando parecer, glass aprovado. Uma face recebida e outra faltante conserva recebimento parcial e pede a outra.
- Avanço, dados e destino vêm do backend. Selfie permanece na própria etapa. Não adicionar formulários longos.

## Evidência atual

Na captura real de produção de 487×629, dois placeholders grandes precedem as ações e a câmera não aparece na primeira tela. `student/enrollment/rg.astro` usa `StudentRgEnrollmentView`, não `IdentityDocumentVerifier`.

Pela leitura do código:

1. A seleção já envia cada lado imediatamente (`StudentRgEnrollmentView:67–98`). Preservar esse envio; corrigir a classificação frente/verso hoje ignorada salvo full (`73–78`).
2. `classifyDocument` chama API (`api.ts:923`), não IA local no dispositivo. MIME/tamanho não reconhecem documento; consumir `completeness` (front/back/full).
3. `isUploading` permanece true durante polling após POST (`83–94`), mantendo “Transmitindo” embora o arquivo possa estar recebido. Encerrar transporte no ACK e permitir a face faltante sem depender de OCR.
4. `next_slot` junto de parecer da frente não comprova ausência do verso (`29–34,57–64`). Cruzar ACK/mídia persistida e parecer por slot; não esperar aprovação de uma face para coletar a outra.
5. Resposta do POST é descartada (`84`); o tipo `AnalysisAck` omite parte da confirmação (`api.ts:876–905`). Consumir slot, stored, estado e prazos reais do ACK.
6. Badge depende da prévia, PDF cru usa img e object-cover recorta bordas. Inputs escondidos acionados por label não oferecem captura por teclado.
7. CTA promete endereço mesmo quando a matrícula pode continuar no RG (`288–298`); derivar rótulo/destino do servidor.

Não houve submissão de documentos nem comprovação de OCR nesta revisão. A evidência estática exige reprodução dos estados reais na implementação.

## Sequência e retomada

Frente primeiro: **classificar front → POST front → registrar ACK → pedir verso → classificar back → POST back → registrar ACK**. OCR pode permanecer pendente durante os dois recebimentos. Verso primeiro usa sequência inversa. Full faz somente **classificar full → POST full → registrar ACK**, sem solicitar outra imagem.

Não reunir as duas faces no cliente para iniciar o envio. Não colocar GET de parecer, aprovação de uma face, atualização de next_slot ou fim de polling como pré-requisito da segunda captura. O mesmo espaço apresenta a próxima solicitação e os resultados, sem dois slots visuais separados.

Os POSTs são independentes. Preservar recebimento parcial e repetir somente o slot falho/faltante. Se ACK for perdido, consultar recebimento antes de repetir, sem esperar OCR. Reabertura retoma por mídia/status persistidos. Erro de prévia ou consulta não apaga recebimento válido. Classificação indefinida não atribui face por suposição nem aprova documento.

Alinhar limites reais de arquivo antes de anunciar um limite. A auditoria anterior registrou frontend de 15 MB/default backend de 10 MB e PDF processando apenas as primeiras duas páginas; conferir configuração real e não prometer preservação irrestrita do original.

## Critérios de aceite

- 360×640: **um único espaço** e ação principal visíveis acima do dock, sem overflow horizontal; controles de 48 px, foco/teclado e interação acessível. Preservar dock adaptativo e safe-area.
- Estudante: somente RG; nenhuma escolha ou aceitação de CNH.
- Frente primeiro: POST front com apenas a frente selecionada; verso pode ser capturado e enviado enquanto OCR da frente permanece pendente.
- Verso primeiro: POST back com apenas o verso selecionado; frente pode ser capturada e enviada enquanto OCR do verso permanece pendente.
- Full: um POST full, sem outra solicitação de face durante a análise assíncrona.
- Classificação diferente da face esperada: POST respeita front/back/full; testar inválido, ilegível e lado indefinido sem aprovação fictícia.
- Nenhuma espera por OCR/parecer/polling entre o primeiro ACK e a captura/envio da face faltante. “Enviando” termina no ACK.
- POST parcial/falho, ACK perdido, consulta indisponível, reload, erro de prévia, rejeição de uma face e revisão humana preservam recebimentos válidos.
- OCR/extrator real, persistência dos campos e destino correto exigem comprovação do backend com documentos autorizados.
- A futura entrega identifica commit/build/deploy, smoke e rollback; homologação exclusiva do proprietário. Esta atualização documental não executa essas etapas.

## Prévia anterior obsoleta

`outputs/rg-ux-proposal-20261011/index.html` e `screen.html` ainda demonstram uma face local aguardando outra, dois resumos/tiles de lados e envio após reunir o documento completo. **Esse fluxo foi substituído. Os HTMLs não são especificação nem artefatos de aceitação da regra atual.** Foram preservados sem alteração e só servem como referência visual histórica; não reproduzir suas transições ou estados locais.

Esta atualização corrige apenas documentação e esta issue; não altera runtime, cadastro ou versão publicada.