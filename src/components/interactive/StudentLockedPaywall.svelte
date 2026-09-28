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
  // 1. "selection": Escolha da modalidade (Fase 1 - Botão 1 do Dock ativo)
  // 2. "preparing": Loop de espera/carregamento até o ambiente de checkout estar pronto
  // 3. "pix": Checkout nativo com QR Code e Copia-e-Cola do Asaas (Fase 2 - Botão 2 liberado e ativo)
  // 4. "profile": Completação de CPF/Email caso o perfil esteja incompleto
  type PaywallMode = "selection" | "preparing" | "pix" | "profile";

  let mode = $state<PaywallMode>("selection");
  let busy = $state(false);
  let errorMessage = $state<string | null>(null);

  // Estado do checkout e dock
  let isCheckoutReady = $state(false);
  let selectedModality = $state<"pix" | "credit_card" | null>(null);
  let pixToken = $state<string | null>(null);
  let checkoutData = $state<CheckoutOut | null>(null);

  // Mensagens do loop de preparação
  let preparingTitle = $state("Preparando seu checkout seguro...");
  let preparingMessage = $state("Estabelecendo conexão com o gateway...");
  let preparingStep = $state(1);

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

  /**
   * Notifica o dock de navegação com os dados de prontidão e fase do wizard.
   */
  function notifyDock(phase: "selection" | "checkout", ready: boolean, modality?: "pix" | "credit_card" | null) {
    if (typeof window !== "undefined") {
      (window as any).__supletivoLeadCheckoutReady = ready;
      window.dispatchEvent(
        new CustomEvent("supletivo:lead-checkout-status", {
          detail: { ready, phase, modality },
        })
      );
      window.dispatchEvent(
        new CustomEvent("supletivo:lead-wizard-phase", {
          detail: { phase },
        })
      );
    }
  }

  onMount(() => {
    const session = getSession();
    if (session?.ref) {
      hasRef = true;
    }

    // Inicialmente o checkout NÃO está pronto, botão 2 do dock permanece desabilitado
    notifyDock("selection", false, null);

    // Checa proativamente se já existe um checkout emitido no backend
    getLeadMe()
      .then((lead) => {
        if (lead && (lead.checkout?.is_paid || (lead as any).status === "paid")) {
          window.location.href = "/student/enrollment";
          return;
        }
        if (lead?.checkout) {
          const chk = lead.checkout;
          if (chk.payment_method === "pix" && (chk.qrcode_payload || chk.qrcode_image)) {
            checkoutData = chk;
            const targetUrl = chk.checkout_url || chk.url || chk.short_url || "";
            const match = targetUrl.match(/\/pix\/([^/?]+)/);
            pixToken = match ? match[1] : (targetUrl ? "active" : "default");
            isCheckoutReady = true;
            selectedModality = "pix";
            notifyDock("selection", true, "pix");
          }
        }
      })
      .catch(() => {
        // Silencioso em caso de erro na checagem inicial
      });

    // Escuta comandos acionados diretamente nos botões do Dock Wizard
    const handleWizardStep = (e: Event) => {
      const customEvent = e as CustomEvent<{ step: "selection" | "checkout" }>;
      const step = customEvent.detail?.step;
      if (step === "selection") {
        backToSelection();
      } else if (step === "checkout" && isCheckoutReady && checkoutData) {
        mode = "pix";
        notifyDock("checkout", true, "pix");
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
    notifyDock("selection", false, method);
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

  /**
   * Fluxo de Escolha PIX (Asaas):
   * 1. Entra em loop de preparação visual (mode = "preparing").
   * 2. Chama setLeadCheckout("pix").
   * 3. Aguarda o QR code e copia-e-cola ficarem prontos.
   * 4. Habilita o Botão 2 no Dock e avança para a Fase 2 (Checkout PIX).
   */
  async function selectPix() {
    busy = true;
    errorMessage = null;
    selectedModality = "pix";
    mode = "preparing";
    preparingStep = 1;
    preparingTitle = "Gerando cobrança PIX...";
    preparingMessage = "Conectando ao Banco Central e emitindo seu QR Code com desconto...";
    notifyDock("selection", false, "pix");

    try {
      preparingStep = 2;
      const res = await setLeadCheckout("pix");
      checkoutData = res;

      // Se os dados do PIX já estiverem no retorno
      if (res.qrcode_payload || res.checkout_url || res.url || res.short_url) {
        preparingStep = 3;
        preparingMessage = "QR Code gerado com sucesso! Abrindo checkout...";
        const targetUrl = res.checkout_url || res.url || res.short_url || "";
        const match = targetUrl.match(/\/pix\/([^/?]+)/);
        pixToken = match ? match[1] : (targetUrl ? "active" : "default");

        await new Promise((resolve) => setTimeout(resolve, 450));
        isCheckoutReady = true;
        mode = "pix";
        notifyDock("checkout", true, "pix");
        return;
      }

      // Loop de polling aguardando o build em background do gateway
      preparingStep = 2;
      preparingMessage = "Aguardando confirmação do Asaas...";
      let attempts = 0;
      const maxAttempts = 12;

      while (attempts < maxAttempts) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 1200));

        try {
          const lead = await getLeadMe();
          if (lead?.checkout?.qrcode_payload || lead?.checkout?.checkout_url) {
            checkoutData = lead.checkout;
            const targetUrl = lead.checkout.checkout_url || lead.checkout.url || lead.checkout.short_url || "";
            const match = targetUrl.match(/\/pix\/([^/?]+)/);
            pixToken = match ? match[1] : "default";

            preparingStep = 3;
            preparingMessage = "Pronto! Abrindo seu checkout PIX...";
            await new Promise((resolve) => setTimeout(resolve, 400));
            isCheckoutReady = true;
            mode = "pix";
            notifyDock("checkout", true, "pix");
            return;
          }
        } catch {
          // Continua polling
        }
      }

      // Fallback: se timeout do polling, tenta URL direta
      try {
        const checkUrl = await getLeadCheckoutUrl();
        const match = checkUrl.url.match(/\/pix\/([^/?]+)/);
        if (match) {
          pixToken = match[1];
          isCheckoutReady = true;
          mode = "pix";
          notifyDock("checkout", true, "pix");
          return;
        }
      } catch {}

      throw new Error("O gateway bancário demorou para responder. Por favor, tente novamente.");
    } catch (err: any) {
      if (err instanceof ApiError && err.code === "PROFILE_INCOMPLETE") {
        handleProfileIncomplete("pix", err.extra);
        return;
      }
      mode = "selection";
      notifyDock("selection", isCheckoutReady, selectedModality);
      errorMessage = err?.message || "Não foi possível gerar a cobrança PIX no momento.";
    } finally {
      busy = false;
    }
  }

  /**
   * Fluxo de Escolha Cartão de Crédito (InfinitePay):
   * 1. Entra em loop de preparação visual (mode = "preparing").
   * 2. Chama setLeadCheckout("credit_card").
   * 3. Aguarda o link oficial InfinitePay ficar pronto.
   * 4. Redireciona para a página externa do checkout oficial InfinitePay.
   */
  async function selectCredit() {
    busy = true;
    errorMessage = null;
    selectedModality = "credit_card";
    mode = "preparing";
    preparingStep = 1;
    preparingTitle = "Conectando à InfinitePay...";
    preparingMessage = "Iniciando sessão segura e preparando parcelamento em até 12x...";
    notifyDock("selection", false, "credit_card");

    try {
      preparingStep = 2;
      const res = await setLeadCheckout("credit_card");

      // 1. Link direto oficial do gateway InfinitePay
      const directUrl = res.checkout_url || res.url || res.short_url;
      if (directUrl) {
        preparingStep = 3;
        preparingMessage = "Ambiente seguro pronto! Redirecionando para a InfinitePay...";
        await new Promise((resolve) => setTimeout(resolve, 500));
        window.location.href = directUrl;
        return;
      }

      // Loop de polling aguardando o build em background da InfinitePay
      let attempts = 0;
      const maxAttempts = 10;
      while (attempts < maxAttempts) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 1200));

        try {
          const lead = await getLeadMe();
          const targetUrl = lead?.checkout?.checkout_url || lead?.checkout?.url || lead?.checkout?.short_url;
          if (targetUrl) {
            preparingStep = 3;
            preparingMessage = "Ambiente seguro pronto! Redirecionando para a InfinitePay...";
            await new Promise((resolve) => setTimeout(resolve, 400));
            window.location.href = targetUrl;
            return;
          }
        } catch {}
      }

      // Fallback para getLeadCheckoutUrl()
      const checkUrl = await getLeadCheckoutUrl();
      if (checkUrl.url) {
        preparingStep = 3;
        preparingMessage = "Redirecionando para a InfinitePay...";
        await new Promise((resolve) => setTimeout(resolve, 400));
        window.location.href = checkUrl.url;
        return;
      }

      throw new Error("Não recebemos o link de cartão do gateway. Tente novamente.");
    } catch (err: any) {
      if (err instanceof ApiError && err.code === "PROFILE_INCOMPLETE") {
        handleProfileIncomplete("credit_card", err.extra);
        return;
      }
      mode = "selection";
      notifyDock("selection", isCheckoutReady, selectedModality);
      errorMessage = err?.message || "Não foi possível conectar ao checkout de cartão da InfinitePay.";
    } finally {
      busy = false;
    }
  }

  function backToSelection() {
    mode = "selection";
    errorMessage = null;
    profileError = null;
    const ready = Boolean(isCheckoutReady || checkoutData?.qrcode_payload || checkoutData?.checkout_url);
    isCheckoutReady = ready;
    notifyDock("selection", ready, selectedModality);
  }
