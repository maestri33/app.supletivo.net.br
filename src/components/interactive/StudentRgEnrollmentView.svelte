<script lang="ts">
  import { onMount } from "svelte";
  import { compressImage } from "@/lib/image-compression";
  import { classifyDocument, getEnrollmentMe, getEnrollmentRg, postEnrollmentRgPhoto, getErrorMessage, type RgSection } from "@/lib/api";
  import { fetchPrivateMedia } from "@/lib/private-media";
  import { enrollmentPath } from "./student/workflow";
  import IdCardIcon from "@/components/icons/IdCardIcon.svelte";
  import CameraIcon from "@/components/icons/CameraIcon.svelte";
  import UploadFileIcon from "@/components/icons/UploadFileIcon.svelte";
  import BankTlsSeal from "@/components/icons/BankTlsSeal.svelte";
  import MecGuillocheSeal from "@/components/icons/MecGuillocheSeal.svelte";

  type StepStatus = "uncompleted" | "under_review" | "approved";
  let selectedDocType = $state<"rg" | "cnh">("rg");
  let status = $state<StepStatus>("uncompleted"), isAnalyzing = $state(false), isUploading = $state(false);
  let triageError = $state<string | null>(null), rgSection = $state<RgSection | null>(null);
  let frontData = $state<string | null>(null), backData = $state<string | null>(null);
  let nextSlot = $state<"front" | "back" | "complete">("front");
  let nextPath = $state("/student/enrollment");
  let active = true;
  const objectUrls = new Map<string, string>();
  function notifyDock(rgStatus: "pending" | "under_review" | "approved" | "rejected") {
    window.dispatchEvent(new CustomEvent("supletivo:student-state", { detail: { rgStatus } }));
  }
  function failure(cause: unknown) { return cause instanceof Error ? cause.message : getErrorMessage(cause); }
  function applyRgResult(section: RgSection) {
    rgSection = section;
    const verdict = section.analysis_status ?? section.validation_status;
    nextSlot = section.next_slot === "rg_back" ? "back" : section.next_slot ? "front" : "complete";
    if (verdict === "approved" && !section.next_slot) { status = "approved"; notifyDock("approved"); }
    else if (verdict === "rejected") { status = "uncompleted"; notifyDock("rejected"); triageError = section.analysis_reason || "Envie uma nova foto nítida do RG."; }
    else if (section.next_slot === "rg_back" && section.photos?.rg_front?.status === "approved") { status = "uncompleted"; notifyDock("under_review"); }
    else if (verdict === "pending" || verdict === "review") { status = "under_review"; notifyDock("under_review"); }
    else { status = "uncompleted"; notifyDock("pending"); }
  }
  async function preview(path: string | null | undefined): Promise<string | null> {
    if (!path) return null;
    if (!objectUrls.has(path)) {
      const blob = await fetchPrivateMedia(path);
      if (!active) return null;
      objectUrls.set(path, URL.createObjectURL(blob));
    }
    return objectUrls.get(path)!;
  }
  async function refresh() {
    triageError = null;
    try {
      const [section, me] = await Promise.all([getEnrollmentRg(), getEnrollmentMe()]);
      if (!active) return;
      applyRgResult(section); nextPath = enrollmentPath(me.status) ?? "/student/enrollment";
      try {
        frontData = await preview(section.front_photo || section.full_photo);
        backData = await preview(section.back_photo || section.full_photo);
      } catch (cause) { triageError = `Documento consultado, mas não foi possível abrir a imagem: ${failure(cause)}`; }
    } catch (cause) { triageError = failure(cause); }
  }
  async function poll() {
    const deadline = Date.now() + 60_000;
    while (active && Date.now() < deadline) {
      const section = await getEnrollmentRg(); if (!active) return;
      applyRgResult(section);
      const verdict = section.analysis_status ?? section.validation_status;
      if (["approved", "rejected", "review"].includes(verdict ?? "") || (section.next_slot === "rg_back" && section.photos?.rg_front?.status === "approved")) return;
      await new Promise(resolve => window.setTimeout(resolve, 2500));
    }
  }
  async function processSelectedFile(file: File) {
    if (isAnalyzing || isUploading) return;
    triageError = null; isAnalyzing = true; let received = false;
    try {
      if (!file.size || file.size > 15 * 1024 * 1024) throw new Error("Envie um arquivo não vazio de até 15 MB.");
      if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) throw new Error("Envie JPG, PNG, WebP ou PDF.");
      let slot: "front" | "back" | "full" = nextSlot === "back" ? "back" : "front";
      const result = await classifyDocument(file);
      if (result.is_document === false || result.is_legible === false) throw new Error("Envie uma foto legível do RG, com as quatro bordas visíveis.");
      if (result.doc_type && result.doc_type !== "rg") throw new Error("Nesta etapa da matrícula, envie seu RG.");
      if (result.completeness === "full") slot = "full";
      let upload = file;
      if (file.type.startsWith("image/")) {
        const compressed = await compressImage(file);
        upload = new File([compressed], file.name, { type: compressed.type || file.type });
      }
      isAnalyzing = false; isUploading = true;
      await postEnrollmentRgPhoto(slot, upload); received = true;
      status = "under_review"; notifyDock("under_review");
      const url = URL.createObjectURL(upload); objectUrls.set(`local:${Date.now()}`, url);
      if (slot === "back") backData = url; else frontData = url;
      if (slot === "full") backData = url;
      await poll();
      if (status === "approved") { const me = await getEnrollmentMe(); nextPath = enrollmentPath(me.status) ?? "/student/enrollment"; }
    } catch (cause) {
      triageError = received ? `Arquivo recebido. A consulta da análise falhou: ${failure(cause)}. Consulte novamente antes de reenviar.` : `Não foi possível enviar o RG: ${failure(cause)}`;
      if (!received) { status = "uncompleted"; notifyDock("pending"); }
    } finally { isAnalyzing = false; isUploading = false; }
  }
  function onFileInputChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement, file = input.files?.[0]; input.value = "";
    if (file) void processSelectedFile(file);
  }
  function resetFront() { frontData = null; nextSlot = "front"; status = "uncompleted"; }
  function resetBack() { backData = null; nextSlot = "back"; status = "uncompleted"; }
  onMount(() => { void refresh(); return () => { active = false; for (const url of objectUrls.values()) URL.revokeObjectURL(url); }; });
