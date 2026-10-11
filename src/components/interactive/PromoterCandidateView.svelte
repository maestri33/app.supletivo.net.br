<script lang="ts">
  import { onMount } from "svelte";
  import { ApiError, getErrorMessage, requestAuth, whoami, type Contract } from "@/lib/api";
  import { candidateEducationPayload, educationGrades } from "@/lib/promoter-education";
  import PromoterReferralShare from "./PromoterReferralShare.svelte";
  import LiveSelfieCamera from "./LiveSelfieCamera.svelte";

  interface DocumentSection {
    doc_type?: string | null;
    number?: string | null;
    front_photo?: string | null;
    back_photo?: string | null;
    full_photo?: string | null;
    analysis_status?: string | null;
    analysis_reason?: string | null;
    validation_status?: string | null;
    missing_fields?: string[];
    next_slot?: string | null;
    photos?: Record<string, { status: string; reason?: string }>;
    extracted?: Record<string, unknown>;
  }
  interface Candidate {
    status: string;
    ref_url: string;
    missing_requirements?: string[];
    pix_validated: boolean;
    selfie_verified: boolean;
    profile?: { name?: string; education_level?: string | null; education_completed?: boolean | null; education_qualification?: string | null; education_grade?: number | null; education_last_completed_grade?: number | null; education_status?: string | null } | null;
    address?: { street?: string; number?: string; neighborhood?: string; city?: string; state?: string; zipcode?: string; missing_fields?: string[] } | null;
    address_proof?: { exists: boolean; status?: string | null; reason?: string | null; needs_kinship?: boolean; kinship_relation?: string | null; holder_name?: string | null } | null;
    documents?: { rg?: DocumentSection | null; cnh?: DocumentSection | null } | null;
    selfie?: { exists: boolean; analysis_status?: string | null; analysis_reason?: string | null; status?: string | null; verified?: boolean } | null;
    blocks?: { reason?: string; description?: string }[] | null;
  }
  interface AnalysisAck { stored: boolean | string; analysis_status?: string; poll_after_ms: number }

  const base = "/api/v1/collaborators";
  let candidate = $state<Candidate | null>(null);
  let documentSection = $state<DocumentSection | null>(null);
  let contract = $state<Contract | null>(null);
  let documentType = $state("rg");
  let documentSide = $state("front");
  let pixKey = $state("");
  let pixKeyType = $state("CPF");
  let educationLevel = $state("medio");
  let educationCompleted = $state("yes");
  let educationGrade = $state(0);
  let lastCompletedGrade = $state(0);
  let qualification = $state("graduacao");
  let relationship = $state("mae");
  let consentAccepted = $state(false);
  let busy = $state(false);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let notice = $state<string | null>(null);
  let pollTimer: ReturnType<typeof setTimeout> | undefined;
  let pollDelay = 2500;
  let pollUntil = 0;
  let pollReads = 0;
  let disposed = false;

  let documentStatus = $derived(documentSection?.analysis_status ?? documentSection?.validation_status);
  let selfieStatus = $derived(candidate?.selfie?.analysis_status ?? candidate?.selfie?.status);
  let documentReady = $derived(Boolean(documentSection?.number && !documentSection?.next_slot && documentStatus === "approved"));
  let proofReady = $derived(candidate?.address_proof?.status === "approved" && !(candidate?.address?.missing_fields?.length) && ["street", "number", "neighborhood", "city", "state", "zipcode"].every(key => Boolean(candidate?.address?.[key as keyof NonNullable<Candidate["address"]>])));
  let gradeOptions = $derived(educationGrades(educationLevel));
  let step = $derived.by(() => {
    if (!candidate) return "loading";
    if (candidate.status === "rejected") return "rejected";
    if (!documentReady) return "documents";
    if (!proofReady) return "address";
    if (["completed", "approved"].includes(candidate.status)) return "review";
    if (["education", "selfie"].includes(candidate.status)) return "selfie";
    if (!candidate.pix_validated && ["documents", "pix"].includes(candidate.status)) return "pix";
    if (candidate.status === "pix" && candidate.pix_validated) return "education";
    return "review";
  });
  let nextSlot = $derived(documentSection?.next_slot ?? `${documentSection?.doc_type ?? documentType}_${documentSide}`);

  function statusLabel(status?: string | null) {
    switch (status) {
      case "approved": return "Aprovado";
      case "pending": return "Em análise";
      case "review": return "Em revisão pelo polo";
      case "rejected": return "Precisa de novo envio";
      case "needs_kinship": return "Informe o vínculo com o titular";
      default: return "Aguardando envio";
    }
  }

  function scheduleRefresh() {
    clearTimeout(pollTimer);
    if (disposed || !candidate || Date.now() >= pollUntil) return;
    const hasDocumentPhoto = documentSection?.front_photo || documentSection?.back_photo || documentSection?.full_photo;
    const analysing = (hasDocumentPhoto && documentStatus === "pending") ||
      (candidate.address_proof?.exists && candidate.address_proof.status === "pending") ||
      (candidate.selfie?.exists && selfieStatus === "pending") || candidate.status === "completed";
    if (analysing) pollTimer = setTimeout(() => {
      pollReads += 1;
      if (document.visibilityState === "visible" && !busy) void refresh();
      else scheduleRefresh();
    }, Math.max(pollDelay, Math.min(15_000, 2500 * (1 + Math.floor(pollReads / 4)))));
  }

  function validateUploadFile(file: File, kind: "document" | "address" | "selfie"): string | null {
    if (!file.size) return "Selecione um arquivo para enviar.";
    if (file.size > 15 * 1024 * 1024) return "O arquivo deve ter no máximo 15 MB.";
    const allowed = kind === "selfie"
      ? ["image/jpeg", "image/png", "image/webp"]
      : ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      return kind === "selfie"
        ? "Envie uma selfie JPG, PNG ou WebP."
        : "Envie JPG, PNG, WebP ou PDF.";
    }
    return null;
  }

  async function refresh() {
    try {
      const identity = await whoami();
      const status = identity.role_statuses?.promoter;
      if (status === "suspended") { window.location.replace("/promoter/suspended/notice"); return; }
      if (status === "active" || status === "training") {
        const promoter = await requestAuth<{ locked: boolean; status: string }>(`${base}/promoter/me`);
        window.location.replace(promoter.locked ? "/promoter/training" : "/promoter/active");
        return;
      }
      const data = await requestAuth<Candidate>(`${base}/candidate/me`);
      let section: DocumentSection | null = null;
      try { section = await requestAuth<DocumentSection>(`${base}/candidate/document`); }
      catch (cause) {
        if (!(cause instanceof ApiError && cause.status === 404 && !data.documents?.rg && !data.documents?.cnh)) throw cause;
      }
      if (disposed) return;
      candidate = data;
      documentSection = section;
      if (section?.doc_type) documentType = section.doc_type;
      if (data.profile?.education_level) educationLevel = data.profile.education_level;
      if (data.profile?.education_completed != null) educationCompleted = (data.profile.education_status ? data.profile.education_status === "completed" : data.profile.education_completed) ? "yes" : "no";
      if (data.profile?.education_qualification) qualification = data.profile.education_qualification;
      if (data.profile?.education_grade != null) educationGrade = data.profile.education_grade;
      if (data.profile?.education_last_completed_grade != null) lastCompletedGrade = data.profile.education_last_completed_grade;
      if (["education", "selfie"].includes(data.status) && !contract) {
        contract = await requestAuth<Contract>(`${base}/contract/current`);
      }
      window.dispatchEvent(new CustomEvent("supletivo:promoter-state", { detail: { status: "candidate" } }));
      error = null;
    } catch (cause) { error = cause instanceof Error && !(cause instanceof ApiError) ? cause.message : getErrorMessage(cause); }
    finally { loading = false; scheduleRefresh(); }
  }

  onMount(() => {
    pollUntil = Date.now() + 120_000;
    void refresh();
    const onFocus = () => { if (!busy) void refresh(); };
    window.addEventListener("focus", onFocus);
    return () => { disposed = true; clearTimeout(pollTimer); window.removeEventListener("focus", onFocus); };
  });

  async function mutate(path: string, json: unknown) {
    busy = true; error = null; notice = null;
    try {
      candidate = await requestAuth<Candidate>(`${base}${path}`, { method: "POST", json });
      await refresh();
    } catch (cause) { error = cause instanceof Error && !(cause instanceof ApiError) ? cause.message : getErrorMessage(cause); }
    finally { busy = false; scheduleRefresh(); }
  }

  async function upload(event: Event, kind: "document" | "address") {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    try { if (file) await sendUpload(file, kind); }
    finally { input.value = ""; }
  }

  async function sendUpload(file: File, kind: "document" | "address" | "selfie") {
    if (!file || busy) return;
    if (kind === "selfie" && (!consentAccepted || !contract)) return;
    busy = true; error = null; notice = null;
    try {
      const localError = validateUploadFile(file, kind);
      if (localError) throw new Error(localError);
      if (kind === "document" || kind === "address") {
        const classification = await requestAuth<{ is_document: boolean | null; is_legible?: boolean | null; doc_type: "rg" | "cnh" | "address_proof" | null }>(`${base}/candidate/documents/classify`, { method: "POST", file, timeoutMs: 30_000 });
        const classificationError = classification.is_document === false
          ? "O arquivo não parece ser um documento. Envie uma foto nítida do documento solicitado."
          : classification.is_legible === false
            ? "A imagem está ilegível. Fotografe com boa iluminação e todas as informações visíveis."
            : null;
        if (classificationError) throw new Error(classificationError);
        if (kind === "document" && classification.doc_type && classification.doc_type !== documentType) {
          const label = classification.doc_type === "address_proof" ? "um comprovante de residência" : classification.doc_type.toUpperCase();
          throw new Error(`O arquivo parece ser ${label}, mas o tipo selecionado é ${documentType.toUpperCase()}.`);
        }
        if (kind === "address" && classification.doc_type && classification.doc_type !== "address_proof") {
          throw new Error("Esse arquivo parece ser um documento de identidade. Envie um comprovante de residência.");
        }
      }
      const path = kind === "document" ? `/candidate/documents/photo/${nextSlot}` :
        kind === "address" ? "/candidate/documents/address-proof" : "/candidate/selfie";
      const result = await requestAuth<Candidate | AnalysisAck>(`${base}${path}`, { method: "POST", file, timeoutMs: 30000 });
      if ("poll_after_ms" in result) pollDelay = Math.max(500, Math.min(result.poll_after_ms || 2500, 30000));
      if ("status" in result) candidate = result;
      notice = "Arquivo recebido. Acompanhe a análise abaixo.";
      pollUntil = Date.now() + 120_000;
      pollReads = 0;
      await refresh();
    } catch (cause) { error = cause instanceof Error && !(cause instanceof ApiError) ? cause.message : getErrorMessage(cause); }
    finally { busy = false; scheduleRefresh(); }
  }

  function updateEducationLevel() {
    educationGrade = 0;
    lastCompletedGrade = 0;
  }

  async function saveEducation() {
    try { await mutate("/candidate/education", candidateEducationPayload(educationLevel, educationCompleted === "yes", educationGrade, lastCompletedGrade, qualification)); }
    catch (cause) { error = cause instanceof Error ? cause.message : getErrorMessage(cause); }
  }
