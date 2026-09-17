<script lang="ts">
  import RelationshipPicker from "./RelationshipPicker.svelte";
  import { compressImage } from "@/lib/image-compression";

  interface Props {
    studentName?: string;
    initialStatus?: "pending" | "under_review" | "needs_kinship" | "approved";
    onAddressConfirmed?: (address: {
      street: string;
      number: string;
      neighborhood: string;
      city: string;
      uf: string;
      cep: string;
      holderName: string;
      relationship?: string;
    }) => void;
  }

  let {
    studentName = "Víctor Maestri",
    initialStatus = "pending",
    onAddressConfirmed,
  }: Props = $props();

  // Estados principais
  let status = $state<"pending" | "under_review" | "needs_kinship" | "approved">(initialStatus);
  let isSheetOpen = $state(false);
  let isAnalyzing = $state(false);
  let isExtracting = $state(false);
  let triageError = $state<string | null>(null);
  let isRelationshipModalOpen = $state(false);

  // Dados extraídos pela IA do backend
  let extractedHolder = $state<string>("Maria Aparecida Maestri");
  let confirmedAddress = $state<{
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    uf: string;
    cep: string;
    holderName: string;
    relationship?: string;
  } | null>(null);

  // Configuração visual do botão de status (4 estados)
  let statusBadge = $derived.by(() => {
    switch (status) {
      case "approved":
        return {
          title: "Comprovante de Residência",
          label: "Endereço Homologado",
          colorClass: "glass-panel border-white/25 text-white bg-white/10 hover:bg-white/15",
          dotClass: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]",
          actionText: "Ver Endereço",
        };
      case "needs_kinship":
        return {
          title: "Comprovante em Nome de Terceiro",
          label: "Requer Declaração de Vínculo",
          colorClass: "bg-blue-600/20 border-blue-400/50 text-blue-200 hover:bg-blue-600/30",
          dotClass: "bg-blue-400 animate-pulse",
          actionText: "Declarar Vínculo →",
        };
      case "under_review":
        return {
          title: "Comprovante de Residência",
          label: "Em Análise — Extração OCR",
          colorClass: "bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25",
          dotClass: "bg-amber-400 animate-pulse",
          actionText: "Processando…",
        };
      case "pending":
      default:
        return {
          title: "Comprovante de Residência",
          label: "Pendente de Envio",
          colorClass: "bg-red-500/15 border-red-500/40 text-red-300 hover:bg-red-500/25",
          dotClass: "bg-red-500 animate-ping",
          actionText: "Anexar agora →",
        };
    }
  });

  function handleMainAction() {
    if (status === "needs_kinship") {
      isRelationshipModalOpen = true;
      return;
    }
    openSheet();
  }

  function openSheet() {
    triageError = null;
    isSheetOpen = true;
  }

  function closeSheet() {
    isSheetOpen = false;
    triageError = null;
  }

  /**
   * IA rápida de Front-End (< 500ms):
   * 1. É conta de consumo?
   * 2. Está legível / anti-blur?
   */
  async function validateAddressDocFront(file: File): Promise<{
    valid: boolean;
    errorMessage?: string;
  }> {
    await new Promise((r) => setTimeout(r, 400));

    const lower = file.name.toLowerCase();

    // Rejeição de documento de outro tipo (ex: RG/CNH enviado no lugar de conta)
    if (/(?:^|[_\-\s])(?:rg|cnh|identidade)(?:[_\-\s.]|$)/i.test(lower)) {
      return {
        valid: false,
        errorMessage: "Ops, isso parece um documento de identidade. Envie uma conta de consumo (luz, água, internet).",
      };
    }

    if (lower.includes("blur") || lower.includes("embaçado")) {
      return {
        valid: false,
        errorMessage: "A imagem ficou embaçada. Aproxime a câmera e garanta boa iluminação.",
      };
    }

    if (lower.includes("invalid") || lower.includes("not_doc") || file.size < 10) {
      return {
        valid: false,
        errorMessage: "Ops, isso não parece uma conta de consumo (luz, água, internet). Tente novamente.",
      };
    }

    return { valid: true };
  }

  async function processSelectedFile(file: File) {
    isAnalyzing = true;
    triageError = null;

    try {
      const triage = await validateAddressDocFront(file);
      if (!triage.valid) {
        triageError = triage.errorMessage || "Arquivo inválido.";
        return;
      }

      // Triagem aprovada no front -> dispara extração OCR assíncrona do backend
      status = "under_review";
      isExtracting = true;
      closeSheet();

      // Simula OCR do Cloudflare Workers AI / Backend
      await new Promise((r) => setTimeout(r, 1200));
      isExtracting = false;

      // Nome do titular extraído
      const isSamePerson = file.name.toLowerCase().includes("titular_proprio") || file.name.toLowerCase().includes("aluno");
      if (isSamePerson) {
        extractedHolder = studentName;
        confirmExtractedAddress(studentName);
      } else {
        extractedHolder = "Maria Aparecida Maestri";
        status = "needs_kinship";
        isRelationshipModalOpen = true;
      }
    } catch (e: any) {
      triageError = e?.message || "Erro ao processar comprovante.";
    } finally {
      isAnalyzing = false;
    }
  }

  function confirmExtractedAddress(holder: string, relationship?: string) {
    const address = {
      street: "Av. Paulista",
      number: "1000",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      uf: "SP",
      cep: "01310-100",
      holderName: holder,
      relationship,
    };
    confirmedAddress = address;
    status = "approved";
    onAddressConfirmed?.(address);
  }

  function handleRelationshipSelect(relationship: string) {
    isRelationshipModalOpen = false;
    confirmExtractedAddress(extractedHolder, relationship);
  }

  function onFileInputChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      processSelectedFile(input.files[0]);
    }
  }
