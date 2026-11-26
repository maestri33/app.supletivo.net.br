<script lang="ts">
  import { onMount } from "svelte";
  import {
    fetchContact,
    getEnrollmentStatus,
    getErrorMessage,
    submitAddressProofKinship,
    uploadEnrollmentAddressProof,
    type AddressProofUploadResponse,
    type EnrollmentStatusResponse,
  } from "@/lib/api";
  import { resolveSupportHref, type InstitutionalContact } from "@/lib/config";
  import { compressImage } from "@/lib/image-compression";
  import RelationshipPicker from "@/components/interactive/RelationshipPicker.svelte";
  import { documentFileError, enrollmentPath } from "@/components/interactive/student/workflow";
  import { Alert, Badge, Card } from "@/components/ui";

  let loading = $state(true);
  let uploading = $state(false);
  let kinshipBusy = $state(false);
  let error = $state("");
  let notice = $state("");

  let statusInfo = $state<EnrollmentStatusResponse | null>(null);
  let contact = $state<InstitutionalContact | null>(null);
  let lastUpload = $state<AddressProofUploadResponse | null>(null);

  let kinshipModalOpen = $state(false);
  let extractedHolder = $state("");

  const supportHref = $derived(resolveSupportHref(contact));

  onMount(async () => {
    try {
      const [st, contactRes] = await Promise.all([
        getEnrollmentStatus().catch(() => null),
        fetchContact().catch(() => null),
      ]);
      statusInfo = st;
      contact = contactRes;
      if (st?.substatus === "needs_kinship") {
        kinshipModalOpen = true;
      }
    } catch (err) {
      error = getErrorMessage(err);
    } finally {
      loading = false;
    }
  });

  async function goToNextStep() {
    const st = await getEnrollmentStatus().catch(() => null);
    if (st) statusInfo = st;
    const nextUrl = enrollmentPath(st?.substatus ?? st?.step) ?? "/student/enrollment/education";
    window.location.href =
      nextUrl === "/student/enrollment/address" || nextUrl === "/student/enrollment/rg"
        ? "/student/enrollment/education"
        : nextUrl;
  }

  async function handleFileSelected(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const rawFile = input.files?.[0];
    input.value = "";
    if (!rawFile) return;

    const validationError = documentFileError(rawFile);
    if (validationError) {
      error = validationError;
      return;
    }

    uploading = true;
    error = "";
    notice = "";

    try {
      const isPdf = rawFile.type === "application/pdf" || rawFile.name.toLowerCase().endsWith(".pdf");
      const fileToSend = isPdf ? rawFile : await compressImage(rawFile, { maxSizeMB: 2 });
      const postCompressError = documentFileError(fileToSend);
      if (postCompressError) throw new Error(postCompressError);

      // Direct upload without prior /documents/classify
      const res = await uploadEnrollmentAddressProof(fileToSend);
      lastUpload = res;

      const holder = res.extracted_data?.residentName ?? res.extracted_data?.resident_name ?? "";
      extractedHolder = typeof holder === "string" ? holder : "";

      if (res.needs_kinship || res.extracted_data?.name_matched === false || res.substatus === "needs_kinship") {
        kinshipModalOpen = true;
        notice = "Comprovante enviado! Informe agora o titular da conta para concluir esta etapa.";
        return;
      }

      notice = "Comprovante recebido! Avançando para escolaridade...";
      await goToNextStep();
    } catch (err) {
      error = getErrorMessage(err);
    } finally {
      uploading = false;
    }
  }

  async function handleKinshipSelect(relation: string, ownerName: string) {
    kinshipBusy = true;
    error = "";
    try {
      await submitAddressProofKinship(relation, ownerName);
      kinshipModalOpen = false;
      notice = "Vínculo confirmado! Avançando para escolaridade...";
      await goToNextStep();
    } catch (err) {
      error = getErrorMessage(err);
    } finally {
      kinshipBusy = false;
    }
  }
</script>

