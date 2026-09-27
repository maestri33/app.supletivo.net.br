<script lang="ts">
  import { onMount } from "svelte";
  import { getSession } from "@/lib/session";
  import {
    setLeadCheckout,
    getLeadCheckoutUrl,
    getLeadMe,
    confirmIdentity,
    setLeadEmail,
    ApiError,
    type CheckoutOut,
  } from "@/lib/api";
  import PixCheckout from "./PixCheckout.svelte";

  // Fases do Paywall:
  // 1. "selection": Exibição dos 2 cards (PIX vs Cartão) - Fase 1
  // 2. "pix": Checkout nativo com QR Code e Copia-e-Cola do Asaas - Fase 2
  // 3. "profile": Completação de CPF/Email caso o perfil esteja incompleto
  type PaywallMode = "selection" | "pix" | "profile";

  let mode = $state<PaywallMode>("selection");
  let busy = $state(false);
  let errorMessage = $state<string | null>(null);

  let pixToken = $state<string | null>(null);
  let checkoutData = $state<CheckoutOut | null>(null);

  // Perfil incompleto (caso o backend exija CPF ou E-mail)
  let pendingPaymentMethod = $state<"pix" | "credit_card">("pix");
  let missingFields = $state<string[]>([]);
  let profileCpf = $state("");
  let profileEmail = $state("");
  let profileBusy = $state(false);
  let profileError = $state<string | null>(null);

  // Valores padrão / promocionais consultor
  let hasRef = $state(false);
  let pixPrice = $derived(hasRef ? "R$ 999,00" : "R$ 1.615,00");
  let creditPrice = $derived(hasRef ? "12x de R$ 99,00" : "12x de R$ 161,00");
  let discountBadge = $derived(hasRef ? "Desconto Especial de Consultor Aplicado" : null);

  // Notifica o dock flutuante sobre a mudança de fase (1. Modalidade vs 2. Checkout)
  $effect(() => {
    if (typeof window !== "undefined") {
      const phase = mode === "selection" ? "selection" : "checkout";
      window.dispatchEvent(
        new CustomEvent("supletivo:lead-wizard-phase", { detail: { phase } })
      );
    }
  });

  onMount(() => {
    const session = getSession();
    if (session?.ref) {
      hasRef = true;
    }

    // Escuta comandos acionados diretamente nos botões do Dock Wizard
    const handleWizardStep = (e: Event) => {
      const customEvent = e as CustomEvent<{ step: "selection" | "checkout" }>;
      const step = customEvent.detail?.step;
      if (step === "selection") {
        backToSelection();
      } else if (step === "checkout" && mode === "selection") {
        void selectPix();
      }
    };

    window.addEventListener("supletivo:lead-wizard-step", handleWizardStep);

    // Polling ativo para detecção imediata de confirmação do pagamento
    const pollInterval = setInterval(async () => {
      try {
        const lead = await getLeadMe();
        if (lead && (lead.checkout?.is_paid || (lead as any).status === "paid")) {
          clearInterval(pollInterval);
          // Redireciona imediatamente para o novo ambiente do estudante: Fase de Matrícula
          window.location.href = "/student/enrollment";
        }
      } catch {
        // Silencioso em caso de polling
      }
    }, 3500);

    return () => {
      window.removeEventListener("supletivo:lead-wizard-step", handleWizardStep);
      clearInterval(pollInterval);
    };
  });

  function handleProfileIncomplete(method: "pix" | "credit_card", extra?: any) {
    pendingPaymentMethod = method;
    missingFields = extra?.missing_fields || ["cpf", "email"];
    mode = "profile";
  }

  async function submitProfileCompletion() {
    profileBusy = true;
    profileError = null;

    try {
      if (missingFields.includes("cpf") && profileCpf.trim()) {
        const cleanCpf = profileCpf.replace(/\D/g, "");
        if (cleanCpf.length !== 11) {
          throw new Error("CPF deve conter 11 dígitos numéricos.");
        }
        await confirmIdentity(cleanCpf);
      }

      if (missingFields.includes("email") && profileEmail.trim()) {
        if (!profileEmail.includes("@") || !profileEmail.includes(".")) {
          throw new Error("Informe um endereço de e-mail válido.");
        }
        await setLeadEmail(profileEmail.trim());
      }

      mode = "selection";
      if (pendingPaymentMethod === "pix") {
        await selectPix();
      } else {
        await selectCredit();
      }
    } catch (err: any) {
      profileError = err?.message || "Erro ao salvar seus dados cadastrais.";
    } finally {
      profileBusy = false;
    }
  }

  async function selectPix() {
    busy = true;
    errorMessage = null;

    try {
      const res = await setLeadCheckout("pix");
      checkoutData = res;

      // Extrai token do link curto ou checkout_url
      const targetUrl = res.checkout_url || res.url || res.short_url || "";
      const match = targetUrl.match(/\/pix\/([^/?]+)/);
      pixToken = match ? match[1] : (targetUrl ? "active" : "default");
      mode = "pix";
    } catch (err: any) {
      if (err instanceof ApiError && err.code === "PROFILE_INCOMPLETE") {
        handleProfileIncomplete("pix", err.extra);
        return;
      }
      // Se já houver checkout criado no backend
      try {
        const checkUrl = await getLeadCheckoutUrl();
        const match = checkUrl.url.match(/\/pix\/([^/?]+)/);
        if (match) {
          pixToken = match[1];
          mode = "pix";
          return;
        }
      } catch {}
      errorMessage = err?.message || "Não foi possível gerar a cobrança PIX no momento.";
    } finally {
      busy = false;
    }
  }

  async function selectCredit() {
    busy = true;
    errorMessage = null;

    try {
      const res = await setLeadCheckout("credit_card");

      // 1. Link direto oficial do gateway InfinitePay
      if (res.checkout_url) {
        window.location.href = res.checkout_url;
        return;
      }

      // 2. Link canônico com lazy build (302 redirect para InfinitePay)
      if (res.url || res.short_url) {
        window.location.href = res.url || res.short_url || "";
        return;
      }

      // 3. Fallback para getLeadCheckoutUrl()
      const checkUrl = await getLeadCheckoutUrl();
      if (checkUrl.url) {
        window.location.href = checkUrl.url;
        return;
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.code === "PROFILE_INCOMPLETE") {
        handleProfileIncomplete("credit_card", err.extra);
        return;
      }
      try {
        const checkUrl = await getLeadCheckoutUrl();
        if (checkUrl.url) {
          window.location.href = checkUrl.url;
          return;
        }
      } catch {}
      errorMessage = err?.message || "Não foi possível conectar ao checkout de cartão da InfinitePay.";
    } finally {
      busy = false;
    }
  }

  function backToSelection() {
    mode = "selection";
    errorMessage = null;
    profileError = null;
  }
