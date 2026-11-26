<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import {
    classifyDocument,
    fetchContact,
    getEnrollmentRg,
    getEnrollmentStatus,
    getErrorMessage,
    postEnrollmentRgPhoto,
    type EnrollmentStatusResponse,
    type RgSection,
    type RgUploadAck,
  } from "@/lib/api";
  import { resolveSupportHref, type InstitutionalContact } from "@/lib/config";
  import { compressImage } from "@/lib/image-compression";
  import { fetchPrivateMedia } from "@/lib/private-media";
  import { classifyRgWithFallback, type RgCaptureSlot } from "@/lib/rg-capture";
  import { enrollmentPath, imageError } from "@/components/interactive/student/workflow";
  import { Alert, Badge, Card } from "@/components/ui";

  let loading = $state(true);
  let uploading = $state(false);
  let error = $state("");
  let notice = $state("");

  let rg = $state<RgSection | null>(null);
  let statusInfo = $state<EnrollmentStatusResponse | null>(null);
  let contact = $state<InstitutionalContact | null>(null);
  let pendingManualFile = $state<File | null>(null);
  let lastAck = $state<RgUploadAck | null>(null);

  let previews = $state<{ front: string | null; back: string | null; full: string | null }>({
    front: null,
    back: null,
    full: null,
  });
  let objectUrls: string[] = [];

  const supportHref = $derived(resolveSupportHref(contact));
  const isRgComplete = $derived(
    Boolean(
      lastAck?.rg_complete ||
        rg?.full_photo ||
        (rg?.front_photo && rg?.back_photo) ||
        statusInfo?.checklist?.rg?.status === "approved",
    ),
  );
  const missingHint = $derived.by(() => {
    if (isRgComplete) return null;
    if (lastAck?.next_slot === "rg_back" || (rg?.front_photo && !rg?.back_photo && !rg?.full_photo)) {
      return "Falta enviar o verso do RG.";
    }
    if (lastAck?.next_slot === "rg_front" || (rg?.back_photo && !rg?.front_photo && !rg?.full_photo)) {
      return "Falta enviar a frente do RG.";
    }
    return "Envie uma foto legível da frente e do verso do seu RG (ou RG/CIN aberto).";
  });

  function clearPreviewUrls() {
    for (const url of objectUrls) {
      URL.revokeObjectURL(url);
    }
    objectUrls = [];
  }

  onDestroy(() => {
    clearPreviewUrls();
  });

  async function loadPreview(path: string | null | undefined): Promise<string | null> {
    if (!path) return null;
    try {
      const blob = await fetchPrivateMedia(path);
      const url = URL.createObjectURL(blob);
      objectUrls.push(url);
      return url;
    } catch {
      return null;
    }
  }

  async function refreshState() {
    const [rgRes, statusRes] = await Promise.all([
      getEnrollmentRg().catch(() => null),
      getEnrollmentStatus().catch(() => null),
    ]);
    rg = rgRes;
    statusInfo = statusRes;

    clearPreviewUrls();
    const [front, back, full] = await Promise.all([
      loadPreview(rgRes?.front_photo),
      loadPreview(rgRes?.back_photo),
      loadPreview(rgRes?.full_photo),
    ]);
    previews = { front, back, full };
  }

  onMount(async () => {
    try {
      const [_, contactRes] = await Promise.all([
        refreshState(),
        fetchContact().catch(() => null),
      ]);
      contact = contactRes;
    } catch (err) {
      error = getErrorMessage(err);
    } finally {
      loading = false;
    }
  });

  async function completeSlotUpload(slot: RgCaptureSlot, file: File) {
    uploading = true;
    error = "";
    try {
      const ack = await postEnrollmentRgPhoto(slot, file);
      lastAck = ack;
      pendingManualFile = null;
      await refreshState();

      if (ack.rg_complete) {
        notice = "RG recebido! Avançando para o comprovante de residência...";
        const st = await getEnrollmentStatus().catch(() => null);
        const nextUrl = enrollmentPath(st?.substatus ?? st?.step) ?? "/student/enrollment/address";
        window.location.href = nextUrl === "/student/enrollment/rg" ? "/student/enrollment/address" : nextUrl;
        return;
      }

      notice =
        ack.next_slot === "rg_back"
          ? "Frente recebida! Agora envie a foto do verso do RG."
          : ack.next_slot === "rg_front"
          ? "Verso recebido! Agora envie a foto da frente do RG."
          : "Foto recebida!";
    } catch (err) {
      error = getErrorMessage(err);
    } finally {
      uploading = false;
    }
  }

  async function handleFileSelected(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const rawFile = input.files?.[0];
    input.value = "";
    if (!rawFile) return;

    const validationError = imageError(rawFile);
    if (validationError) {
      error = validationError;
      return;
    }

    uploading = true;
    error = "";
    notice = "";
    pendingManualFile = null;

    try {
      const compressed = await compressImage(rawFile, { maxSizeMB: 2 });
      const postCompressError = imageError(compressed);
      if (postCompressError) {
        throw new Error(postCompressError);
      }

      const classified = await classifyDocument(compressed);
      const outcome = classifyRgWithFallback(classified);

      if (outcome.kind === "manual_side_required") {
        pendingManualFile = compressed;
        uploading = false;
        return;
      }

      await completeSlotUpload(outcome.slot, compressed);
    } catch (err) {
      error = getErrorMessage(err);
      uploading = false;
    }
  }
</script>

