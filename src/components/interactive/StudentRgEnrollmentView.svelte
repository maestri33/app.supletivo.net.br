<script lang="ts">
  import { onMount } from "svelte";
  import { compressImage } from "@/lib/image-compression";
  import {
    classifyDocument, getEnrollmentMe, getEnrollmentRg, postEnrollmentRgPhoto,
    getErrorMessage, ApiError, type AnalysisAck, type RgSection,
  } from "@/lib/api";
  import {
    createRgCaptureState, recordRgUpload, applyRgSnapshot, deriveRgCapture,
    resolveRgClassification, type RgCaptureSlot,
  } from "@/lib/rg-capture";
  import { ackPoll } from "@/lib/poll";
  import { fetchPrivateMedia } from "@/lib/private-media";
  import { enrollmentPath } from "./student/workflow";
  import IdCardIcon from "@/components/icons/IdCardIcon.svelte";
  import CameraIcon from "@/components/icons/CameraIcon.svelte";
  import UploadFileIcon from "@/components/icons/UploadFileIcon.svelte";

  let capture = $state(createRgCaptureState());
  const view = $derived(deriveRgCapture(capture));
  let loading = $state(true), analyzing = $state(false), uploading = $state(false);
  let consulting = $state(false), uploadUncertain = $state(false);
  let error = $state<string | null>(null), consultationError = $state<string | null>(null);
  let section = $state<RgSection | null>(null);
  let nextPath = $state<string | null>(null);
  let image = $state<{ url: string; type: string; label: string } | null>(null);
  let sourceDialog: HTMLDialogElement;
  let cameraInput: HTMLInputElement, fileInput: HTMLInputElement;
  let active = true, pollGeneration = 0, snapshotSequence = 0;
  let pollTimer: ReturnType<typeof setTimeout> | undefined;
  let lastSlot: RgCaptureSlot | null = null;
  const urls = new Map<string, { url: string; type: string }>();
  const busy = $derived(analyzing || uploading);
  const canCapture = $derived(!loading && !uploadUncertain && view.nextSlot !== null && view.phase !== "approved");
  const captureTitle = $derived(view.nextSlot === "back" ? "Agora, envie o verso" :
    view.nextSlot === "front" && view.received.back ? "Agora, envie a frente" :
    view.error ? "Envie uma nova imagem do RG" : "Envie seu RG");
  const captureHint = $derived(view.nextSlot === "back" ? "A frente já foi recebida. Falta o outro lado." :
    view.nextSlot === "front" && view.received.back ? "O verso já foi recebido. Falta o outro lado." :
    "Pode começar por qualquer lado. Frente e verso na mesma imagem também valem.");

  function failure(cause: unknown) { return cause instanceof Error ? cause.message : getErrorMessage(cause); }
  function notifyDock() {
    const current = deriveRgCapture(capture);
    const rgStatus = current.phase === "approved" ? "approved" : current.error ? "rejected" :
      current.received.front || current.received.back || current.received.full ? "under_review" : "pending";
    window.dispatchEvent(new CustomEvent("supletivo:student-state", { detail: { rgStatus } }));
  }
  function stopPolling() {
    pollGeneration += 1;
    if (pollTimer) clearTimeout(pollTimer);
    pollTimer = undefined;
  }
  async function resolveNextPath() {
    const me = await getEnrollmentMe();
    if (!active) return;
    const path = enrollmentPath(me.status);
    nextPath = path && path !== "/student/enrollment/rg" ? path : null;
  }
  async function showStoredPreview() {
    const receipt = deriveRgCapture(capture);
    const path = lastSlot ? receipt.paths[lastSlot] : receipt.paths.full || receipt.paths.back || receipt.paths.front;
    if (!path) return;
    const revision = capture.revision;
    try {
      if (!urls.has(path)) {
        const blob = await fetchPrivateMedia(path);
        if (!active) return;
        urls.set(path, { url: URL.createObjectURL(blob), type: blob.type });
      }
      if (active && capture.revision === revision) {
        image = { ...urls.get(path)!, label: receipt.paths.full === path ? "RG com frente e verso" : receipt.paths.back === path ? "Verso recebido" : "Frente recebida" };
      }
    } catch { /* Preview failure never changes the confirmed storage receipt. */ }
  }
  async function readSnapshot(generation = pollGeneration) {
    const token = { revision: capture.revision, sequence: ++snapshotSequence };
    const result = await getEnrollmentRg();
    if (!active || generation !== pollGeneration) return;
    const updated = applyRgSnapshot(capture, result, token);
    if (updated === capture) return;
    capture = updated; section = result; notifyDock();
    void showStoredPreview();
    if (deriveRgCapture(capture).phase === "approved") {
      try { await resolveNextPath(); }
      catch { if (active) consultationError = "RG aprovado. Não foi possível consultar a próxima etapa; consulte novamente."; }
    }
  }
  function needsPolling() {
    const current = deriveRgCapture(capture);
    return current.phase === "analysis" || Object.values(current.statuses).some(status => status === "pending");
  }
  function startPolling(ack?: AnalysisAck) {
    stopPolling();
    const generation = pollGeneration;
    const { intervalMs, deadlineMs } = ackPoll(ack);
    const interval = Math.max(500, intervalMs);
    const tick = async () => {
      if (!active || generation !== pollGeneration) return;
      try {
        await readSnapshot(generation);
        if (!active || generation !== pollGeneration) return;
        if (needsPolling() && Date.now() < deadlineMs) pollTimer = setTimeout(tick, interval);
      } catch (cause) {
        if (active && generation === pollGeneration) consultationError = `O arquivo recebido continua salvo. Não foi possível consultar a análise: ${failure(cause)}`;
      }
    };
    pollTimer = setTimeout(tick, interval);
  }
  async function refresh() {
    if (consulting || busy) return;
    stopPolling(); consulting = true; consultationError = null;
    try {
      await readSnapshot();
      if (!active) return;
      uploadUncertain = false; loading = false; error = null;
      if (needsPolling()) startPolling();
    } catch (cause) { if (active) consultationError = failure(cause); }
    finally { if (active) consulting = false; }
  }
  function openSources() { if (canCapture && !busy) sourceDialog.showModal(); }
  function chooseSource(source: "camera" | "file") {
    sourceDialog.close();
    (source === "camera" ? cameraInput : fileInput).click();
  }
  async function processSelectedFile(file: File) {
    if (busy || !canCapture) return;
    stopPolling(); error = null; consultationError = null; analyzing = true;
    let posting = false;
    try {
      if (!file.size || file.size > 15 * 1024 * 1024) throw new Error("Escolha um arquivo não vazio de até 15 MB.");
      if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) throw new Error("Use uma imagem JPG, PNG, WebP ou um PDF do RG.");
      // Recognition decides the slot; the next requested side never relabels the image.
      const slot = resolveRgClassification(await classifyDocument(file));
      if (!active) return;
      const current = deriveRgCapture(capture);
      if (slot !== "full" && current.received[slot] && current.statuses[slot] !== "rejected" && current.nextSlot !== slot) {
        throw new Error(`Esse lado já foi recebido. Envie ${slot === "front" ? "o verso" : "a frente"} do RG.`);
      }
      const upload = file.type.startsWith("image/") ? await compressImage(file) : file;
      if (!active) return;
      analyzing = false; uploading = true; posting = true;
      const ack = await postEnrollmentRgPhoto(slot, upload);
      if (!active) return;
      if (ack.slot !== slot || !ack.stored) throw new Error("O servidor não confirmou o recebimento deste arquivo.");
      capture = recordRgUpload(capture, slot, ack.stored); lastSlot = slot;
      const url = URL.createObjectURL(upload);
      urls.set(`local:${capture.revision}`, { url, type: upload.type });
      image = { url, type: upload.type, label: slot === "full" ? "RG com frente e verso" : slot === "back" ? "Verso recebido" : "Frente recebida" };
      uploadUncertain = false;
      // Release capture on storage ACK; OCR continues independently.
      uploading = false; notifyDock(); startPolling(ack);
    } catch (cause) {
      if (!active) return;
      if (posting && (!(cause instanceof ApiError) || cause.status >= 500)) {
        uploadUncertain = true;
        error = "A conexão falhou antes da confirmação. Consulte o recebimento antes de enviar novamente.";
      } else error = failure(cause);
      if (!uploadUncertain && needsPolling()) startPolling();
    } finally { if (active) { analyzing = false; uploading = false; } }
  }
  function onFileInputChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0]; input.value = "";
    if (file) void processSelectedFile(file);
  }
  onMount(() => {
    void refresh();
    return () => { active = false; stopPolling(); for (const item of urls.values()) URL.revokeObjectURL(item.url); };
  });