</script>

<div class="w-full max-w-3xl mx-auto p-4 sm:p-6 text-white pb-24">
  {#if mode === "selection"}
    <!-- Cabeçalho & Aleta Conforme supletivo.net.br / Pricing.astro -->
    <div class="text-center mb-8 space-y-3">
      <!-- Aleta de Destaque com Cores Fortes -->
      <div class="card-aleta">
        <div class="aleta-flag">
          <span class="aleta-dot" aria-hidden="true"></span>
          <span class="aleta-text">CONDIÇÃO PROMOCIONAL ATIVA · LINK VERIFICADO</span>
        </div>
      </div>

      <h1 class="text-2xl sm:text-4xl font-display tracking-tight text-white">
        Conclua sua matrícula para liberar as aulas
      </h1>
      <p class="text-xs sm:text-sm text-white/70 max-w-lg mx-auto">
        Escolha abaixo como prefere realizar o pagamento único da sua formação do Ensino Médio.
      </p>

      {#if discountBadge}
        <div class="inline-block mt-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 shadow-sm">
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

    <!-- 2 Cards de Escolha de Modalidade -->
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

          <ul class="text-xs text-white/70 space-y-2.5 mt-4 text-left">
            <li class="flex items-center gap-2">
              <span class="text-emerald-400 font-bold">✓</span>
              <span>QR Code e código copia-e-cola na hora</span>
            </li>
            <li class="flex items-center gap-2">
              <span class="text-emerald-400 font-bold">✓</span>
              <span>Confirmação em menos de 10 segundos</span>
            </li>
            <li class="flex items-center gap-2">
              <span class="text-emerald-400 font-bold">✓</span>
              <span>Acesso imediato à plataforma de aulas</span>
            </li>
          </ul>
        </div>

        <div class="mt-8 pt-4 border-t border-white/10">
          <button
            type="button"
            onclick={selectPix}
            disabled={busy}
            class="w-full py-3.5 rounded-full bg-[var(--yellow)] text-[var(--ink)] font-bold text-sm uppercase tracking-wide hover:opacity-90 active:scale-[0.98] transition-all shadow-lg cursor-pointer disabled:opacity-50"
          >
            {busy && selectedModality === "pix" ? "Conectando ao PIX..." : "Pagar com PIX Oficial →"}
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

          <ul class="text-xs text-white/70 space-y-2.5 mt-4 text-left">
            <li class="flex items-center gap-2">
              <span class="text-white/60 font-bold">✓</span>
              <span>Pagamento seguro via InfinitePay</span>
            </li>
            <li class="flex items-center gap-2">
              <span class="text-white/60 font-bold">✓</span>
              <span>Liberação rápida após confirmação</span>
            </li>
            <li class="flex items-center gap-2">
              <span class="text-white/60 font-bold">✓</span>
              <span>Certificado válido pelo MEC incluso</span>
            </li>
          </ul>
        </div>

        <div class="mt-8 pt-4 border-t border-white/10">
          <button
            type="button"
            onclick={selectCredit}
            disabled={busy}
            class="w-full py-3.5 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 text-white text-sm font-bold uppercase tracking-wide cursor-pointer transition-colors disabled:opacity-50"
          >
            {busy && selectedModality === "credit_card" ? "Abrindo InfinitePay..." : "Pagar no Cartão (InfinitePay) ↗"}
          </button>
        </div>
      </div>
    </div>

    <!-- Tríade de Confiança Decisória de supletivo.net.br -->
    <ul class="trust-triad">
      <li>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" stroke="var(--green, #00734d)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span><strong>Certificado Oficial</strong> autorizado pelo CEE e amparado pela LDB, com publicação no Diário Oficial</span>
      </li>
      <li>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" stroke="var(--green, #00734d)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span><strong>Validade Nacional</strong> aceita em faculdades, concursos públicos e CNH</span>
      </li>
      <li>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" stroke="var(--green, #00734d)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span><strong>Garantia de 7 Dias:</strong> cancelou, devolvemos 100% do valor (Art. 49 CDC)</span>
      </li>
    </ul>

    <p class="text-center text-xs text-white/50 max-w-md mx-auto mt-4">
      Material didático incluso · Sem mensalidades surpresa · Início imediato pelo celular
    </p>

  {:else if mode === "preparing"}
    <!-- Loop de Preparação & Conexão Segura -->
    <div class="max-w-md mx-auto p-8 rounded-3xl glass-panel border border-white/20 shadow-2xl text-center space-y-6 bg-white/[0.03]">
      <div class="relative size-20 mx-auto flex items-center justify-center">
        <!-- Radar Pulse Animação -->
        <span class="absolute inset-0 rounded-full bg-[var(--yellow)]/20 animate-ping"></span>
        <span class="relative flex size-14 rounded-full bg-[var(--yellow)] text-[var(--ink)] items-center justify-center shadow-lg font-bold text-xl">
          {#if selectedModality === "pix"}
            ⚡
          {:else}
            💳
          {/if}
        </span>
      </div>

      <div class="space-y-2">
        <h2 class="text-xl font-display text-white">{preparingTitle}</h2>
        <p class="text-xs text-white/70">{preparingMessage}</p>
      </div>

      <!-- Barra de Progresso / Stepper -->
      <div class="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
        <div
          class="h-full bg-gradient-to-r from-[var(--green,#00734d)] via-[var(--yellow,#ffc400)] to-emerald-400 transition-all duration-500 rounded-full"
          style={`width: ${preparingStep === 1 ? "35%" : preparingStep === 2 ? "70%" : "100%"}`}
        ></div>
      </div>

      <div class="text-[11px] text-white/50 flex items-center justify-center gap-2">
        <span class="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Conexão criptografada de ponta a ponta</span>
      </div>

      <div class="pt-2">
        <button
          type="button"
          onclick={backToSelection}
          class="text-xs text-white/60 hover:text-white transition-colors cursor-pointer underline underline-offset-4"
        >
          Cancelar e voltar
        </button>
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
    <!-- Checkout PIX Nativo (Fase 2) -->
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

<style>
  /* Aleta de Alerta no Card — Estilo idêntico ao supletivo.net.br / Pricing.astro */
  .card-aleta {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 0.75rem;
    position: relative;
    z-index: 10;
  }

  .aleta-flag {
    display: inline-flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.5rem 1.25rem;
    background: linear-gradient(90deg, #7f1d1d 0%, var(--danger, #b91c1c) 50%, #7f1d1d 100%);
    border: 1.8px solid var(--yellow, #ffc400);
    border-radius: 9999px;
    box-shadow:
      0 4px 24px rgba(185, 28, 28, 0.45),
      inset 0 1px 0 rgba(255, 255, 255, 0.4);
    color: #ffffff;
    font-size: clamp(0.72rem, 2.2vw, 0.82rem);
    font-weight: 900;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }

  .aleta-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--yellow, #ffc400);
    box-shadow: 0 0 10px var(--yellow, #ffc400), 0 0 18px var(--yellow, #ffc400);
    flex-shrink: 0;
    animation: aletaBlink 1.2s infinite ease-in-out;
  }

  @keyframes aletaBlink {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.35;
      transform: scale(0.85);
    }
  }

  /* Tríade de Confiança Decisória */
  .trust-triad {
    list-style: none;
    padding: 0;
    margin: 2rem auto 1rem;
    max-width: 34rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    text-align: left;
  }

  .trust-triad li {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    font-size: 0.84rem;
    line-height: 1.4;
    color: var(--muted-on-dark, #b9c3db);
  }

  .trust-triad li svg {
    width: 1.15rem;
    height: 1.15rem;
    flex: none;
    margin-top: 0.15rem;
    color: var(--green, #00734d);
  }

  .trust-triad li strong {
    color: #ffffff;
  }
</style>
