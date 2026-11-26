<script lang="ts">
  import { onMount } from "svelte";
  import {
    ApiError,
    getContract,
    getEnrollmentStatus,
    getErrorMessage,
    postEnrollmentSelfie,
    signContract,
    type Contract,
    type EnrollmentStatusResponse,
  } from "@/lib/api";
  import { compressImage } from "@/lib/image-compression";
  import LiveSelfieCamera from "@/components/interactive/LiveSelfieCamera.svelte";
  import { imageError } from "@/components/interactive/student/workflow";
  import { Alert, Badge, Card } from "@/components/ui";

  let loading = $state(true);
  let busy = $state(false);
  let error = $state("");
  let notice = $state("");

  let statusInfo = $state<EnrollmentStatusResponse | null>(null);
  let contract = $state<Contract | null>(null);
  let acceptedContract = $state(false);
  let useFileFallback = $state(false);

  const contractHash = $derived(contract?.hash ?? contract?.sha256_hash ?? "");
  const contractVersion = $derived(contract?.version ?? contract?.contract_version ?? "v1");

  onMount(async () => {
    try {
      const [st, ctr] = await Promise.all([
        getEnrollmentStatus().catch(() => null),
        getContract(),
      ]);
      statusInfo = st;
      contract = ctr;
      if (st?.checklist?.contract_signature?.submitted) {
        acceptedContract = true;
      }
    } catch (err) {
      error = getErrorMessage(err);
    } finally {
      loading = false;
    }
  });

  async function processSelfieAndSign(rawFile: File) {
    if (!acceptedContract) {
      error = "Leia e aceite o contrato de matrícula antes de enviar sua selfie.";
      return;
    }
    if (!contractHash) {
      error = "Hash do contrato indisponível. Recarregue a página e tente novamente.";
      return;
    }

    const fileCheck = imageError(rawFile);
    if (fileCheck) {
      error = fileCheck;
      return;
    }

    busy = true;
    error = "";
    notice = "";

    try {
      const compressed = await compressImage(rawFile, { maxSizeMB: 2 });
      const postCompressErr = imageError(compressed);
      if (postCompressErr) throw new Error(postCompressErr);

      // 1. Contract must be signed before selfie upload
      try {
        await signContract(contractHash);
      } catch (signErr) {
        if (signErr instanceof ApiError && signErr.status === 409 && signErr.code === "CONTRACT_HASH_MISMATCH") {
          contract = await getContract();
          acceptedContract = false;
          error = "O texto do contrato foi atualizado. Leia a versão atual, aceite novamente e envie sua selfie.";
          busy = false;
          return;
        }
        throw signErr;
      }

      // 2. Upload selfie
      await postEnrollmentSelfie(compressed);

      const st = await getEnrollmentStatus().catch(() => null);
      statusInfo = st;
      notice = "Contrato assinado e selfie enviada com sucesso!";
      window.location.href = "/student/enrollment";
    } catch (err) {
      error = getErrorMessage(err);
    } finally {
      busy = false;
    }
  }

  async function handleFileInput(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (file) {
      await processSelfieAndSign(file);
    }
  }
</script>

<section class="mx-auto max-w-2xl px-4 pb-28 pt-6 space-y-5">
  <header class="space-y-2">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <Badge variant="info">Etapas 4 e 5 — Contrato e Selfie</Badge>
      <a href="/student/enrollment" class="text-xs font-bold text-[#002776] underline">
        Voltar ao checklist
      </a>
    </div>
    <h1 class="text-2xl font-extrabold tracking-tight text-[#0b1220]">
      Assinatura do contrato e selfie de verificação
    </h1>
    <p class="text-sm text-slate-600">
      Leia o contrato abaixo, confirme o aceite e tire uma selfie ao vivo para concluir sua documentação inicial.
    </p>
  </header>

  {#if loading}
    <Card class="p-6"><p class="text-sm text-slate-500">Carregando contrato...</p></Card>
  {:else}
    {#if error}
      <Alert variant="error" title="Não foi possível concluir">{error}</Alert>
    {/if}
    {#if notice}
      <Alert variant="success">{notice}</Alert>
    {/if}
    {#if statusInfo?.checklist?.selfie?.rejection_reason}
      <Alert variant="warning" title="Motivo da reprovação da selfie">
        {statusInfo.checklist.selfie.rejection_reason}
      </Alert>
    {/if}

    {#if contract}
      <Card class="p-5 sm:p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-bold text-[#0b1220]">Contrato de Prestação de Serviços Educacionais</h2>
          <Badge variant="default">Versão {contractVersion}</Badge>
        </div>

        <div class="max-h-60 overflow-y-auto rounded-xl border border-black/10 bg-[#f6f6f2] p-4 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">
          {contract.text}
        </div>

        <label class="flex items-start gap-3 rounded-xl border border-[#00734d]/25 bg-[#00734d]/5 p-3.5 text-sm font-semibold text-[#0b1220]">
          <input
            type="checkbox"
            bind:checked={acceptedContract}
            disabled={busy}
            class="mt-0.5 h-4 w-4 accent-[#00734d]"
          />
          <span>Li e aceito os termos do contrato acima (assinatura digital vinculada à minha selfie).</span>
        </label>
      </Card>
    {/if}

    <Card class="p-5 sm:p-6 space-y-4">
      <div class="flex items-center justify-between gap-2">
        <h2 class="text-sm font-bold text-[#0b1220]">Captura da selfie (prova de vida)</h2>
        <button
          type="button"
          onclick={() => { useFileFallback = !useFileFallback; }}
          class="text-xs font-semibold text-[#002776] underline"
        >
          {useFileFallback ? "Usar câmera ao vivo" : "Enviar foto da galeria"}
        </button>
      </div>

      {#if !acceptedContract}
        <p class="rounded-xl border border-[#ffc400]/50 bg-[#ffc400]/10 p-3 text-xs font-semibold text-[#0b1220]">
          Aceite o contrato acima para liberar o envio da selfie.
        </p>
      {/if}

      {#if !useFileFallback}
        <LiveSelfieCamera
          disabled={busy || !acceptedContract}
          onCapture={processSelfieAndSign}
        />
      {:else}
        <label
          class={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl px-5 text-sm font-extrabold transition ${
            busy || !acceptedContract
              ? "bg-slate-200 text-slate-500 cursor-not-allowed"
              : "bg-[#ffc400] text-[#0b1220] hover:brightness-95"
          }`}
        >
          <span>{busy ? "Assinando e enviando selfie..." : "Selecionar foto da selfie"}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="user"
            onchange={handleFileInput}
            disabled={busy || !acceptedContract}
            class="sr-only"
          />
        </label>
      {/if}
    </Card>
  {/if}
</section>
