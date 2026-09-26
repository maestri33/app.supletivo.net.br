<script lang="ts">
  import { onMount } from "svelte";
  import { compressImage } from "@/lib/image-compression";
  import { getSession } from "@/lib/session";
  import { whoami } from "@/lib/api";
  import IdentityDocumentVerifier from "./IdentityDocumentVerifier.svelte";
  import AddressProofVerifier from "./AddressProofVerifier.svelte";

  interface DocItem {
    id: string;
    title: string;
    status: "approved" | "pending" | "under_review" | "rejected";
    rejectionReason?: string;
  }

  let studentName = $state("Aluno");

  let docs = $state<DocItem[]>([
    { id: "birth_certificate", title: "Certidão de Nascimento/Casamento", status: "pending" },
    { id: "transcript", title: "Histórico Escolar Anterior", status: "pending" },
    { id: "military", title: "Certificado de Reservista (Opcional)", status: "pending" },
  ]);

  let bloodType = $state<string | null>(null);
  let uploadModalDoc = $state<DocItem | null>(null);
  let isUploading = $state(false);
  let toastMsg = $state<string | null>(null);

  const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

  let pendingCount = $derived(docs.filter((d) => d.status === "pending" || d.status === "rejected").length);
  let underReviewCount = $derived(docs.filter((d) => d.status === "under_review").length);

  function openUpload(doc: DocItem) {
    uploadModalDoc = doc;
  }

  async function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0 || !uploadModalDoc) return;

    isUploading = true;
    const rawFile = input.files[0];
    await compressImage(rawFile);
    setTimeout(() => {
      isUploading = false;
      const targetId = uploadModalDoc?.id;
      docs = docs.map((d) => (d.id === targetId ? { ...d, status: "under_review" } : d));
      uploadModalDoc = null;
      showToast("Documento enviado para análise da secretaria!");
    }, 800);
  }

  function selectBloodType(type: string) {
    bloodType = type;
    showToast(`Tipo sanguíneo ${type} registrado com sucesso.`);
  }

  function showToast(msg: string) {
    toastMsg = msg;
    setTimeout(() => {
      toastMsg = null;
    }, 4000);
  }

  onMount(async () => {
    try {
      const session = getSession();
      if (session?.name) {
        studentName = session.name;
      } else {
        const who = await whoami();
        if (who?.name) studentName = who.name;
      }
    } catch {}

    // Polling silencioso simulado a cada 8s
    const timer = setInterval(() => {
      // Simulação: se houver docs em revisão, aprova gradualmente
    }, 8000);

    return () => clearInterval(timer);
  });
</script>