<section class="mx-auto max-w-2xl px-4 pb-28 pt-6 space-y-5">
  <header class="space-y-2">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <Badge variant="info">Documento 1 de 5 — RG / CIN</Badge>
      <a href="/student/enrollment" class="text-xs font-bold text-[#002776] underline">
        Voltar ao checklist
      </a>
    </div>
    <h1 class="text-2xl font-extrabold tracking-tight text-[#0b1220]">Envio do RG ou CIN</h1>
    <p class="text-sm text-slate-600">
      Fotografe seu RG em local iluminado com as quatro bordas visíveis. Aceitamos JPG, PNG ou WebP de até 10 MB.
    </p>
  </header>

  {#if loading}
    <Card class="p-6"><p class="text-sm text-slate-500">Carregando dados do documento...</p></Card>
  {:else}
    {#if error}
      <Alert variant="error" title="Ajuste necessário">{error}</Alert>
    {/if}
    {#if notice}
      <Alert variant="success">{notice}</Alert>
    {/if}
    {#if statusInfo?.checklist?.rg?.rejection_reason}
      <Alert variant="warning" title="Motivo da reprovação anterior">
        {statusInfo.checklist.rg.rejection_reason}
      </Alert>
    {/if}

    <Card class="p-5 sm:p-6 space-y-4">
      {#if missingHint}
        <p class="rounded-xl border border-[#ffc400]/50 bg-[#ffc400]/10 px-3.5 py-2.5 text-sm font-semibold text-[#0b1220]">
          {missingHint}
        </p>
      {/if}

      <div class="grid gap-3 sm:grid-cols-3">
        <div class="rounded-xl border border-black/10 bg-[#f6f6f2] p-3 text-center">
          <p class="text-xs font-bold text-slate-600 mb-2">Frente</p>
          {#if previews.front}
            <img src={previews.front} alt="Frente do RG" class="mx-auto h-28 w-full rounded-lg object-cover" />
            <Badge variant="success" class="mt-2">Enviada</Badge>
          {:else if previews.full}
            <Badge variant="success">Coberta (RG aberto)</Badge>
          {:else}
            <p class="text-xs text-slate-400 py-6">Aguardando foto</p>
          {/if}
        </div>

        <div class="rounded-xl border border-black/10 bg-[#f6f6f2] p-3 text-center">
          <p class="text-xs font-bold text-slate-600 mb-2">Verso</p>
          {#if previews.back}
            <img src={previews.back} alt="Verso do RG" class="mx-auto h-28 w-full rounded-lg object-cover" />
            <Badge variant="success" class="mt-2">Enviado</Badge>
          {:else if previews.full}
            <Badge variant="success">Coberto (RG aberto)</Badge>
          {:else}
            <p class="text-xs text-slate-400 py-6">Aguardando foto</p>
          {/if}
        </div>

        <div class="rounded-xl border border-black/10 bg-[#f6f6f2] p-3 text-center">
          <p class="text-xs font-bold text-slate-600 mb-2">RG Aberto</p>
          {#if previews.full}
            <img src={previews.full} alt="RG completo" class="mx-auto h-28 w-full rounded-lg object-cover" />
            <Badge variant="success" class="mt-2">Enviado</Badge>
          {:else}
            <p class="text-xs text-slate-400 py-6">Opcional (frente e verso juntos)</p>
          {/if}
        </div>
      </div>

      {#if pendingManualFile}
        <div class="rounded-2xl border border-[#002776]/25 bg-[#002776]/5 p-4 space-y-3">
          <p class="text-sm font-bold text-[#0b1220]">
            Identificamos seu RG! Confirme com 1 toque qual lado está nessa foto:
          </p>
          <div class="grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              onclick={() => pendingManualFile && completeSlotUpload("front", pendingManualFile)}
              disabled={uploading}
              class="min-h-11 rounded-xl bg-[#002776] px-3 text-xs font-bold text-white hover:opacity-95 disabled:opacity-50"
            >
              É a Frente do RG
            </button>
            <button
              type="button"
              onclick={() => pendingManualFile && completeSlotUpload("back", pendingManualFile)}
              disabled={uploading}
              class="min-h-11 rounded-xl bg-[#002776] px-3 text-xs font-bold text-white hover:opacity-95 disabled:opacity-50"
            >
              É o Verso do RG
            </button>
            <button
              type="button"
              onclick={() => pendingManualFile && completeSlotUpload("full", pendingManualFile)}
              disabled={uploading}
              class="min-h-11 rounded-xl bg-[#00734d] px-3 text-xs font-bold text-white hover:opacity-95 disabled:opacity-50"
            >
              RG Aberto (ambos)
            </button>
          </div>
        </div>
      {/if}

      <label
        class={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl px-5 text-sm font-extrabold transition ${
          uploading
            ? "bg-slate-200 text-slate-500 cursor-wait"
            : "bg-[#ffc400] text-[#0b1220] hover:brightness-95"
        }`}
      >
        <span>{uploading ? "Analisando e enviando foto..." : "Selecionar ou fotografar RG"}</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          onchange={handleFileSelected}
          disabled={uploading}
          class="sr-only"
        />
      </label>

      {#if isRgComplete}
        <div class="flex justify-end pt-2">
          <a
            href="/student/enrollment/address"
            class="min-h-11 inline-flex items-center rounded-xl bg-[#00734d] px-5 text-sm font-bold text-white hover:opacity-95"
          >
            Avançar para comprovante de endereço
          </a>
        </div>
      {/if}
    </Card>

    <div class="text-center text-xs text-slate-500">
      Precisa de ajuda com o documento?
      <a href={supportHref} class="font-semibold text-[#002776] underline">Falar com atendimento</a>
    </div>
  {/if}
</section>