</script>

<div class="w-full max-w-3xl mx-auto p-4 sm:p-6 text-white">
  {#if mode === "selection"}
    <!-- Cabeçalho do Estado Travado -->
    <div class="text-center mb-8 space-y-2">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-xs font-semibold text-amber-300">
        <span class="size-2 rounded-full bg-amber-400 animate-pulse"></span>
        Etapa de Ativação de Matrícula
      </div>
      <h1 class="text-2xl sm:text-4xl font-display tracking-tight text-white">
        Conclua sua matrícula para liberar as aulas
      </h1>
      <p class="text-xs sm:text-sm text-white/70 max-w-lg mx-auto">
        Escolha abaixo como prefere realizar o pagamento único da sua formação do Ensino Médio.
      </p>

      {#if discountBadge}
        <div class="inline-block mt-2 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
          ★ {discountBadge}
        </div>
      {/if}
    </div>

    {#if errorMessage}
      <div class="mb-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-200 text-center flex items-center justify-center gap-2">
        <span>⚠️</span>
        <span>{errorMessage}</span>
      </div>
    {/if}

    <!-- 2 Cards de Escolha -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Card PIX (Asaas Oficial) -->
      <div class="rounded-3xl p-6 sm:p-8 glass-panel border-2 border-[var(--yellow)]/60 flex flex-col justify-between relative overflow-hidden group hover:border-[var(--yellow)] transition-all shadow-xl bg-white/[0.03]">
        <div class="absolute -right-8 -top-8 size-28 bg-[var(--yellow)]/10 rounded-full blur-2xl pointer-events-none"></div>
        <div>
          <div class="inline-flex px-2.5 py-1 rounded-md bg-[var(--yellow)] text-[var(--ink)] text-[10px] font-black uppercase tracking-wider mb-3">
            Liberação Instantânea
          </div>
          <h2 class="text-xl font-display text-white">Pagamento via PIX</h2>
          <p class="text-xs text-white/60 mt-1">À vista com o maior desconto promocional.</p>

          <div class="mt-6 mb-4">
            <span class="text-3xl sm:text-4xl font-display text-emerald-400 font-bold">{pixPrice}</span>
            <span class="text-xs text-white/50 block mt-1">taxa única sem mensalidades</span>
          </div>

          <ul class="text-xs text-white/70 space-y-2 mt-4">
            <li class="flex items-center gap-2">✓ QR Code e código copia-e-cola na hora</li>
            <li class="flex items-center gap-2">✓ Confirmação em menos de 10 segundos</li>
            <li class="flex items-center gap-2">✓ Acesso imediato à plataforma de aulas</li>
          </ul>
        </div>

        <div class="mt-8 pt-4 border-t border-white/10">
          <button
            type="button"
            onclick={selectPix}
            disabled={busy}
            class="w-full py-3.5 rounded-full bg-[var(--yellow)] text-[var(--ink)] font-bold text-sm uppercase tracking-wide hover:opacity-90 active:scale-[0.98] transition-all shadow-lg cursor-pointer disabled:opacity-50"
          >
            {busy ? "Emitindo PIX Bancário..." : "Pagar com PIX Oficial →"}
          </button>
        </div>
      </div>

      <!-- Card Cartão de Crédito (InfinitePay Oficial) -->
      <div class="rounded-3xl p-6 sm:p-8 glass-panel border border-white/15 flex flex-col justify-between relative overflow-hidden group hover:border-white/30 transition-all shadow-xl bg-white/[0.02]">
        <div>
          <div class="inline-flex px-2.5 py-1 rounded-md bg-white/10 text-white/80 text-[10px] font-bold uppercase tracking-wider mb-3">
            Até 12x Sem Juros
          </div>
          <h2 class="text-xl font-display text-white">Cartão de Crédito</h2>
          <p class="text-xs text-white/60 mt-1">Parcelamento facilitado em ambiente seguro InfinitePay.</p>

          <div class="mt-6 mb-4">
            <span class="text-3xl sm:text-4xl font-display text-white font-bold">{creditPrice}</span>
            <span class="text-xs text-white/50 block mt-1">ou parcelado no seu cartão</span>
          </div>

          <ul class="text-xs text-white/70 space-y-2 mt-4">
            <li class="flex items-center gap-2">✓ Pagamento seguro via InfinitePay</li>
            <li class="flex items-center gap-2">✓ Liberação rápida após confirmação</li>
            <li class="flex items-center gap-2">✓ Certificado válido pelo MEC incluso</li>
          </ul>
        </div>

        <div class="mt-8 pt-4 border-t border-white/10">
          <button
            type="button"
            onclick={selectCredit}
            disabled={busy}
            class="w-full py-3.5 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 text-white text-sm font-bold uppercase tracking-wide cursor-pointer transition-colors disabled:opacity-50"
          >
            {busy ? "Abrindo InfinitePay..." : "Pagar no Cartão (InfinitePay) ↗"}
          </button>
        </div>
      </div>
    </div>

  {:else if mode === "profile"}
    <!-- Preenchimento de Dados Pendentes (PROFILE_INCOMPLETE) -->
    <div class="max-w-md mx-auto p-6 sm:p-8 rounded-3xl glass-panel border border-white/20 shadow-2xl space-y-6">
      <div class="text-center space-y-2">
        <div class="inline-flex size-12 rounded-2xl bg-[var(--yellow)]/20 text-[var(--yellow)] items-center justify-center text-xl">
          📋
        </div>
        <h2 class="text-xl font-display text-white">Confirmação Cadastral</h2>
        <p class="text-xs text-white/70">
          Para emitir sua cobrança oficial e registrar sua matrícula conforme as normas educacionais, confirme seus dados abaixo:
        </p>
      </div>

      {#if profileError}
        <div class="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-200 text-center">
          {profileError}
        </div>
      {/if}

      <div class="space-y-4 text-left">
        {#if missingFields.includes("cpf")}
          <div>
            <label for="profile-cpf" class="block text-xs font-semibold text-white/80 mb-1">Seu CPF</label>
            <input
              id="profile-cpf"
              type="text"
              bind:value={profileCpf}
              placeholder="000.000.000-00"
              class="w-full px-4 py-2.5 rounded-xl border border-white/15 bg-black/40 text-white text-sm focus:outline-none focus:border-[var(--yellow)]"
            />
          </div>
        {/if}

        {#if missingFields.includes("email")}
          <div>
            <label for="profile-email" class="block text-xs font-semibold text-white/80 mb-1">Seu E-mail</label>
            <input
              id="profile-email"
              type="email"
              bind:value={profileEmail}
              placeholder="seu-email@exemplo.com"
              class="w-full px-4 py-2.5 rounded-xl border border-white/15 bg-black/40 text-white text-sm focus:outline-none focus:border-[var(--yellow)]"
            />
          </div>
        {/if}

        <button
          type="button"
          onclick={submitProfileCompletion}
          disabled={profileBusy}
          class="w-full py-3 rounded-xl bg-[var(--yellow)] text-[var(--ink)] font-bold text-xs uppercase tracking-wide hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 mt-2"
        >
          {profileBusy ? "Salvando Dados..." : "Confirmar e Ir para o Pagamento →"}
        </button>

        <button
          type="button"
          onclick={backToSelection}
          class="w-full text-center text-xs text-white/60 hover:text-white transition-colors"
        >
          Voltar às opções
        </button>
      </div>
    </div>

  {:else if mode === "pix"}
    <!-- Checkout PIX Nativo -->
    <div class="space-y-4">
      <div class="flex items-center justify-between pb-2 border-b border-white/10">
        <button
          type="button"
          onclick={backToSelection}
          class="inline-flex items-center gap-2 text-xs text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          ← Voltar para as opções de pagamento
        </button>
        <span class="text-xs text-emerald-400 font-bold">PIX Bancário Oficial</span>
      </div>

      <PixCheckout token={pixToken || "default"} initialData={checkoutData} />
    </div>
  {/if}
</div>