<main id="conteudo" class="flex flex-1 flex-col px-4 py-6 sm:px-6">
  <div class="mx-auto w-full max-w-2xl flex flex-col gap-6">
    <!-- Toast Notification -->
    {#if toastMsg}
      <div class="fixed top-16 right-4 z-50 rounded-xl border border-emerald-500/40 bg-emerald-950/90 px-4 py-3 text-xs font-bold text-emerald-200 shadow-2xl backdrop-blur-md">
        {toastMsg}
      </div>
    {/if}

    <!-- Modal de Upload -->
    {#if uploadModalDoc}
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div class="w-full max-w-sm rounded-2xl border border-white/10 bg-brand-surface p-6 shadow-2xl">
          <h3 class="text-base font-bold text-white mb-1">Enviar {uploadModalDoc.title}</h3>
          <p class="text-xs text-white/75 mb-5">Selecione uma foto nítida ou documento PDF.</p>

          <label class="flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/25 bg-black/30 p-4 text-center hover:border-brand-green">
            {#if isUploading}
              <div class="size-8 animate-spin rounded-full border-2 border-brand-green border-t-transparent mb-2"></div>
              <span class="text-xs text-brand-green font-bold">Enviando arquivo…</span>
            {:else}
              <span class="text-xs font-bold text-white">Toque para selecionar o arquivo</span>
              <span class="text-[10px] text-white/50 mt-1">PDF, JPG ou PNG de até 10MB</span>
            {/if}
            <input type="file" accept="image/*,application/pdf" class="hidden" onchange={handleFileSelect} />
          </label>

          <button
            onclick={() => { uploadModalDoc = null; }}
            class="mt-4 w-full rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-bold text-white hover:bg-white/10"
          >
            Cancelar
          </button>
        </div>
      </div>
    {/if}

    <!-- Header do Aluno -->
    <div class="flex flex-col gap-1">
      <div class="flex items-center gap-2">
        <span class="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-400 uppercase tracking-wide">
          Matrícula Ativa
        </span>
        <span class="text-xs text-white/50">ID: #4881-2026</span>
      </div>
      <h1 class="text-2xl font-extrabold text-white">Prontuário Acadêmico</h1>
      <p class="text-xs text-white/70">
        Gerenciamento de pendências documentais e emissão de declaração para o MEC.
      </p>
    </div>

    <!-- Status Overview -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div class="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <span class="text-[11px] font-semibold text-white/60">Pendências</span>
        <p class="mt-1 text-2xl font-black text-white">{pendingCount}</p>
      </div>
      <div class="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <span class="text-[11px] font-semibold text-white/60">Em Análise</span>
        <p class="mt-1 text-2xl font-black text-amber-300">{underReviewCount}</p>
      </div>
      <div class="col-span-2 sm:col-span-1 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <span class="text-[11px] font-semibold text-white/60">Acesso a Provas</span>
        <p class="mt-1 text-xs font-bold text-emerald-400">
          <a href="/provas" class="underline hover:text-emerald-300">Ir para agendamento →</a>
        </p>
      </div>
    </div>

    <!-- Lista de Documentos Principais (Zero-Friction / IA Front) -->
    <div class="flex flex-col gap-4">
      <h2 class="text-sm font-bold text-white">Documentos Primários (Validação por IA)</h2>
      
      <!-- Componente de Verificação de Documento RG/CNH (Issue #6) -->
      <IdentityDocumentVerifier canReceiveCnh={true} />

      <!-- Componente Zero-Form de Residência (Issue #7) -->
      <AddressProofVerifier studentName={studentName} />
    </div>

    <!-- Outros Documentos Obrigatórios -->
    <div class="flex flex-col gap-3">
      <h2 class="text-sm font-bold text-white">Documentos Complementares</h2>

      <div class="flex flex-col gap-2">
        {#each docs as doc (doc.id)}
          <div class="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition hover:border-white/20">
            <div class="flex flex-col gap-1 pr-3">
              <span class="text-xs font-bold text-white">{doc.title}</span>
              <div class="flex items-center gap-1.5">
                {#if doc.status === "approved"}
                  <span class="size-2 rounded-full bg-emerald-400"></span>
                  <span class="text-[11px] font-semibold text-emerald-400">Aprovado pela Secretaria</span>
                {:else if doc.status === "under_review"}
                  <span class="size-2 rounded-full bg-amber-400"></span>
                  <span class="text-[11px] font-semibold text-amber-300">Em Análise Técnica</span>
                {:else if doc.status === "rejected"}
                  <span class="size-2 rounded-full bg-red-400"></span>
                  <span class="text-[11px] font-semibold text-red-300">Recusado: {doc.rejectionReason ?? "Documento ilegível"}</span>
                {:else}
                  <span class="size-2 rounded-full bg-white/30"></span>
                  <span class="text-[11px] font-semibold text-white/60">Pendente de Envio</span>
                {/if}
              </div>
            </div>

            {#if doc.status !== "approved"}
              <button
                onclick={() => openUpload(doc)}
                class="shrink-0 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-brand-green hover:text-white"
              >
                {doc.status === "under_review" ? "Reenviar" : "Enviar"}
              </button>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <!-- Tipo Sanguíneo -->
    <div class="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-sm font-bold text-white">Tipo Sanguíneo (Exigência MEC)</h2>
          <p class="text-[11px] text-white/70">Obrigatório para emissão do diploma nacional.</p>
        </div>
        {#if bloodType}
          <span class="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-black text-emerald-400 border border-emerald-500/30">
            {bloodType}
          </span>
        {/if}
      </div>

      <div class="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {#each BLOOD_TYPES as type (type)}
          <button
            type="button"
            onclick={() => selectBloodType(type)}
            class="rounded-xl border py-2.5 text-xs font-black transition {bloodType === type ? 'border-brand-green bg-brand-green text-white shadow' : 'border-white/10 bg-black/30 text-white/70 hover:border-white/25'}"
          >
            {type}
          </button>
        {/each}
      </div>
    </div>
  </div>
</main>
