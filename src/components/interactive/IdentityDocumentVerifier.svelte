<script lang="ts">
  import { onMount } from "svelte";
  import { compressImage } from "@/lib/image-compression";

  interface Props {
    canReceiveCnh?: boolean;
    initialStatus?: "uncompleted" | "under_review" | "approved";
    onComplete?: (result: { type: "rg" | "cnh"; front: string; back?: string }) => void;
    onStatusChange?: (status: "uncompleted" | "under_review" | "approved") => void;
  }

  let {
    canReceiveCnh = false,
    initialStatus = "uncompleted",
    onComplete,
    onStatusChange,
  }: Props = $props();

  // Estados principais
  let status = $state<"uncompleted" | "under_review" | "approved">(initialStatus);
  let selectedDocType = $state<"rg" | "cnh">("rg");
  let isSheetOpen = $state(false);
  let isAnalyzing = $state(false);
  let isUploading = $state(false);
  let triageError = $state<string | null>(null);
  let mounted = $state(false);

  onMount(() => {
    mounted = true;
  });

  // Armazenamento local dos arquivos
  let frontData = $state<string | null>(null);
  let backData = $state<string | null>(null);

  // Próximo slot esperado
  let nextSlot = $derived<"front" | "back" | "complete">(
    !frontData ? "front" : !backData ? "back" : "complete"
  );

  // Label do botão principal conforme estado
  let statusBadge = $derived.by(() => {
    if (status === "approved") {
      return {
        label: "Documento Aprovado",
        colorClass: "glass-panel border-white/25 text-white bg-white/10 hover:bg-white/15",
        dotClass: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]",
        icon: "check",
      };
    }
    if (status === "under_review") {
      return {
        label: "Enviado — Em Análise",
        colorClass: "bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25",
        dotClass: "bg-amber-400 animate-pulse",
        icon: "clock",
      };
    }
    // uncompleted
    const detail = nextSlot === "back" ? "Falta o Verso" : "Não Enviado";
    return {
      label: `Identidade: ${detail}`,
      colorClass: "bg-red-500/15 border-red-500/40 text-red-300 hover:bg-red-500/25",
      dotClass: "bg-red-500 animate-ping",
      icon: "alert",
    };
  });

  function openSheet() {
    triageError = null;
    isSheetOpen = true;
  }

  function closeSheet() {
    isSheetOpen = false;
    triageError = null;
  }

  /**
   * IA de Front-End (Triagem rápida < 500ms):
   * 1. É documento?
   * 2. Está legível?
   * 3. Classificação de lado / PDF CNH oficial
   */
  async function simulateAiTriage(file: File): Promise<{
    valid: boolean;
    isDocument: boolean;
    isLegible: boolean;
    side: "front" | "back" | "full";
    errorMessage?: string;
  }> {
    // Simula tempo de inferência rápida
    await new Promise((r) => setTimeout(r, 450));

    // Regra CNH PDF oficial
    if (selectedDocType === "cnh" && file.type === "application/pdf") {
      const lower = file.name.toLowerCase();
      // Simulação de rejeição: se o nome contiver explicitamente 'scan' E 'foto', ou 'cnh_scan'
      if ((lower.includes("scan") && lower.includes("foto")) || lower.includes("cnh_scan")) {
        return {
          valid: false,
          isDocument: true,
          isLegible: false,
          side: "full",
          errorMessage:
            "Para CNH em PDF, envie apenas o arquivo oficial exportado do aplicativo Carteira Digital de Trânsito (Gov.br). Se for foto impressa, selecione o formato de imagem.",
        };
      }
      return { valid: true, isDocument: true, isLegible: true, side: "full" };
    }

    // Simulação determinística por nome para testes ou padrão frente/verso
    const lowerName = file.name.toLowerCase();
    if (lowerName.includes("not_doc") || lowerName.includes("paisagem")) {
      return {
        valid: false,
        isDocument: false,
        isLegible: false,
        side: "front",
        errorMessage: "Isso não parece um documento de identidade (RG ou CNH). Envie o documento correto.",
      };
    }

    if (lowerName.includes("invalid") || lowerName.includes("blur") || lowerName.includes("embaçado")) {
      return {
        valid: false,
        isDocument: true,
        isLegible: false,
        side: "front",
        errorMessage: "A imagem ficou embaçada ou com reflexo. Aproxime a câmera e garanta boa iluminação.",
      };
    }

    // Validação mínima de arquivo de documento
    if (file.size < 50) {
      return {
        valid: false,
        isDocument: false,
        isLegible: false,
        side: "front",
        errorMessage: "Ops, não identificamos um documento válido. Envie uma foto nítida do documento.",
      };
    }

    if (lowerName.includes("back") || lowerName.includes("verso") || nextSlot === "back") {
      return { valid: true, isDocument: true, isLegible: true, side: "back" };
    }

    return { valid: true, isDocument: true, isLegible: true, side: "front" };
  }

  async function processSelectedFile(file: File) {
    isAnalyzing = true;
    triageError = null;

    try {
      const triage = await simulateAiTriage(file);

      if (!triage.valid) {
        triageError = triage.errorMessage || "Não foi possível validar o documento. Tente novamente.";
        return;
      }

      // Converte imagem / PDF para preview em base64
      let processedData = "";
      if (file.type.startsWith("image/")) {
        const compressed = await compressImage(file);
        processedData = await fileToBase64(compressed);
      } else {
        processedData = await fileToBase64(file);
      }

      if (triage.side === "full") {
        frontData = processedData;
        backData = processedData;
      } else if (triage.side === "back" || (nextSlot === "back" && triage.side !== "front")) {
        backData = processedData;
      } else {
        frontData = processedData;
      }

      // Checa se completou frente + verso (ou PDF completo)
      if (frontData && (backData || triage.side === "full")) {
        // Envio assíncrono ao backend
        isUploading = true;
        await sendToBackend({
          type: selectedDocType,
          front: frontData,
          back: backData ?? frontData,
        });
        isUploading = false;
        status = "under_review";
        onStatusChange?.("under_review");
        closeSheet();
        onComplete?.({
          type: selectedDocType,
          front: frontData,
          back: backData ?? undefined,
        });

        // Simula aprovação gradual assíncrona após análise backend
        setTimeout(() => {
          status = "approved";
          onStatusChange?.("approved");
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("supletivo:identity-verified", {
                detail: { type: selectedDocType },
              })
            );
          }
        }, 1800);
      } else {
        // Falta o outro lado
        triageError = null;
      }
    } catch (e: any) {
      triageError = e?.message || "Erro ao processar o arquivo. Tente novamente.";
    } finally {
      isAnalyzing = false;
    }
  }

  function fileToBase64(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function sendToBackend(payload: { type: string; front: string; back: string }) {
    // Simula dispatch assíncrono para o endpoint de documentos
    await new Promise((r) => setTimeout(r, 600));
    return { success: true, tracking_id: "doc-" + Date.now() };
  }

  function onFileInputChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      processSelectedFile(input.files[0]);
    }
  }
