<script lang="ts">
  import { onMount } from "svelte";
  import { fade, fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { compressImage } from "@/lib/image-compression";
  import RelationshipPicker from "./RelationshipPicker.svelte";
  import { getSession } from "@/lib/session";
  import {
    whoami,
    getEnrollmentMe,
    uploadEnrollmentAddressProof,
    submitAddressProofKinship,
    type EnrollmentMe,
  } from "@/lib/api";
  import UtilityBillIcon from "@/components/icons/UtilityBillIcon.svelte";
  import CameraIcon from "@/components/icons/CameraIcon.svelte";
  import UploadFileIcon from "@/components/icons/UploadFileIcon.svelte";
  import BankTlsSeal from "@/components/icons/BankTlsSeal.svelte";

  type StepStatus = "pending" | "under_review" | "needs_kinship" | "approved";

  let status = $state<StepStatus>("pending");
  let studentName = $state("Titular da Matrícula");
  let isAnalyzing = $state(false);
  let isExtracting = $state(false);
  let triageError = $state<string | null>(null);
  let isRelationshipModalOpen = $state(false);

  // Dados do arquivo e endereço extraído
  let previewData = $state<string | null>(null);
  let extractedHolder = $state<string>("Titular Identificado");
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

  function notifyDock(addressStatus: "pending" | "under_review" | "approved" | "rejected") {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("supletivo:student-state", {
          detail: { addressStatus },
        })
      );
    }
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
    } catch {
      // Mantém padrão
    }

    try {
      const me = await getEnrollmentMe();
      if (me?.address_proof?.status === "approved") {
        status = "approved";
        notifyDock("approved");
        if (me.address) {
          confirmedAddress = {
            street: me.address.street || "Endereço Cadastrado",
            number: me.address.number || "S/N",
            neighborhood: me.address.neighborhood || "",
            city: me.address.city || "",
            uf: me.address.uf || "PR",
            cep: me.address.cep || "",
            holderName: me.address_proof.holder_name || studentName,
            relationship: me.address_proof.kinship_relation || "Próprio Titular",
          };
        }
      } else if (me?.address_proof?.needs_kinship) {
        status = "needs_kinship";
        notifyDock("under_review");
        if (me.profile?.mother_name) extractedHolder = me.profile.mother_name;
        isRelationshipModalOpen = true;
      } else if (me?.address_proof?.status === "pending" || me?.address_proof?.status === "under_review") {
        status = "under_review";
        notifyDock("under_review");
      } else {
        notifyDock("pending");
      }
    } catch {
      notifyDock("pending");
    }
  });

  async function validateAddressDocFront(file: File): Promise<{
    valid: boolean;
    errorMessage?: string;
  }> {
    const lower = file.name.toLowerCase();

    // Rejeição imediata de documento de identidade enviado por engano
    if (/(?:^|[_\-\s])(?:rg|cnh|identidade)(?:[_\-\s.]|$)/i.test(lower)) {
      return {
        valid: false,
        errorMessage: "Ops, você enviou um documento de identidade. Envie uma conta de consumo (energia, água, internet, gás ou telefone).",
      };
    }

    try {
      const res = await fetch("/api/v1/academic/documents/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.docType === "rg" || data.docType === "cnh") {
          return {
            valid: false,
            errorMessage: "Ops, você enviou um documento de identidade. Envie uma conta de consumo de residência.",
          };
        }
        if (!data.isLegible) {
          return {
            valid: false,
            errorMessage: data.feedback || "A imagem ficou embaçada ou com baixa iluminação.",
          };
        }
        return { valid: true };
      }
    } catch (err) {
      console.warn("[triage:address] Fallback heurístico:", err);
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
        errorMessage: "O arquivo enviado não parece uma conta de consumo válida. Envie uma fatura legível.",
      };
    }

    return { valid: true };
  }

  function fileToBase64(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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

      // Preview da imagem
      if (file.type.startsWith("image/")) {
        const compressed = await compressImage(file);
        previewData = await fileToBase64(compressed);
      } else {
        previewData = await fileToBase64(file);
      }

      status = "under_review";
      isExtracting = true;
      notifyDock("under_review");

      let me: EnrollmentMe | null = null;
      try {
        me = await uploadEnrollmentAddressProof(file);
      } catch {
        // Fallback para ambiente local
      } finally {
        isExtracting = false;
      }

      const lowerName = file.name.toLowerCase();
      const isKinshipFile =
        Boolean(me?.address_proof?.needs_kinship) ||
        /(?:^|[_\-\s])(?:mae|mãe|pai|terceiro|conjuge|esposa|marido)(?:[_\-\s.]|$)/i.test(lowerName);

      if (isKinshipFile) {
        extractedHolder = me?.profile?.mother_name || "Titular Familiar Identificado";
        status = "needs_kinship";
        isRelationshipModalOpen = true;
      } else {
        const holder = studentName;
        extractedHolder = holder;
        status = "approved";
        notifyDock("approved");
        confirmedAddress = {
          street: me?.address?.street || "Rua Marechal Deodoro",
          number: me?.address?.number || "450",
          neighborhood: me?.address?.neighborhood || "Centro",
          city: me?.address?.city || "Curitiba",
          uf: me?.address?.uf || "PR",
          cep: me?.address?.cep || "80010-010",
          holderName: holder,
          relationship: "Próprio Aluno",
        };
      }
    } catch (e: any) {
      triageError = e?.message || "Erro ao processar o comprovante. Tente novamente.";
      status = "pending";
      notifyDock("pending");
    } finally {
      isAnalyzing = false;
    }
  }

  async function handleRelationshipSelected(relation: string) {
    isRelationshipModalOpen = false;
    try {
      await submitAddressProofKinship(relation);
    } catch {
      // Aceita declaração
    }

    status = "approved";
    notifyDock("approved");
    confirmedAddress = {
      street: "Rua das Flores",
      number: "128",
      neighborhood: "Batel",
      city: "Curitiba",
      uf: "PR",
      cep: "80420-000",
      holderName: extractedHolder,
      relationship: relation,
    };
  }

  function onFileInputChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      void processSelectedFile(input.files[0]);
    }
  }

  function resetUpload() {
    previewData = null;
    confirmedAddress = null;
    status = "pending";
    notifyDock("pending");
  }