</script>

<div class="candidate-view" data-testid="promoter-candidate">
  <header class="glass-panel candidate-header">
    <p class="eyebrow">Credenciamento</p>
    <h1>Credenciamento de Promotor</h1>
    <p>Envie seus documentos. Os dados de identidade e endereço são extraídos automaticamente.</p>
  </header>
  {#if error}<p class="feedback error" role="alert">{error}</p>{/if}
  {#if notice}<p class="feedback info" role="status">{notice}</p>{/if}
  {#if loading}<p role="status">Consultando seu credenciamento…</p>
  {:else if candidate}
    <section class="candidate-card" aria-label="Seu link de indicação">
      <h2>Você já pode indicar</h2>
      <p>O cadastro de promotor é gratuito. Suas comissões ficam acumuladas até a aprovação do cadastro. Depois da ativação, o saldo entra no próximo fechamento de sexta-feira às 18h.</p>
      <label for="candidate-referral">Seu link de indicação</label>
      <input id="candidate-referral" type="url" value={candidate.ref_url} readonly />
      <PromoterReferralShare url={candidate.ref_url} />
    </section>
    <section class="candidate-card">
      {#if step === "documents"}
        <h2>Documento de identidade</h2>
        <p>{statusLabel(documentStatus)}</p>
        {#if documentSection?.analysis_reason}<p>{documentSection.analysis_reason}</p>{/if}
        {#if !["pending", "review"].includes(documentStatus ?? "") || documentSection?.next_slot}
          {#if !documentSection?.doc_type}
            <label for="candidate-doc-type">Qual documento você vai enviar?</label>
            <select id="candidate-doc-type" bind:value={documentType} disabled={busy}><option value="rg">RG</option><option value="cnh">CNH</option></select>
          {/if}
          {#if !documentSection?.next_slot && !documentSection?.front_photo && !documentSection?.full_photo}
            <label for="candidate-doc-side">Formato do documento</label>
            <select id="candidate-doc-side" bind:value={documentSide} disabled={busy}><option value="front">Foto da frente</option><option value="full">Documento completo / PDF</option></select>
          {/if}
          <p>{nextSlot.endsWith("back") ? "Envie o verso do documento." : nextSlot.endsWith("full") ? "Envie o documento completo. Para CNH digital, use o PDF oficial." : "Envie a frente do documento, com todos os dados legíveis."}</p>
          <label class="upload-action" for="candidate-document">{busy ? "Enviando…" : "Anexar documento"}</label>
          <input id="candidate-document" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={busy} onchange={event => upload(event, "document")} />
          <label class="upload-action" for="candidate-document-camera">Tirar foto do documento</label>
          <input id="candidate-document-camera" type="file" accept="image/*" capture="environment" disabled={busy} onchange={event => upload(event, "document")} />
        {:else}<p>A análise está em andamento. Esta tela acompanha a resposta do polo.</p>{/if}
      {:else if step === "address"}
        <h2>Comprovante de residência</h2>
        <p>{statusLabel(candidate.address_proof?.status)}</p>
        {#if candidate.address_proof?.reason}<p>{candidate.address_proof.reason}</p>{/if}
        {#if candidate.address_proof?.needs_kinship}
          <form onsubmit={event => { event.preventDefault(); void mutate("/candidate/documents/address-proof/kinship", { relation: relationship }); }}>
            <label for="candidate-relationship">Qual seu vínculo com o titular?</label>
            <select id="candidate-relationship" bind:value={relationship} disabled={busy}>
              <option value="mae">Mãe</option><option value="pai">Pai</option><option value="conjuge">Cônjuge</option><option value="filho">Filho(a)</option><option value="irmao">Irmão(ã)</option><option value="outro">Outro vínculo</option>
            </select>
            <button class="btn" disabled={busy} type="submit">Confirmar vínculo</button>
          </form>
        {:else if !candidate.address_proof?.exists || candidate.address_proof?.status === "rejected" || candidate.address_proof?.status === "approved"}
          {#if candidate.address_proof?.status === "approved"}<p>O comprovante foi conferido, mas faltam dados do endereço. Envie uma imagem completa e legível para nova leitura.</p>{/if}
          <p>Envie uma conta de luz, água, gás ou internet. A leitura do comprovante preenche seu endereço.</p>
          <label class="upload-action" for="candidate-address">{busy ? "Enviando…" : "Anexar comprovante"}</label>
          <input id="candidate-address" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={busy} onchange={event => upload(event, "address")} />
          <label class="upload-action" for="candidate-address-camera">Tirar foto da conta</label>
          <input id="candidate-address-camera" type="file" accept="image/*" capture="environment" disabled={busy} onchange={event => upload(event, "address")} />
        {:else}<p>{candidate.address_proof?.status === "pending" ? "A leitura do comprovante está em andamento. Acompanhe o resultado nesta tela." : "O polo está revisando o comprovante enviado."}</p>{/if}
      {:else if step === "pix"}
        <h2>Dados de recebimento de comissões</h2>
        <p>Informe uma chave PIX em seu nome. A titularidade será conferida.</p>
        <form onsubmit={event => { event.preventDefault(); void mutate("/candidate/pix", { key: pixKey.trim(), key_type: pixKeyType }); }}>
          <label for="pixType">Tipo de chave</label>
          <select id="pixType" bind:value={pixKeyType} disabled={busy}><option value="CPF">CPF</option><option value="PHONE">Telefone celular</option><option value="EMAIL">E-mail</option><option value="EVP">Chave aleatória</option></select>
          <label for="pixKey">Chave PIX</label>
          <input id="pixKey" type="text" bind:value={pixKey} required disabled={busy} autocomplete="off" />
          <button class="btn" type="submit" disabled={busy || !pixKey.trim()}>{busy ? "Salvando…" : "Salvar e Continuar"}</button>
        </form>
      {:else if step === "education"}
        <h2>Sua escolaridade</h2>
        <form onsubmit={event => { event.preventDefault(); void saveEducation(); }}>
          <label for="candidate-education">Qual o seu nível de ensino?</label>
          <select id="candidate-education" bind:value={educationLevel} onchange={updateEducationLevel} disabled={busy}><option value="fundamental">Ensino Fundamental</option><option value="medio">Ensino Médio</option><option value="superior">Ensino Superior</option></select>
          {#if educationLevel === "superior"}
            <label for="candidate-qualification">Formação</label>
            <select id="candidate-qualification" bind:value={qualification} disabled={busy}><option value="graduacao">Graduação</option><option value="pos_graduacao">Pós-graduação</option><option value="mestrado">Mestrado</option><option value="doutorado">Doutorado</option></select>
          {:else}
            <label for="candidate-grade">Qual foi a última série ou ano cursado?</label>
            <select id="candidate-grade" bind:value={educationGrade} onchange={() => { lastCompletedGrade = Math.max(0, Math.min(lastCompletedGrade, educationGrade - 1)); }} disabled={busy} required><option value={0} disabled>Selecione a última série cursada</option>{#each gradeOptions as grade}<option value={grade}>{grade}º ano / série</option>{/each}</select>
          {/if}
          <label for="candidate-completed">{educationLevel === "superior" ? "Você concluiu essa formação?" : "Você concluiu essa série ou ano?"}</label>
          <select id="candidate-completed" bind:value={educationCompleted} disabled={busy}><option value="yes">Sim</option><option value="no">Não</option></select>
          {#if educationLevel !== "superior" && educationCompleted === "no"}
            <label for="candidate-last-completed">Qual foi a última série concluída?</label>
            <select id="candidate-last-completed" bind:value={lastCompletedGrade} disabled={busy}><option value={0}>Nenhuma série concluída neste nível</option>{#each gradeOptions.filter(grade => grade < educationGrade) as grade}<option value={grade}>{grade}º ano / série</option>{/each}</select>
          {/if}
          <button class="btn" type="submit" disabled={busy || (educationLevel !== "superior" && !gradeOptions.includes(educationGrade))}>Continuar para assinatura</button>
        </form>
      {:else if step === "selfie"}
        <h2>Termo de adesão e selfie</h2>
        <p>{statusLabel(selfieStatus)}</p>
        {#if candidate.selfie?.analysis_reason}<p>{candidate.selfie.analysis_reason}</p>{/if}
        {#if !candidate.selfie?.exists || selfieStatus === "rejected"}
          {#if contract}
            <div class="contract-text" tabindex="0" aria-label="Termo de adesão vigente">{contract.text}</div>
            <p>Versão {contract.version}</p>
            <label class="consent"><input type="checkbox" bind:checked={consentAccepted} disabled={busy} /> Li e aceito o termo. O envio da selfie registra minha assinatura.</label>
            <LiveSelfieCamera disabled={busy || !consentAccepted} onCapture={file => sendUpload(file, "selfie")} />
          {:else}<p>Não foi possível carregar o termo vigente. Atualize o status para tentar novamente.</p>{/if}
        {:else}<p>Acompanhe a conferência da sua assinatura. Seu cadastro será ativado quando os requisitos forem aprovados.</p>{/if}
      {:else if step === "rejected"}<h2>Credenciamento precisa de revisão</h2><p>Consulte as orientações do polo sobre sua candidatura.</p>
      {:else}<h2>Credenciamento em análise</h2><p>A documentação e sua assinatura estão sendo conferidas. Esta tela acompanha a liberação pelo polo.</p>{/if}
    </section>
    {#if documentReady && documentSection?.number}<section class="candidate-card" aria-label="Dados extraídos do documento"><h2>Identidade conferida</h2><p>{documentType.toUpperCase()} · número {documentSection.number}</p>{#if candidate.profile?.name}<p>{candidate.profile.name}</p>{/if}<p>{statusLabel(documentStatus)}</p></section>{/if}
    {#if candidate.address?.street}
      <section class="candidate-card" aria-label="Endereço extraído"><h2>Endereço extraído do comprovante</h2><p>{candidate.address.street}{candidate.address.number ? `, ${candidate.address.number}` : ""}</p><p>{candidate.address.neighborhood} — {candidate.address.city}/{candidate.address.state}</p>{#if candidate.address.missing_fields?.length}<p>A leitura ainda precisa completar dados do endereço. O polo acompanhará a conferência.</p>{/if}</section>
    {/if}
    {#each candidate.blocks ?? [] as block}{#if block.reason || block.description}<p class="feedback warning">{block.reason ?? block.description}</p>{/if}{/each}
  {/if}
  <button class="refresh-action" type="button" disabled={busy || loading} onclick={() => refresh()}>Atualizar status</button>
</div>

<style>
  .candidate-view { width: min(100%, var(--container-narrow)); margin-inline: auto; display: grid; gap: 1.25rem; color: var(--paper); font-family: var(--font-sans); }
  .candidate-header, .candidate-card { border-radius: var(--radius-lg); padding: clamp(1.25rem, 4vw, 2rem); }
  .candidate-header { background: var(--blue); }
  .candidate-card { display: grid; gap: 1rem; background: var(--ink-soft); border: 1px solid var(--glass-border-dark); }
  h1, h2 { font-family: var(--font-display); line-height: 1.08; }
  h1 { font-size: var(--text-h2-sm); margin-block: .5rem 1rem; }
  h2 { font-size: var(--text-h3); }
  p { line-height: 1.6; }
  .eyebrow { color: var(--yellow); font-weight: 700; }
  form { display: grid; gap: .75rem; }
  input:not([type="checkbox"]):not([type="file"]), select { min-height: var(--input-height); padding: .75rem 1rem; border: var(--input-border); border-radius: var(--input-radius); color: var(--ink); background: var(--paper); font: inherit; width: 100%; }
  .btn, .refresh-action, .upload-action { min-height: var(--input-height); padding: .75rem 1.25rem; cursor: pointer; }
  .refresh-action, .upload-action { border: 1px solid var(--glass-border-dark); border-radius: var(--input-radius); background: var(--ink-soft); color: var(--paper); text-align: center; }
  input[type="file"] { width: 100%; min-height: var(--input-height); }
  button:disabled, input:disabled, select:disabled { opacity: .6; cursor: wait; }
  :focus-visible { outline: 3px solid var(--yellow); outline-offset: 3px; }
  .feedback { padding: 1rem; border-radius: var(--input-radius); }
  .error { background: var(--danger-bg); color: var(--danger); }
  .info { background: var(--info-bg); color: var(--info); }
  .warning { background: var(--warning-bg); color: var(--warning); }
  .contract-text { max-height: 20rem; overflow-y: auto; white-space: pre-wrap; background: var(--paper); color: var(--ink); padding: 1rem; border-radius: var(--input-radius); line-height: 1.6; }
  .consent { display: flex; align-items: start; gap: .75rem; min-height: var(--input-height); }
  .consent input { min-width: 1.25rem; min-height: 1.25rem; margin-top: .25rem; }
</style>
