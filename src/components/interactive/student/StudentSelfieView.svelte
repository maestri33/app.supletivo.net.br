<script lang="ts">
  import { onMount } from "svelte";
  import { getContract, getEnrollmentMe, getErrorMessage, postEnrollmentSelfie, selfieAnalysisStatus, selfieAnalysisReason, type Contract, type EnrollmentMe } from "@/lib/api";
  import { ackPoll } from "@/lib/poll";
  import { expectedStatus, followEnrollmentStatus, imageError } from "./workflow";
  import LiveSelfieCamera from "../LiveSelfieCamera.svelte";
  import Alert from "@/components/ui/Alert.svelte";
  import Card from "@/components/ui/Card.svelte";
  import Skeleton from "@/components/ui/Skeleton.svelte";

  let me = $state<EnrollmentMe | null>(null), contract = $state<Contract | null>(null), consent = $state(false);
  let loading = $state(true), busy = $state(false), error = $state(""), active = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let analysisSlow = $state(false);
  const verdict = $derived(me?.selfie ? selfieAnalysisStatus(me.selfie) : me?.selfie_status ?? null);
  const reason = $derived(me?.selfie ? selfieAnalysisReason(me.selfie) : null);

  async function load() {
    if (timer) clearTimeout(timer);
    loading = true; error = ""; analysisSlow = false;
    try {
      const result = await getEnrollmentMe(); if (!active) return; me = result;
      if (followEnrollmentStatus(result.status)) return;
      if (result.status !== "selfie") { error = "A assinatura não está disponível nesta etapa da matrícula."; return; }
      contract = await getContract();
      if (result.selfie?.exists && selfieAnalysisStatus(result.selfie) === "pending") {
        busy = true; void poll(result);
      }
    } catch (cause) { if (active) error = getErrorMessage(cause); } finally { if (active) loading = false; }
  }

  async function poll(ack: EnrollmentMe) {
    const { intervalMs, deadlineMs } = ackPoll(ack);
    const check = async () => {
      if (!active) return;
      try {
        const result = await getEnrollmentMe(); if (!active) return; me = result;
        if (followEnrollmentStatus(result.status)) return;
        const pending = result.selfie ? selfieAnalysisStatus(result.selfie) === "pending" : result.selfie_status === "pending";
        if (pending && Date.now() < deadlineMs) timer = setTimeout(check, intervalMs);
        else { busy = false; analysisSlow = pending; }
      }
      catch (cause) { if (active) { error = getErrorMessage(cause); busy = false; } }
    }; await check();
  }

  async function upload(file: File) {
    if (!file || !consent || !contract || busy) return;
    const invalid = imageError(file); if (invalid) { error = invalid; return; }
    busy = true; error = ""; analysisSlow = false;
    try { me = await postEnrollmentSelfie(file); if (followEnrollmentStatus(me.status)) return; await poll(me); }
    catch (cause) { error = getErrorMessage(cause); const status = expectedStatus(cause); if (status) followEnrollmentStatus(status); busy = false; }
  }

  onMount(() => { void load(); return () => { active = false; if (timer) clearTimeout(timer); }; });
</script>

<section class="w-full max-w-2xl mx-auto p-4 sm:p-6 space-y-6 text-white" aria-busy={loading || busy}>
  <div class="space-y-2">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--green)]/15 border border-[var(--green)]/30 text-xs font-semibold text-emerald-300">
      <span class="size-2 rounded-full bg-[var(--green)] animate-pulse"></span>
      Assinatura Digital
    </div>
    <h1 class="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
      Selfie e assinatura da matrícula
    </h1>
    <p class="text-xs sm:text-sm text-white/70">
      Leia o contrato e tire uma foto nítida do seu rosto pela câmera. A foto será usada para confirmar sua identidade e registrar a assinatura.
    </p>
  </div>

  {#if loading}
    <div class="space-y-4">
      <Skeleton class="h-12 w-full rounded-2xl" />
      <Skeleton class="h-48 w-full rounded-3xl" />
    </div>
  {/if}

  {#if contract}
    <Card
      title="Contrato de Matrícula"
      description={`Termos de adesão e prestação de serviços educacionais • Versão ${contract.version}`}
      class="border-white/15 bg-white/5 backdrop-blur-2xl space-y-4"
    >
      <div class="max-h-60 overflow-y-auto p-4 rounded-xl bg-black/40 border border-white/10 text-xs text-white/80 leading-relaxed font-sans select-text">
        <pre tabindex="0" aria-label="Texto do contrato" class="whitespace-pre-wrap font-sans">{contract.text}</pre>
      </div>

      {#if !me?.selfie?.exists || verdict === "rejected"}
        <label class="flex items-center gap-3 p-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition cursor-pointer min-h-[48px]">
          <input
            type="checkbox"
            bind:checked={consent}
            disabled={busy}
            class="size-5 rounded accent-[var(--yellow)] cursor-pointer"
          />
          <span class="text-xs sm:text-sm font-semibold text-white/90">
            Li o contrato e autorizo a assinatura com minha selfie
          </span>
        </label>

        <div class="pt-2">
          <LiveSelfieCamera disabled={!consent || busy} onCapture={upload} />
        </div>
      {/if}
    </Card>
  {/if}

  {#if me?.selfie?.exists}
    <Alert
      variant={verdict === "approved" ? "success" : verdict === "rejected" ? "danger" : "info"}
      title={verdict === "approved" ? "Selfie aprovada" : verdict === "rejected" ? "Envie uma nova foto" : "Selfie recebida"}
      description={verdict === "review" ? "Sua selfie foi recebida e precisa de conferência do polo. Você não precisa enviar outra foto agora." : reason ?? (verdict === "pending" ? "Selfie enviada. A análise está em andamento." : verdict === "approved" ? "Selfie aprovada. Consultando a liberação do polo." : "Envie uma nova foto nítida do seu rosto.")}
    />
  {/if}

  {#if error}
    <Alert variant="danger" title="Atenção" description={error} />
  {/if}

  {#if analysisSlow}
    <Alert variant="warning" title="Análise em processamento" description="A análise está demorando mais que o esperado. Sua selfie já foi recebida; consulte novamente para acompanhar o resultado." />
  {/if}

  {#if !loading && (!contract || verdict === "pending" || verdict === "review")}
    <button
      type="button"
      onclick={load}
      disabled={busy}
      class="min-h-[48px] px-6 py-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition cursor-pointer"
    >
      Consultar novamente
    </button>
  {/if}
</section>
