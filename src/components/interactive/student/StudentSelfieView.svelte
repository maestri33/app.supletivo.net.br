<script lang="ts">
  import { onMount } from "svelte";
  import { getContract, getEnrollmentMe, getErrorMessage, postEnrollmentSelfie, selfieAnalysisStatus, selfieAnalysisReason, type Contract, type EnrollmentMe } from "@/lib/api";
  import { ackPoll } from "@/lib/poll";
  import { expectedStatus, followEnrollmentStatus, imageError } from "./workflow";
  import "./workflow.css";
  let me = $state<EnrollmentMe | null>(null), contract = $state<Contract | null>(null), consent = $state(false);
  let loading = $state(true), busy = $state(false), error = $state(""), active = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const verdict = $derived(me?.selfie ? selfieAnalysisStatus(me.selfie) : me?.selfie_status ?? null);
  const reason = $derived(me?.selfie ? selfieAnalysisReason(me.selfie) : null);
  async function load() {
    loading = true; error = "";
    try {
      const result = await getEnrollmentMe(); if (!active) return; me = result;
      if (followEnrollmentStatus(result.status)) return;
      if (result.status !== "selfie") { error = "A assinatura não está disponível nesta etapa da matrícula."; return; }
      contract = await getContract();
    } catch (cause) { if (active) error = getErrorMessage(cause); } finally { if (active) loading = false; }
  }
  async function poll(ack: EnrollmentMe) {
    const { intervalMs, deadlineMs } = ackPoll(ack);
    const check = async () => {
      if (!active) return;
      try { const result = await getEnrollmentMe(); if (!active) return; me = result; if (followEnrollmentStatus(result.status)) return; if (verdict === "pending" && Date.now() < deadlineMs) timer = setTimeout(check, intervalMs); else busy = false; }
      catch (cause) { if (active) { error = getErrorMessage(cause); busy = false; } }
    }; await check();
  }
  async function upload(event: Event) {
    const input = event.currentTarget as HTMLInputElement, file = input.files?.[0]; input.value = "";
    if (!file || !consent || !contract || busy) return;
    const invalid = imageError(file); if (invalid) { error = invalid; return; }
    busy = true; error = "";
    try { me = await postEnrollmentSelfie(file); if (followEnrollmentStatus(me.status)) return; await poll(me); }
    catch (cause) { error = getErrorMessage(cause); const status = expectedStatus(cause); if (status) followEnrollmentStatus(status); busy = false; }
  }
  onMount(() => { void load(); return () => { active = false; if (timer) clearTimeout(timer); }; });
</script>
<section class="student-workflow" aria-busy={loading || busy}>
  <h1>Selfie e assinatura da matrícula</h1><p class="muted">Leia o contrato e envie uma foto nítida do seu rosto. A foto será usada para confirmar sua identidade e registrar a assinatura.</p>
  {#if loading}<p role="status">Consultando assinatura e contrato…</p>{/if}
  {#if contract}<div class="panel"><h2>Contrato de matrícula</h2><p class="muted">Versão {contract.version}</p><pre tabindex="0" aria-label="Texto do contrato">{contract.text}</pre>
    <label class="consent"><input type="checkbox" bind:checked={consent} disabled={busy} />Li o contrato e autorizo a assinatura com minha selfie</label>
    <label>Enviar selfie<input aria-label="Enviar selfie" type="file" accept="image/jpeg,image/png,image/webp" capture="user" onchange={upload} disabled={!consent || busy || verdict === "approved"} /></label>
  </div>{/if}
  {#if me?.selfie?.exists}<p class:notice={verdict === "pending" || verdict === "review"} class:error={verdict === "rejected"} class:success={verdict === "approved"} role="status">{reason ?? (verdict === "pending" ? "Selfie enviada. A análise está em andamento." : verdict === "approved" ? "Selfie aprovada. Consultando a liberação do polo." : verdict === "review" ? "Selfie recebida para conferência do polo." : "Envie uma nova foto nítida do seu rosto.")}</p>{/if}
  {#if error}<p class="error" role="alert">{error}</p>{/if}
  {#if !loading && (!contract || verdict === "pending" || verdict === "review")}<button type="button" class="secondary" onclick={load} disabled={busy}>Consultar novamente</button>{/if}
</section>