</script>

<section class="rg-flow" aria-labelledby="rg-title">
  <header>
    <p class="eyebrow">Matrícula · Documento de identidade</p>
    <h1 id="rg-title">Seu RG</h1>
    <p>Envie o documento. Nós identificamos os lados e preenchemos seus dados.</p>
  </header>
  <div class="capture-panel" class:awaiting={!view.error && (view.received.front || view.received.back || view.received.full) && view.phase !== "approved"} class:approved={view.phase === "approved"} aria-busy={busy || consulting}>
    {#if error || view.error}<p class="feedback error" role="alert">{error || view.error}</p>{/if}
    {#if consultationError}<p class="feedback warning" role="status">{consultationError}</p>{/if}
    {#if loading}
      <div class="state-message" role="status"><IdCardIcon class="document-icon" /><h2>Consultando seu RG</h2><p>Verificando se já existe um arquivo recebido.</p></div>
    {:else if uploadUncertain}
      <div class="state-message" role="status"><h2>Vamos conferir o recebimento</h2><p>Assim evitamos reenviar um arquivo que já pode estar salvo.</p></div>
    {:else if canCapture}
      <button type="button" class="capture-space" disabled={busy} onclick={openSources} aria-describedby="capture-hint" data-testid="rg-capture">
        {#if busy}<span class="spinner" aria-hidden="true"></span>{:else}<IdCardIcon class="document-icon" />{/if}
        <strong>{analyzing ? "Identificando o RG e os lados…" : uploading ? "Enviando o arquivo…" : captureTitle}</strong>
        <span>{busy ? "Aguarde a confirmação do arquivo." : "Tirar foto ou escolher arquivo"}</span>
      </button>
      <p id="capture-hint" class="capture-hint" aria-live="polite">{captureHint}</p>
    {:else}
      <div class="state-message" role="status" aria-live="polite">
        <IdCardIcon class="document-icon" />
        <h2>{view.phase === "approved" ? "RG aprovado" : view.phase === "review" ? "RG em conferência" : "RG recebido"}</h2>
        <p>{view.phase === "approved" ? "Os dados foram conferidos. Você pode continuar a matrícula." : view.phase === "review" ? (view.reason || "Seu documento está em conferência. Acompanhe o resultado aqui.") : "Frente e verso recebidos. Estamos analisando seus dados; não precisa enviar outra imagem."}</p>
      </div>
    {/if}
    {#if view.received.front || view.received.back || view.received.full}
      <p class="receipt" role="status">
        {view.received.full ? "✓ Frente e verso recebidos no mesmo arquivo" : view.received.front && view.received.back ? "✓ Frente e verso recebidos" : view.received.front ? "✓ Frente recebida" : "✓ Verso recebido"}
        {#if canCapture && !view.error && !view.received.full}<span>A análise dos dados continua enquanto você envia o outro lado.</span>{/if}
      </p>
    {/if}
    {#if image}
      <details class="preview"><summary>Ver arquivo recebido</summary>
        {#if image.type.startsWith("image/")}<img src={image.url} alt={image.label} width="640" height="400" decoding="async" />
        {:else}<a href={image.url} target="_blank" rel="noopener noreferrer">Abrir PDF recebido ↗</a>{/if}
      </details>
    {/if}
    {#if view.phase === "approved" && nextPath}<a href={nextPath} class="btn continue">Continuar matrícula →</a>{/if}
    {#if loading || uploadUncertain || consultationError || view.phase === "analysis" || view.phase === "review" || (view.phase === "approved" && !nextPath)}
      <button type="button" class="secondary" onclick={refresh} disabled={consulting || busy}>{consulting ? "Consultando…" : uploadUncertain ? "Conferir recebimento" : "Consultar análise"}</button>
    {/if}
    {#if !view.complete && !loading}<p class="file-help">JPG, PNG, WebP ou PDF · até 15 MB</p>{/if}
  </div>
  {#if view.phase === "approved" && section?.number}
    <details class="extracted"><summary>Dados extraídos do RG</summary>
      <dl><dt>Nome</dt><dd>{section.name || "Ainda não identificado"}</dd><dt>Número</dt><dd>{section.number}</dd>
        <dt>Órgão emissor</dt><dd>{section.issuing_agency || "Ainda não identificado"}</dd><dt>Filiação</dt><dd>{section.mother_name || "Ainda não identificada"}</dd></dl>
    </details>
  {/if}
  <p class="photo-help">Deixe as quatro bordas visíveis, com boa luz e sem reflexos.</p>
</section>

<input bind:this={cameraInput} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden onchange={onFileInputChange} aria-label="Fotografar RG" />
<input bind:this={fileInput} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" hidden onchange={onFileInputChange} aria-label="Selecionar arquivo do RG" />
<dialog bind:this={sourceDialog} class="source-dialog" aria-labelledby="source-title">
  <h2 id="source-title">Como quer enviar o RG?</h2><p>Uma foto, uma imagem com os dois lados ou um PDF.</p>
  <button type="button" class="btn source-action" onclick={() => chooseSource("camera")}><CameraIcon class="action-icon" /> Tirar foto</button>
  <button type="button" class="secondary source-action" onclick={() => chooseSource("file")}><UploadFileIcon class="action-icon" /> Escolher arquivo</button>
  <button type="button" class="secondary cancel" onclick={() => sourceDialog.close()}>Cancelar</button>
</dialog>

<style>
  .rg-flow { width: 100%; max-width: 36rem; margin: 0 auto; font-family: var(--font-sans); color: var(--ink); }
  header { margin: 0 0 1.5rem; color: var(--paper); }
  .eyebrow { font-size: .8rem; font-weight: 700; color: var(--muted-on-dark); margin: 0 0 .5rem; }
  h1 { font: 400 var(--text-h2-sm)/1.08 var(--font-display); margin: 0 0 .65rem; }
  header > p:last-child { color: var(--muted-on-dark); line-height: 1.5; margin: 0; }
  .capture-panel { background: var(--paper); border: 1px solid var(--line-light); border-top: 4px solid var(--danger); border-radius: var(--radius); padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
  .capture-panel.awaiting { border-top-color: var(--warning); }
  .capture-panel.approved { border-top-color: var(--success); }
  .capture-space { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .75rem; width: 100%; min-height: 180px; padding: 1.25rem .75rem; border: 1px dashed var(--danger); border-radius: var(--input-radius); background: var(--paper-soft); color: var(--ink); cursor: pointer; font: inherit; }
  .capture-space strong { font-size: 1.125rem; }
  .capture-space > span:last-child { color: var(--muted-on-light); font-size: .9rem; }
  .capture-space:hover:not(:disabled) { border-style: solid; background: var(--paper); }
  .capture-space:disabled { cursor: wait; }
  .capture-hint { text-align: center; color: var(--muted-on-light); font-size: .925rem; line-height: 1.5; margin: 0; }
  :global(.document-icon) { width: 2.5rem; height: 2.5rem; color: var(--blue); }
  :global(.action-icon) { width: 1.25rem; height: 1.25rem; flex-shrink: 0; }
  .feedback { margin: 0; padding: .9rem; border-radius: var(--input-radius); font-size: .925rem; line-height: 1.5; overflow-wrap: anywhere; }
  .error { background: var(--danger-bg); color: var(--danger); }
  .warning { background: var(--warning-bg); color: var(--warning); }
  .state-message { display: flex; flex-direction: column; align-items: center; gap: .75rem; text-align: center; padding: 1rem .25rem; }
  h2 { font: 400 var(--text-h3)/1.3 var(--font-display); margin: 0; }
  .state-message p { color: var(--muted-on-light); line-height: 1.5; margin: 0; }
  .receipt { color: var(--green); font-size: .9rem; font-weight: 700; margin: 0; line-height: 1.5; }
  .receipt span { display: block; font-weight: 400; margin-top: .35rem; color: var(--muted-on-light); }
  .preview, .extracted { border-top: 1px solid var(--line-light); }
  summary { cursor: pointer; min-height: var(--input-height); align-content: center; font-size: .925rem; color: var(--blue); font-weight: 700; }
  .preview img { display: block; width: 100%; height: auto; max-height: 24rem; object-fit: contain; border-radius: var(--input-radius); background: var(--paper-soft); }
  .preview a { display: inline-flex; min-height: var(--input-height); align-items: center; color: var(--blue); text-decoration: underline; }
  .secondary { width: 100%; min-height: var(--input-height); border: 1px solid var(--line-light); border-radius: var(--radius-pill); padding: .75rem 1rem; background: var(--paper); color: var(--ink); font: 700 .925rem var(--font-sans); cursor: pointer; }
  button:disabled { opacity: .7; }
  button:focus-visible, summary:focus-visible, a:focus-visible { outline: 2px solid var(--blue); outline-offset: 4px; }
  .continue { width: 100%; min-height: var(--input-height); justify-content: center; font-size: .925rem; }
  .file-help { color: var(--muted-on-light); font-size: .8rem; text-align: center; margin: 0; }
  .photo-help { color: var(--muted-on-dark); font-size: .925rem; line-height: 1.5; margin: 1rem 0 0; }
  .extracted { margin-top: 1rem; padding: 0 1rem 1rem; background: var(--paper); border: 1px solid var(--line-light); border-radius: var(--radius); }
  dl { margin: 0; font-size: .925rem; overflow-wrap: anywhere; }
  dt { color: var(--muted-on-light); margin-top: .75rem; }
  dd { margin: .2rem 0 0; font-weight: 700; }
  .source-dialog { width: min(100% - 2rem, 28rem); box-sizing: border-box; margin: auto; border: 1px solid var(--line-light); border-radius: var(--radius-lg); padding: 1.5rem; background: var(--paper); color: var(--ink); box-shadow: var(--shadow-zero-g); font-family: var(--font-sans); }
  .source-dialog::backdrop { background: var(--glass-bg-dark); }
  .source-dialog p { color: var(--muted-on-light); margin: .75rem 0 1.25rem; line-height: 1.5; }
  .source-action { display: flex; align-items: center; justify-content: center; gap: .5rem; width: 100%; min-height: var(--input-height); margin-top: .75rem; font-size: .925rem; }
  .cancel { margin-top: 1rem; border-color: transparent; color: var(--muted-on-light); }
  .spinner { width: 2rem; height: 2rem; border: 3px solid var(--line-light); border-top-color: var(--blue); border-radius: var(--radius-pill); animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { .spinner { animation: none; } }
</style>