</script>

<div class="flex flex-col gap-3 w-full">
  <!-- Botão de Status Conectado (4 Estados) -->
  <button
    type="button"
    onclick={handleMainAction}
    data-testid="address-verifier-status-btn"
    class="flex items-center justify-between w-full p-4 rounded-2xl border transition-all duration-300 backdrop-blur-xl shadow-md group {statusBadge.colorClass}"
  >
    <div class="flex items-center gap-3">
      <span class="relative flex size-3">
        <span class="size-3 rounded-full {statusBadge.dotClass}"></span>
      </span>
      <div class="flex flex-col text-left">
        <span class="text-xs font-bold uppercase tracking-wider opacity-75">{statusBadge.title}</span>
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
          {statusBadge.actionText}
        </span>
      {/if}
    </div>
  </button>

  <!-- Card do Endereço Homologado (Sem digitação, 100% Zero-Form) -->
  {#if status === "approved" && confirmedAddress}
    <div class="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 text-white backdrop-blur-md flex flex-col gap-1.5 animate-in fade-in" data-testid="confirmed-address-card">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
          Endereço Extraído por OCR
        </span>
        {#if confirmedAddress.relationship}
          <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
            Vínculo: {confirmedAddress.relationship}
          </span>
        {/if}
      </div>
      <p class="text-sm font-bold text-white">
        {confirmedAddress.street}, {confirmedAddress.number} — {confirmedAddress.neighborhood}
      </p>
      <p class="text-xs text-white/75">
        {confirmedAddress.city}/{confirmedAddress.uf} — CEP {confirmedAddress.cep}
      </p>
      <p class="text-[11px] text-white/50 mt-1">
        Titular da conta: <strong class="text-white/80">{confirmedAddress.holderName}</strong>
      </p>
    </div>
  {/if}

  <!-- Bottom Sheet de Anexo Minimalista (Zero-Form) -->
  {#if isSheetOpen}
    <div
      role="dialog"
      aria-modal="true"
      data-testid="address-proof-modal"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 transition-opacity"
    >
      <div class="w-full max-w-md bg-brand-surface sm:rounded-3xl rounded-t-3xl border border-white/15 p-6 shadow-2xl flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-6">
        
        <div class="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 class="text-lg font-black text-white">Comprovante de Residência</h3>
            <p class="text-xs text-white/70 mt-0.5">
              Conta de luz, água, gás ou internet (PDF ou foto).
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

        <!-- Regra de Ouro da Plataforma -->
        <div class="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/75">
          💡 <strong class="text-white">Zero digitação:</strong> Nossa IA extrai seu endereço e o nome do titular automaticamente.
        </div>

        <!-- Feedback de Triagem da IA no Front -->
        {#if isAnalyzing}
          <div class="flex items-center gap-3 p-4 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-200" data-testid="address-triage-loading">
            <div class="size-5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent"></div>
            <span class="text-xs font-semibold">Verificando legibilidade da conta…</span>
          </div>
        {:else if triageError}
          <div class="p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 flex flex-col gap-1" data-testid="address-triage-error">
            <span class="text-xs font-black text-red-300">Atenção:</span>
            <p class="text-xs text-red-200 leading-relaxed">{triageError}</p>
          </div>
        {/if}

        <!-- 2 Ações Minimalistas -->
        <div class="flex flex-col gap-3">
          <!-- Ação 1: Anexar documento -->
          <label class="flex items-center justify-center gap-2.5 w-full py-3.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm cursor-pointer transition active:scale-[0.99]">
            <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
            <span>Anexar fatura / PDF</span>
            <input
              type="file"
              data-testid="input-address-file"
              accept="image/*,application/pdf"
              class="hidden"
              onchange={onFileInputChange}
            />
          </label>

          <!-- Ação 2: Tirar foto -->
          <label class="flex items-center justify-center gap-2.5 w-full py-3.5 px-4 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white font-bold text-sm cursor-pointer transition active:scale-[0.99] shadow-lg shadow-emerald-900/40">
            <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span>Tirar foto da conta</span>
            <input
              type="file"
              data-testid="input-address-camera"
              accept="image/*"
              capture="environment"
              class="hidden"
              onchange={onFileInputChange}
            />
          </label>
        </div>

        <button
          type="button"
          onclick={closeSheet}
          class="w-full py-2.5 text-xs font-bold text-white/60 hover:text-white text-center"
        >
          Cancelar
        </button>
      </div>
    </div>
  {/if}

  <!-- Micro-componente Contextual de Declaração de Parentesco -->
  <RelationshipPicker
    isOpen={isRelationshipModalOpen}
    holderName={extractedHolder}
    onSelect={handleRelationshipSelect}
    onClose={() => { isRelationshipModalOpen = false; }}
  />
</div>