</script>

<div class="w-full max-w-2xl mx-auto flex flex-col items-center gap-6">
  <!-- Cabeçalho Institucional de Matrícula -->
  <div class="text-center space-y-2">
    <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">
      <span class="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
      <span>Documentação Obrigatória · Etapa 1 de 4</span>
    </div>

    <h1 class="text-2xl sm:text-4xl font-display tracking-tight text-white">
      Documento de Identidade
    </h1>
    <p class="text-xs sm:text-sm text-white/70 max-w-lg mx-auto leading-relaxed">
      Envie seu RG para conferência dos dados da matrícula.
    </p>
  </div>

  <!-- Card Principal de Upload (Física Zero-G & Glassmorphism) -->
  <div class="payment-card-zero-g w-full p-6 sm:p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
    <p class="text-sm text-white/70">Documento solicitado: RG. Envie frente e verso ou o arquivo completo.</p>

    <!-- Estado de Triagem / Análise da IA -->
    {#if isAnalyzing}
      <div class="p-5 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-200 flex items-center gap-4 animate-in fade-in">
        <div class="relative size-10 flex items-center justify-center shrink-0">
          <span class="absolute inline-flex size-full rounded-full bg-blue-400 opacity-75 animate-ping"></span>
          <span class="relative size-8 rounded-full bg-blue-500 flex items-center justify-center">
            <svg class="size-4 text-white animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
          </span>
        </div>
        <div>
          <strong class="text-white text-xs block font-bold">Triagem Inteligente em Execução</strong>
          <span class="text-[11px] text-blue-200/90 leading-tight block mt-0.5">
            Conferindo o arquivo. A análise dos dados acontece no servidor após o envio.
          </span>
        </div>
      </div>
    {:else if isUploading}
      <div class="p-5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 flex items-center gap-4 animate-in fade-in">
        <div class="size-8 rounded-full border-3 border-amber-400 border-t-transparent animate-spin shrink-0"></div>
        <div>
          <strong class="text-white text-xs block font-bold">Salvando Arquivo na Secretaria</strong>
          <span class="text-[11px] text-amber-200/90 leading-tight block mt-0.5">
            Transmitindo imagem em conexão segura TLS 256-Bit...
          </span>
        </div>
      </div>
    {:else if triageError}
      <div class="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 flex items-start gap-3 text-left">
        <svg class="size-5 text-rose-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div class="text-xs">
          <strong class="text-white font-bold block">Atenção na foto:</strong>
          <p class="text-rose-200/90 mt-0.5 leading-relaxed">{triageError}</p>
        </div>
      </div>
    {/if}

    <!-- Slots de Pré-Visualização dos Lados -->
    <div class="grid grid-cols-1 {selectedDocType === 'rg' ? 'sm:grid-cols-2' : ''} gap-4">
      <!-- Slot 1: Frente -->
      <div class="p-4 rounded-2xl border {frontData ? 'border-emerald-500/50 bg-emerald-950/25' : 'border-white/10 bg-white/[0.02]'} flex flex-col justify-between min-h-[160px] relative overflow-hidden">
        <div>
          <div class="flex items-center justify-between pb-3 border-b border-white/10">
            <span class="text-xs font-bold text-white flex items-center gap-2">
              <IdCardIcon class="size-4 text-emerald-400" />
              <span>{selectedDocType === 'rg' ? '1. Frente do RG' : 'CNH (Frente / Aberta)'}</span>
            </span>
            <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider {frontData ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/60'}">
              {frontData ? '✓ Recebido' : 'Pendente'}
            </span>
          </div>

          {#if frontData}
            <div class="mt-3 relative rounded-xl overflow-hidden border border-white/20 aspect-[16/10] bg-black/60 flex items-center justify-center">
              <img src={frontData} alt="Frente do Documento" class="size-full object-cover" />
            </div>
          {:else}
            <div class="mt-4 flex flex-col items-center justify-center text-center py-4 text-white/50 space-y-1">
              <IdCardIcon class="size-10 text-white/20" />
              <span class="text-xs font-medium">Lado da foto do documento</span>
            </div>
          {/if}
        </div>

        {#if frontData && status !== "approved"}
          <button
            type="button"
            onclick={resetFront}
            class="mt-3 text-[11px] text-white/50 hover:text-white underline text-center cursor-pointer"
          >
            Substituir foto da frente
          </button>
        {/if}
      </div>

      <!-- Slot 2: Verso (Exibido apenas para RG) -->
      {#if selectedDocType === "rg"}
        <div class="p-4 rounded-2xl border {backData ? 'border-emerald-500/50 bg-emerald-950/25' : 'border-white/10 bg-white/[0.02]'} flex flex-col justify-between min-h-[160px] relative overflow-hidden">
          <div>
            <div class="flex items-center justify-between pb-3 border-b border-white/10">
              <span class="text-xs font-bold text-white flex items-center gap-2">
                <IdCardIcon class="size-4 text-emerald-400" />
                <span>2. Verso do RG</span>
              </span>
              <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider {backData ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/60'}">
                {backData ? '✓ Recebido' : 'Pendente'}
              </span>
            </div>

            {#if backData}
              <div class="mt-3 relative rounded-xl overflow-hidden border border-white/20 aspect-[16/10] bg-black/60 flex items-center justify-center">
                <img src={backData} alt="Verso do Documento" class="size-full object-cover" />
              </div>
            {:else}
              <div class="mt-4 flex flex-col items-center justify-center text-center py-4 text-white/50 space-y-1">
                <IdCardIcon class="size-10 text-white/20" />
                <span class="text-xs font-medium">Lado com números e filiação</span>
              </div>
            {/if}
          </div>

          {#if backData && status !== "approved"}
            <button
              type="button"
              onclick={resetBack}
              class="mt-3 text-[11px] text-white/50 hover:text-white underline text-center cursor-pointer"
            >
              Substituir foto do verso
            </button>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Botões de Ação para Captura / Anexo (Ergonomia Mínima 48px) -->
    {#if status === "under_review"}
      <div class="p-6 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-center flex flex-col items-center gap-3" role="status">
        <h3 class="text-lg font-display text-white">Enviado — Em Análise</h3>
        <p class="text-xs text-amber-100/90 max-w-md">O servidor recebeu o documento. A matrícula só avança depois do parecer oficial.</p>
        <button type="button" class="btn min-h-12 px-6" onclick={refresh}>Consultar análise</button>
      </div>
    {:else if status !== "approved"}
      <div class="flex flex-col sm:flex-row gap-3 pt-2">
        <!-- Ação 1: Câmera (Tirar Foto com câmera traseira) -->
        <label class="btn flex-1 min-h-[48px] py-3.5 px-6 rounded-full bg-[var(--yellow)] text-[var(--ink)] font-extrabold text-xs uppercase tracking-wider cursor-pointer shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.985]">
          <CameraIcon class="size-4 text-[var(--ink)]" />
          <span>Tirar Foto Agora</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            class="hidden"
            onchange={onFileInputChange}
          />
        </label>

        <!-- Ação 2: Arquivo / Galeria / PDF -->
        <label class="flex-1 min-h-[48px] py-3.5 px-6 rounded-full border border-white/25 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-[0.985]">
          <UploadFileIcon class="size-4 text-white" />
          <span>Escolher da Galeria / PDF</span>
          <input
            type="file"
            accept="image/*,application/pdf"
            class="hidden"
            onchange={onFileInputChange}
          />
        </label>
      </div>
    {:else}
      <!-- Estado Aprovado / Homologado -->
      <div class="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center flex flex-col items-center gap-3">
        <div class="size-14 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
          <svg class="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div>
          <h3 class="text-lg font-display text-white">Documento aprovado pelo servidor</h3>
          <p class="text-xs text-emerald-200/90 mt-1 max-w-md mx-auto">
            Sua identidade foi verificada e arquivada no prontuário acadêmico. Continue para o comprovante de endereço.
          </p>
        </div>
        <div class="w-full max-w-xs mt-2">
          <a
            href={nextPath}
            class="btn w-full min-h-[48px] py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-[var(--ink)] font-extrabold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
          >
            <span>Próxima Etapa: Comprovante de Endereço →</span>
          </a>
        </div>
      </div>
    {/if}

    {#if rgSection?.number}
      <div class="p-4 rounded-xl border border-white/10 text-sm text-white/80" aria-label="Dados extraídos do RG">
        <h2 class="font-display">Dados do documento</h2>
        <dl><dt>Nome</dt><dd>{rgSection.name || "Não informado"}</dd><dt>Número</dt><dd>{rgSection.number}</dd>
        <dt>Órgão emissor</dt><dd>{rgSection.issuing_agency || "Não informado"}</dd><dt>Filiação</dt><dd>{rgSection.mother_name || "Não informada"}</dd></dl>
      </div>
    {/if}
    <!-- Dicas de Nitidez para o Aluno -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-white/10 text-left">
      <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5">
        <span class="text-sm">☀️</span>
        <div class="text-[11px] text-white/70 leading-tight">
          <strong class="text-white block font-semibold">Boa Iluminação</strong>
          Evite sombras cobrindo seus dados ou foto.
        </div>
      </div>

      <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5">
        <span class="text-sm">🚫</span>
        <div class="text-[11px] text-white/70 leading-tight">
          <strong class="text-white block font-semibold">Sem Reflexo</strong>
          Retire o RG do plástico de proteção antes da foto.
        </div>
      </div>

      <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5">
        <span class="text-sm">📐</span>
        <div class="text-[11px] text-white/70 leading-tight">
          <strong class="text-white block font-semibold">Enquadramento</strong>
          Mantenha as 4 pontas do documento na foto.
        </div>
      </div>
    </div>

    <!-- Rodapé de Segurança e Proteção LGPD -->
    <div class="flex items-center justify-center gap-2 text-[11px] text-[var(--muted-on-dark)] pt-2 border-t border-white/10">
      <BankTlsSeal class="size-4 text-emerald-400" />
      <span>Dados Criptografados e Protegidos conforme a Lei Geral de Proteção de Dados (LGPD)</span>
    </div>
  </div>

  <!-- Botão de Suporte de Contingência -->
  <div class="text-center">
    <a
      href="https://wa.me/5543996648750?text=Ol%C3%A1%2C%20estou%20na%20etapa%20de%20envio%20do%20RG%20do%20Supletivo%20e%20preciso%20de%20ajuda."
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 text-white/70 text-xs hover:text-white transition-all cursor-pointer"
    >
      <svg class="size-3.5 fill-emerald-400" viewBox="0 0 24 24">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2Z"/>
      </svg>
      <span>Dúvidas ao fotografar seu documento? Fale no WhatsApp</span>
    </a>
  </div>
</div>