</script>

<!-- Botão de Status Conectado (3 Estados) -->
<div class="flex flex-col gap-2 w-full">
  <button
    type="button"
    onclick={openSheet}
    data-testid="doc-verifier-status-btn"
    data-hydrated={mounted}
    class="flex items-center justify-between w-full p-4 rounded-2xl border transition-all duration-300 backdrop-blur-xl shadow-md group {statusBadge.colorClass}"
  >
    <div class="flex items-center gap-3">
      <span class="relative flex size-3">
        <span class="size-3 rounded-full {statusBadge.dotClass}"></span>
      </span>
      <div class="flex flex-col text-left">
        <span class="text-xs font-bold uppercase tracking-wider opacity-75">Documento de Identidade</span>
        <span class="text-sm font-black text-white">{statusBadge.label}</span>
      </div>
    </div>

    <div class="flex items-center gap-2">
      {#if status === "approved"}
        <span class="text-xs font-bold text-emerald-400 flex items-center gap-1">
          ✓ Homologado
        </span>
      {:else}
        <span class="text-xs font-semibold underline underline-offset-4 opacity-80 group-hover:opacity-100">
          {status === "under_review" ? "Acompanhar" : "Anexar agora →"}
        </span>
      {/if}
    </div>
  </button>

  <!-- Bottom Sheet / Modal de Anexo Minimalista -->
  {#if isSheetOpen}
    <div
      role="dialog"
      aria-modal="true"
      data-testid="doc-verifier-modal"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 transition-opacity"
    >
      <div class="w-full max-w-md bg-brand-surface sm:rounded-3xl rounded-t-3xl border border-white/15 p-6 shadow-2xl flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-6">
        
        <!-- Header Minimalista -->
        <div class="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 class="text-lg font-black text-white">
              {status === "approved" ? "Documento Homologado" : "Envio de Identidade"}
            </h3>
            <p class="text-xs text-white/70 mt-0.5">
              {#if nextSlot === "front"}
                Envie a <strong class="text-white">FRENTE</strong> do seu documento.
              {:else if nextSlot === "back"}
                Frente recebida! Agora envie o <strong class="text-white">VERSO</strong>.
              {:else}
                Documento enviado para análise.
              {/if}
            </p>
          </div>
          <button
            type="button"
            onclick={closeSheet}
            class="size-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <!-- Seletor RG / CNH (condicional à autorização canReceiveCnh) -->
        {#if canReceiveCnh && status !== "approved"}
          <div class="flex rounded-xl bg-black/40 p-1 border border-white/10" role="tablist">
            <button
              type="button"
              data-testid="rg-tab-btn"
              onclick={() => { selectedDocType = "rg"; }}
              class="flex-1 py-1.5 text-xs font-bold rounded-lg transition {selectedDocType === 'rg' ? 'bg-brand-green text-white shadow' : 'text-white/60 hover:text-white'}"
            >
              RG
            </button>
            <button
              type="button"
              data-testid="cnh-tab-btn"
              onclick={() => { selectedDocType = "cnh"; }}
              class="flex-1 py-1.5 text-xs font-bold rounded-lg transition {selectedDocType === 'cnh' ? 'bg-brand-green text-white shadow' : 'text-white/60 hover:text-white'}"
            >
              CNH Digital / Física
            </button>
          </div>
        {/if}

        <!-- Feedback de Triagem da IA no Front -->
        {#if isAnalyzing}
          <div class="flex items-center gap-3 p-4 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-200" data-testid="triage-loading">
            <div class="size-5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent"></div>
            <span class="text-xs font-semibold">IA analisando legibilidade e nitidez do documento…</span>
          </div>
        {:else if isUploading}
          <div class="flex items-center gap-3 p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200">
            <div class="size-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent"></div>
            <span class="text-xs font-semibold">Enviando frente e verso para validação na secretaria…</span>
          </div>
        {:else if triageError}
          <div class="p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 flex flex-col gap-1" data-testid="triage-error">
            <span class="text-xs font-black text-red-300">Não foi possível validar:</span>
            <p class="text-xs text-red-200 leading-relaxed">{triageError}</p>
          </div>
        {/if}

        <!-- Status de progresso frente / verso -->
        <div class="grid grid-cols-2 gap-3">
          <div class="flex items-center gap-2 p-3 rounded-xl border {frontData ? 'border-emerald-500/40 bg-emerald-950/30' : 'border-white/10 bg-white/5'}">
            <span class="size-2 rounded-full {frontData ? 'bg-emerald-400' : 'bg-white/30'}"></span>
            <span class="text-xs font-bold {frontData ? 'text-emerald-300' : 'text-white/60'}">
              1. Frente {frontData ? '✓' : 'pendente'}
            </span>
          </div>
          <div class="flex items-center gap-2 p-3 rounded-xl border {backData ? 'border-emerald-500/40 bg-emerald-950/30' : 'border-white/10 bg-white/5'}">
            <span class="size-2 rounded-full {backData ? 'bg-emerald-400' : 'bg-white/30'}"></span>
            <span class="text-xs font-bold {backData ? 'text-emerald-300' : 'text-white/60'}">
              2. Verso {backData ? '✓' : 'pendente'}
            </span>
          </div>
        </div>

        <!-- Duas Ações Minimalistas de Anexo -->
        {#if status !== "approved"}
          <div class="flex flex-col gap-3">
            <!-- Ação 1: Anexar Documento (Galeria / Arquivos / PDF) -->
            <label class="flex items-center justify-center gap-2.5 w-full py-3.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm cursor-pointer transition active:scale-[0.99]">
              <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
              <span>Anexar documento</span>
              <input
                type="file"
                data-testid="input-doc-file"
                accept="image/*,application/pdf"
                class="hidden"
                onchange={onFileInputChange}
              />
            </label>

            <!-- Ação 2: Tirar Foto (Câmera com capture environment) -->
            <label class="flex items-center justify-center gap-2.5 w-full py-3.5 px-4 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white font-bold text-sm cursor-pointer transition active:scale-[0.99] shadow-lg shadow-emerald-900/40">
              <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span>Tirar foto</span>
              <input
                type="file"
                data-testid="input-doc-camera"
                accept="image/*"
                capture="environment"
                class="hidden"
                onchange={onFileInputChange}
              />
            </label>
          </div>
        {:else}
          <div class="flex flex-col gap-2 text-center p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300">
            <span class="text-xs font-bold">Documento homologado pela secretaria acadêmica.</span>
            <p class="text-[11px] text-emerald-400/80">Não são necessárias novas ações para esta etapa.</p>
          </div>
        {/if}

        <button
          type="button"
          onclick={closeSheet}
          class="w-full py-2.5 text-xs font-bold text-white/60 hover:text-white text-center"
        >
          Fechar
        </button>
      </div>
    </div>
  {/if}
</div>