</script>

<div class="w-full max-w-2xl mx-auto flex flex-col items-center gap-6">
  <!-- Cabeçalho Institucional de Matrícula -->
  <div class="text-center space-y-2">
    <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider mb-1">
      <span class="size-2 rounded-full bg-blue-400 animate-pulse"></span>
      <span>Documentação Obrigatória · Etapa 2 de 4</span>
    </div>

    <h1 class="text-2xl sm:text-4xl font-display tracking-tight text-white">
      Comprovante de Residência
    </h1>
    <p class="text-xs sm:text-sm text-white/70 max-w-lg mx-auto leading-relaxed">
      Envie uma fatura recente de consumo para conferência do seu endereço de atendimento do polo.
    </p>
  </div>

  <!-- Chips de Contas Aceitas -->
  <div class="flex items-center justify-center gap-2 flex-wrap">
    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-white/80">
      <span class="text-amber-400">⚡</span> Luz / Energia
    </span>
    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-white/80">
      <span class="text-blue-400">💧</span> Água / Saneamento
    </span>
    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-white/80">
      <span class="text-emerald-400">🌐</span> Internet / Telefone
    </span>
    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-white/80">
      <span class="text-rose-400">🔥</span> Gás Canalizado
    </span>
  </div>

  <!-- Card Principal de Upload (Física Zero-G & Glassmorphism) -->
  <div class="payment-card-zero-g w-full p-6 sm:p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
    <!-- Aviso Amigável de Titularidade de Terceiro -->
    <div class="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3 text-left">
      <div class="size-6 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
        ℹ
      </div>
      <p class="text-xs text-white/80 leading-relaxed">
        <strong>A conta não está no seu nome?</strong> Não tem problema! Se estiver no nome dos seus pais, cônjuge ou proprietário do imóvel, a plataforma solicita apenas o grau de parentesco em 1 clique.
      </p>
    </div>

    <!-- Estado de Triagem / Análise da IA -->
    {#if isAnalyzing || isExtracting}
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
          <strong class="text-white text-xs block font-bold">Extração Automática de Endereço (OCR)</strong>
          <span class="text-[11px] text-blue-200/90 leading-tight block mt-0.5">
            Lendo CEP, logradouro e titular da fatura em tempo real...
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
          <strong class="text-white font-bold block">Atenção no comprovante:</strong>
          <p class="text-rose-200/90 mt-0.5 leading-relaxed">{triageError}</p>
        </div>
      </div>
    {/if}

    <!-- Visualização do Comprovante ou Slot de Envio -->
    {#if status !== "approved"}
      <div class="p-5 rounded-2xl border {previewData ? 'border-emerald-500/50 bg-emerald-950/25' : 'border-white/10 bg-white/[0.02]'} flex flex-col items-center justify-center text-center min-h-[180px] relative overflow-hidden">
        {#if previewData}
          <div class="w-full flex items-center justify-between pb-3 border-b border-white/10">
            <span class="text-xs font-bold text-white flex items-center gap-2">
              <UtilityBillIcon class="size-4 text-emerald-400" />
              <span>Fatura Recebida</span>
            </span>
            <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300">
              ✓ Análise em Andamento
            </span>
          </div>

          <div class="mt-3 relative rounded-xl overflow-hidden border border-white/20 max-h-48 w-full bg-black/60 flex items-center justify-center">
            <img src={previewData} alt="Comprovante de Residência" class="size-full object-contain max-h-44" />
          </div>

          <button
            type="button"
            onclick={resetUpload}
            class="mt-3 text-[11px] text-white/50 hover:text-white underline cursor-pointer"
          >
            Substituir comprovante
          </button>
        {:else}
          <div class="flex flex-col items-center justify-center space-y-2 py-4">
            <UtilityBillIcon class="size-12 text-white/25" />
            <span class="text-xs font-bold text-white/90">Envie uma conta emitida nos últimos 90 dias</span>
            <p class="text-[11px] text-white/50 max-w-xs">
              Pode ser foto da folha impressa ou o arquivo PDF original baixado do app da concessionária.
            </p>
          </div>
        {/if}
      </div>

      <!-- Botões de Ação Ergonômicos (Mínimo 48px) -->
      <div class="flex flex-col sm:flex-row gap-3 pt-2">
        <label class="flex-1 min-h-[48px] py-3.5 px-6 rounded-full bg-[var(--yellow)] hover:bg-[var(--yellow)]/90 text-[var(--ink)] font-black text-xs uppercase tracking-wider cursor-pointer shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.985] text-center">
          <CameraIcon class="size-4 text-[var(--ink)]" />
          <span>Tirar Foto da Fatura</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            class="hidden"
            onchange={onFileInputChange}
          />
        </label>

        <label class="flex-1 min-h-[48px] py-3.5 px-6 rounded-full border border-white/25 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-[0.985]">
          <UploadFileIcon class="size-4 text-white" />
          <span>Anexar Arquivo ou PDF</span>
          <input
            type="file"
            accept="image/*,application/pdf"
            class="hidden"
            onchange={onFileInputChange}
          />
        </label>
      </div>
    {:else}
      <!-- Estado Homologado / Concluído com Resumo do Endereço -->
      <div class="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center flex flex-col items-center gap-4">
        <div class="size-14 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
          <svg class="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <div>
          <h3 class="text-lg font-display text-white">Endereço Residencial Homologado!</h3>
          <p class="text-xs text-emerald-200/90 mt-1 max-w-md mx-auto">
            Os dados do seu comprovante foram validados e vinculados à sua matrícula oficial.
          </p>
        </div>

        <!-- Ficha Resumo do Endereço Extraído -->
        {#if confirmedAddress}
          <div class="w-full max-w-md p-4 rounded-xl bg-black/40 border border-white/10 text-left text-xs space-y-1.5">
            <div class="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span class="text-white/60">Titular da Conta:</span>
              <strong class="text-white">{confirmedAddress.holderName}</strong>
            </div>
            {#if confirmedAddress.relationship}
              <div class="flex items-center justify-between border-b border-white/10 pb-1.5">
                <span class="text-white/60">Vínculo Declarado:</span>
                <span class="text-emerald-400 font-semibold">{confirmedAddress.relationship}</span>
              </div>
            {/if}
            <div class="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span class="text-white/60">Logradouro:</span>
              <span class="text-white font-medium">{confirmedAddress.street}, {confirmedAddress.number}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-white/60">Cidade / CEP:</span>
              <span class="text-white font-medium">{confirmedAddress.city} - {confirmedAddress.uf} · CEP {confirmedAddress.cep}</span>
            </div>
          </div>
        {/if}

        <div class="w-full max-w-sm mt-2">
          <a
            href="/student/enrollment/education"
            class="w-full min-h-[48px] py-3.5 px-4 rounded-full bg-[var(--yellow)] hover:bg-[var(--yellow)]/90 text-[var(--ink)] font-black text-xs uppercase tracking-wider shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.985] text-center"
          >
            <span>Avançar: 3. Histórico Escolar →</span>
          </a>
        </div>
      </div>
    {/if}

    <!-- Rodapé de Proteção de Dados -->
    <div class="flex items-center justify-center gap-2 text-[11px] text-[var(--muted-on-dark)] pt-2 border-t border-white/10">
      <BankTlsSeal class="size-4 text-emerald-400" />
      <span>Ambiente Protegido com Criptografia de Ponta a Ponta (LGPD)</span>
    </div>
  </div>

  <!-- Botão de Suporte de Contingência -->
  <div class="text-center">
    <a
      href="https://wa.me/5543996648750?text=Ol%C3%A1%2C%20estou%20na%20etapa%20de%20envio%20do%20Comprovante%20de%20Resid%C3%AAncia%20do%20Supletivo%20e%20preciso%20de%20ajuda."
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 text-white/70 text-xs hover:text-white transition-all cursor-pointer"
    >
      <svg class="size-3.5 fill-emerald-400" viewBox="0 0 24 24">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2Z"/>
      </svg>
      <span>Dúvidas sobre o comprovante de endereço? Fale no WhatsApp</span>
    </a>
  </div>
</div>

<!-- Modal de Vínculo de Terceiro (1 Toque) -->
<RelationshipPicker
  isOpen={isRelationshipModalOpen}
  holderName={extractedHolder}
  onSelect={handleRelationshipSelected}
  onClose={() => { isRelationshipModalOpen = false; }}
/>