<section class="mx-auto max-w-2xl px-4 pb-28 pt-6 space-y-5">
  <header class="space-y-2">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <Badge variant="info">Documento 2 de 5 — Comprovante de residência</Badge>
      <a href="/student/enrollment" class="text-xs font-bold text-[var(--yellow)] hover:underline">
        Voltar ao checklist
      </a>
    </div>
    <h1 class="text-2xl font-extrabold tracking-tight text-white">
      Comprovante de residência
    </h1>
    <p class="text-sm text-[var(--muted-on-dark)]">
      Envie conta de luz, água, internet ou contrato recente (foto ou PDF de até 10 MB). Se estiver em nome de outra pessoa, pediremos o vínculo.
    </p>
  </header>

  {#if loading}
    <Card class="p-6"><p class="text-sm text-white/75">Carregando etapa...</p></Card>
  {:else}
    {#if error}
      <Alert variant="danger" title="Não foi possível enviar">{error}</Alert>
    {/if}
    {#if notice}
      <Alert variant="success">{notice}</Alert>
    {/if}
    {#if statusInfo?.checklist?.proof_of_residence?.rejection_reason}
      <Alert variant="warning" title="Motivo da reprovação anterior">
        {statusInfo.checklist.proof_of_residence.rejection_reason}
      </Alert>
    {/if}

    <Card class="p-5 sm:p-6 space-y-4">
      <ul class="space-y-1.5 text-sm text-white/85 list-disc pl-5">
        <li>Aceitamos foto nítida ou PDF original com até 10 MB.</li>
        <li>O endereço deve mostrar rua, cidade e CEP legíveis.</li>
      </ul>

      {#if lastUpload?.extracted_data?.street || lastUpload?.extracted_data?.city}
        <div class="rounded-xl border border-white/15 bg-white/5 p-3 text-xs text-white/85 space-y-1">
          <p class="font-bold text-white">Dados identificados:</p>
          <p>
            {[
              lastUpload.extracted_data.street,
              lastUpload.extracted_data.number,
              lastUpload.extracted_data.neighborhood,
              lastUpload.extracted_data.city,
              lastUpload.extracted_data.state,
              lastUpload.extracted_data.cep,
            ]
              .filter(Boolean)
              .join(", ")}
          </p>
        </div>
      {/if}

      <label
        class={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl px-5 text-sm font-extrabold transition ${
          uploading
            ? "bg-white/10 text-white/50 cursor-wait"
            : "bg-[#ffc400] text-[#0b1220] hover:brightness-95"
        }`}
      >
        <span>{uploading ? "Enviando comprovante..." : "Enviar comprovante (Foto ou PDF)"}</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onchange={handleFileSelected}
          disabled={uploading}
          class="sr-only"
        />
      </label>

      {#if statusInfo?.substatus === "needs_kinship" || lastUpload?.needs_kinship}
        <button
          type="button"
          onclick={() => { kinshipModalOpen = true; }}
          class="min-h-11 w-full rounded-xl border border-sky-400/40 bg-sky-500/10 px-4 text-sm font-bold text-sky-200 hover:bg-sky-500/20"
        >
          Informar vínculo com o titular
        </button>
      {/if}

      {#if statusInfo?.checklist?.proof_of_residence?.submitted && statusInfo.substatus !== "needs_kinship"}
        <div class="flex justify-end pt-1">
          <a
            href="/student/enrollment/education"
            class="min-h-11 inline-flex items-center rounded-xl bg-[#00734d] px-5 text-sm font-bold text-white hover:opacity-95"
          >
            Avançar para escolaridade
          </a>
        </div>
      {/if}
    </Card>

    <div class="text-center text-xs text-white/60">
      Sem comprovante no seu nome?
      <a href={supportHref} class="font-semibold text-[var(--yellow)] hover:underline">Falar com atendimento</a>
    </div>
  {/if}

  <RelationshipPicker
    holderName={extractedHolder}
    isOpen={kinshipModalOpen}
    busy={kinshipBusy}
    onSelect={handleKinshipSelect}
    onClose={() => { kinshipModalOpen = false; }}
  />
</section>
