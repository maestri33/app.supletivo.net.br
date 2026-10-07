<script lang="ts">
  import { onMount } from "svelte";
  import { fade, fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { getSession } from "@/lib/session";
  import {
    setLeadCheckout,
    getLeadCheckoutUrl,
    getLeadMe,
    confirmIdentity,
    setLeadEmail,
    fetchPricing,
    ApiError,
    type CheckoutOut,
    type Pricing,
  } from "@/lib/api";
  import { setLeadCheckoutReadyState } from "@/components/interactive/dock";
  import PixCheckout from "./PixCheckout.svelte";
  import PixIcon from "@/components/icons/PixIcon.svelte";
  import CreditCardIcon from "@/components/icons/CreditCardIcon.svelte";
  import MecGuillocheSeal from "@/components/icons/MecGuillocheSeal.svelte";
  import WarrantyShieldSeal from "@/components/icons/WarrantyShieldSeal.svelte";
  import BankTlsSeal from "@/components/icons/BankTlsSeal.svelte";

  interface Props {
    initialPhase?: "selection" | "checkout";
  }

  let { initialPhase = "selection" }: Props = $props();

  // Fases do Paywall:
  // 1. "selection": Escolha da modalidade (Fase 1 - Botão 1 do Dock ativo)
  // 2. "preparing": Loop de espera/carregamento até o ambiente de checkout estar pronto
  // 3. "pix": Checkout nativo com QR Code e Copia-e-Cola do Asaas (Fase 2 - Botão 2 liberado e ativo)
  // 4. "profile": Completação de CPF/Email caso o perfil esteja incompleto
  // 5. "card_waiting": Espera de compensação após retorno do gateway externo InfinitePay
  type PaywallMode = "selection" | "preparing" | "pix" | "profile" | "card_waiting";

  let mode = $state<PaywallMode>(initialPhase === "checkout" ? "pix" : "selection");
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

  // Valores dinâmicos da plataforma (com fallback de resiliência)
  let livePricing = $state<Pricing | null>(null);
  let hasRef = $state(false);
  let pixPrice = $derived.by(() => {
    if (livePricing) {
      const p = hasRef && livePricing.promo_pix ? livePricing.promo_pix : livePricing.pix;
      const num = parseFloat(p);
      if (!isNaN(num) && num > 0) {
        return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      }
    }
    return hasRef ? "R$ 999,00" : "R$ 1.615,00";
  });
  let creditPrice = $derived.by(() => {
    if (livePricing) {
      const card = hasRef && livePricing.promo_card ? livePricing.promo_card : livePricing.card;
      if (card) {
        const inst = card.installments || 12;
        const val = parseFloat(card.installment);
        if (!isNaN(val) && val > 0) {
          return `${inst}x de ${val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`;
        }
      }
    }
    return hasRef ? "12x de R$ 99,00" : "12x de R$ 161,00";
  });
  let discountBadge = $derived(
    hasRef
      ? (livePricing?.promoter_name
          ? `Desconto Especial de Consultor (${livePricing.promoter_name})`
          : "Desconto Especial de Consultor Aplicado")
      : null
  );

  /**
   * Notifica o dock de navegação com os dados de prontidão e fase do wizard.
   */
  function notifyDock(phase: "selection" | "checkout", ready: boolean, modality?: "pix" | "credit_card" | null) {
    if (typeof window !== "undefined") {
      setLeadCheckoutReadyState(ready);
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
    const refCode = session?.ref || null;
    if (refCode) {
      hasRef = true;
    }

    fetchPricing(refCode)
      .then((data) => {
        if (data && !livePricing) livePricing = data;
      })
      .catch(() => {
        // mantém fallbacks
      });

    // Inicialmente o checkout NÃO está pronto, botão 2 do dock permanece desabilitado
    notifyDock("selection", false, null);

    // Verifica se o aluno está retornando do checkout externo da InfinitePay
    const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const isReturningFromCard =
      typeof window !== "undefined" &&
      (localStorage.getItem("supletivo_pending_card_checkout") === "true" ||
        urlParams?.has("order_nsu") ||
        urlParams?.has("payment_return") ||
        urlParams?.get("from") === "infinitepay" ||
        document.referrer.includes("infinitepay.io"));

    if (isReturningFromCard) {
      mode = "preparing";
      selectedModality = "credit_card";
      isCheckoutReady = true;
      preparingStep = 2;
      preparingTitle = "Validando confirmação do pagamento...";
      preparingMessage = "Detectamos seu retorno do checkout seguro. Consultando autorização na InfinitePay...";
      notifyDock("checkout", true, "credit_card");

      let checkAttempts = 0;
      const maxCheckAttempts = 6;
      const checkInterval = setInterval(async () => {
        checkAttempts++;
        try {
          const lead = await getLeadMe();
          if (lead && (lead.checkout?.is_paid || lead.status === "paid")) {
            clearInterval(checkInterval);
            if (typeof localStorage !== "undefined") {
              localStorage.removeItem("supletivo_pending_card_checkout");
              localStorage.removeItem("supletivo_card_checkout_url");
            }
            preparingStep = 3;
            preparingMessage = "Pagamento confirmado! Abrindo seu ambiente de matrícula...";
            await new Promise((r) => setTimeout(r, 500));
            window.location.href = "/student/enrollment?payment=confirmed";
            return;
          }
        } catch (err: unknown) {
          console.debug("[StudentLockedPaywall] Verificando retorno de cartão:", err);
        }

        if (checkAttempts >= maxCheckAttempts) {
          clearInterval(checkInterval);
          mode = "card_waiting";
        }
      }, 1500);
    }

    // Checa proativamente se já existe um checkout emitido no backend
    getLeadMe()
      .then((lead) => {
        if (lead?.pricing) {
          livePricing = lead.pricing;
          hasRef = Boolean(lead.pricing.has_discount);
        }
        if (lead && (lead.checkout?.is_paid || lead.status === "paid")) {
          const redirectUrl = isReturningFromCard
            ? "/student/enrollment?payment=confirmed&provider=infinitepay"
            : "/student/enrollment?payment=confirmed";
          window.location.href = redirectUrl;
          return;
        }
        if (lead?.checkout && !isReturningFromCard) {
          const chk = lead.checkout;
          const isCheckoutRoute =
            initialPhase === "checkout" ||
            (typeof window !== "undefined" && window.location.pathname.endsWith("/checkout"));

          if (chk.payment_method === "pix" && (chk.qrcode_payload || chk.qrcode_image)) {
            checkoutData = chk;
            const targetUrl = chk.checkout_url || chk.url || chk.short_url || "";
            const match = targetUrl.match(/(?:pix|lead\/checkout)\/([^/?]+)/);
            pixToken = match ? match[1] : (targetUrl ? "active" : "default");
            isCheckoutReady = true;
            selectedModality = "pix";
            if (isCheckoutRoute) {
              mode = "pix";
              notifyDock("checkout", true, "pix");
            } else {
              notifyDock("selection", true, "pix");
            }
          } else if (chk.payment_method === "credit_card") {
            checkoutData = chk;
            isCheckoutReady = true;
            selectedModality = "credit_card";
            const directUrl = chk.checkout_url || chk.url || chk.short_url;
            if (isCheckoutRoute && directUrl) {
              window.location.href = directUrl;
            } else {
              notifyDock("selection", true, "credit_card");
            }
          }
        }
      })
      .catch((err: unknown) => {
        console.debug("[StudentLockedPaywall] Checagem de lead inicial:", err);
      });

    // Escuta comandos acionados diretamente nos botões do Dock Wizard
    const handleWizardStep = (e: Event) => {
      const customEvent = e as CustomEvent<{ step: "selection" | "checkout" }>;
      const step = customEvent.detail?.step;
      if (step === "selection") {
        backToSelection();
      } else if (step === "checkout" && isCheckoutReady) {
        if (selectedModality === "pix" && checkoutData) {
          mode = "pix";
          notifyDock("checkout", true, "pix");
        } else if (selectedModality === "credit_card") {
          const directUrl =
            checkoutData?.checkout_url ||
            (typeof localStorage !== "undefined" ? localStorage.getItem("supletivo_card_checkout_url") : null);
          if (directUrl && mode !== "card_waiting") {
            window.location.href = directUrl;
          } else {
            mode = "card_waiting";
            notifyDock("checkout", true, "credit_card");
          }
        }
      }
    };

    window.addEventListener("supletivo:lead-wizard-step", handleWizardStep);

    // Polling ativo para detecção imediata de confirmação do pagamento
    const pollInterval = setInterval(async () => {
      try {
        const lead = await getLeadMe();
        if (lead && (lead.checkout?.is_paid || lead.status === "paid")) {
          clearInterval(pollInterval);
          if (typeof localStorage !== "undefined") {
            localStorage.removeItem("supletivo_pending_card_checkout");
            localStorage.removeItem("supletivo_card_checkout_url");
          }
          // Redireciona imediatamente para o novo ambiente do estudante: Fase de Matrícula
          window.location.href = "/student/enrollment?payment=confirmed";
        }
      } catch (err: unknown) {
        console.debug("[StudentLockedPaywall] Polling de status do lead:", err);
      }
    }, 3500);

    return () => {
      window.removeEventListener("supletivo:lead-wizard-step", handleWizardStep);
      clearInterval(pollInterval);
    };
  });

  function handleProfileIncomplete(method: "pix" | "credit_card", extra?: Record<string, unknown>) {
    pendingPaymentMethod = method;
    const rawMissing = extra?.missing_fields;
    missingFields = Array.isArray(rawMissing) ? (rawMissing as string[]) : ["cpf", "email"];
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar seus dados cadastrais.";
      profileError = msg;
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
        const match = targetUrl.match(/(?:pix|lead\/checkout)\/([^/?]+)/);
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
            const match = targetUrl.match(/(?:pix|lead\/checkout)\/([^/?]+)/);
            pixToken = match ? match[1] : "default";

            preparingStep = 3;
            preparingMessage = "Pronto! Abrindo seu checkout PIX...";
            await new Promise((resolve) => setTimeout(resolve, 400));
            isCheckoutReady = true;
            mode = "pix";
            notifyDock("checkout", true, "pix");
            return;
          }
        } catch (err: unknown) {
          console.debug("[StudentLockedPaywall] Aguardando QR Code PIX:", err);
        }
      }

      // Fallback: se timeout do polling, tenta URL direta
      try {
        const checkUrl = await getLeadCheckoutUrl();
        const match = checkUrl.url.match(/(?:pix|lead\/checkout)\/([^/?]+)/);
        if (match) {
          pixToken = match[1];
          isCheckoutReady = true;
          mode = "pix";
          notifyDock("checkout", true, "pix");
          return;
        }
      } catch (err: unknown) {
        console.debug("[StudentLockedPaywall] Fallback checkout url:", err);
      }

      throw new Error("O gateway bancário demorou para responder. Por favor, tente novamente.");
    } catch (err: unknown) {
      if (err instanceof ApiError && err.code === "PROFILE_INCOMPLETE") {
        handleProfileIncomplete("pix", err.extra);
        return;
      }
      mode = "selection";
      notifyDock("selection", isCheckoutReady, selectedModality);
      const msg = err instanceof Error ? err.message : "Não foi possível gerar a cobrança PIX no momento.";
      errorMessage = msg;
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
      checkoutData = res;

      // 1. Link direto oficial do gateway InfinitePay
      const directUrl = res.checkout_url || res.url || res.short_url;
      if (directUrl) {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("supletivo_pending_card_checkout", "true");
          localStorage.setItem("supletivo_card_checkout_url", directUrl);
        }
        isCheckoutReady = true;
        notifyDock("checkout", true, "credit_card");
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
            if (typeof localStorage !== "undefined") {
              localStorage.setItem("supletivo_pending_card_checkout", "true");
              localStorage.setItem("supletivo_card_checkout_url", targetUrl);
            }
            isCheckoutReady = true;
            notifyDock("checkout", true, "credit_card");
            preparingStep = 3;
            preparingMessage = "Ambiente seguro pronto! Redirecionando para a InfinitePay...";
            await new Promise((resolve) => setTimeout(resolve, 400));
            window.location.href = targetUrl;
            return;
          }
        } catch (err: unknown) {
          console.debug("[StudentLockedPaywall] Aguardando URL InfinitePay:", err);
        }
      }

      // Fallback para getLeadCheckoutUrl()
      const checkUrl = await getLeadCheckoutUrl();
      if (checkUrl.url) {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("supletivo_pending_card_checkout", "true");
          localStorage.setItem("supletivo_card_checkout_url", checkUrl.url);
        }
        isCheckoutReady = true;
        notifyDock("checkout", true, "credit_card");
        preparingStep = 3;
        preparingMessage = "Redirecionando para a InfinitePay...";
        await new Promise((resolve) => setTimeout(resolve, 400));
        window.location.href = checkUrl.url;
        return;
      }

      throw new Error("Não recebemos o link de cartão do gateway. Tente novamente.");
    } catch (err: unknown) {
      if (err instanceof ApiError && err.code === "PROFILE_INCOMPLETE") {
        handleProfileIncomplete("credit_card", err.extra);
        return;
      }
      mode = "selection";
      notifyDock("selection", isCheckoutReady, selectedModality);
      const msg = err instanceof Error ? err.message : "Não foi possível conectar ao checkout de cartão da InfinitePay.";
      errorMessage = msg;
    } finally {
      busy = false;
    }
  }

  async function checkCardPaymentStatus() {
    busy = true;
    errorMessage = null;
    try {
      const lead = await getLeadMe();
      if (lead && (lead.checkout?.is_paid || lead.status === "paid")) {
        if (typeof localStorage !== "undefined") {
          localStorage.removeItem("supletivo_pending_card_checkout");
          localStorage.removeItem("supletivo_card_checkout_url");
        }
        window.location.href = "/student/enrollment?payment=confirmed";
        return;
      }
      errorMessage = "Pagamento ainda não confirmado pela operadora do cartão. Aguarde alguns instantes e tente novamente.";
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Não foi possível consultar o status do pagamento no momento.";
      errorMessage = msg;
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
    <div class="text-center mb-8 space-y-3" in:fly={{ y: 16, duration: 280, easing: cubicOut }} out:fade={{ duration: 150 }}>
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
        <div class="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-bold border border-emerald-500/30 shadow-sm">
          <span class="text-emerald-400">★</span>
          <span>{discountBadge}</span>
        </div>
      {/if}
    </div>

    {#if errorMessage}
      <div class="mb-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-200 text-center flex items-center justify-center gap-2">
        <svg class="size-4 shrink-0 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{errorMessage}</span>
      </div>
    {/if}

    <!-- 2 Cards de Escolha de Modalidade com Física Zero-G -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Card PIX (Asaas Oficial com Destaque Dourado/Esmeralda) -->
      <div class="payment-card-zero-g payment-card-pix p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group">
        <div class="absolute -right-8 -top-8 size-28 bg-[var(--yellow)]/10 rounded-full blur-2xl pointer-events-none"></div>
        <div>
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--yellow)] text-[var(--ink)] text-[10px] font-black uppercase tracking-wider mb-3">
            <PixIcon class="size-3 text-[var(--ink)]" />
            <span>★ RECOMENDADO · LIBERAÇÃO IMEDIATA</span>
          </div>
          <h2 class="text-xl sm:text-2xl font-display text-white flex items-center gap-2">
            <span>Pagamento via PIX</span>
          </h2>
          <p class="text-xs text-white/70 mt-1">À vista com o maior desconto promocional garantido.</p>

          <div class="mt-6 mb-4">
            <span class="text-3xl sm:text-4xl font-display text-emerald-400 font-black tracking-tight">{pixPrice}</span>
            <span class="text-xs text-white/50 block mt-1">taxa única sem mensalidades futuras</span>
          </div>

          <ul class="text-xs text-white/80 space-y-2.5 mt-4 text-left">
            <li class="flex items-center gap-2.5">
              <span class="flex size-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold">✓</span>
              <span>QR Code e código copia-e-cola gerados na hora</span>
            </li>
            <li class="flex items-center gap-2.5">
              <span class="flex size-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold">✓</span>
              <span>Confirmação instantânea em menos de 10 segundos</span>
            </li>
            <li class="flex items-center gap-2.5">
              <span class="flex size-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold">✓</span>
              <span>Acesso imediato ao ambiente oficial de matrícula</span>
            </li>
          </ul>
        </div>

        <div class="mt-8 pt-4 border-t border-white/10">
          <button
            type="button"
            onclick={selectPix}
            disabled={busy}
            class="btn w-full min-h-[48px] py-3.5 rounded-full bg-[var(--yellow)] text-[var(--ink)] font-extrabold text-sm uppercase tracking-wider shadow-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <PixIcon class="size-4 text-[var(--ink)]" />
            <span>{busy && selectedModality === "pix" ? "Conectando ao PIX..." : "Pagar com PIX Oficial →"}</span>
          </button>
        </div>
      </div>

      <!-- Card Cartão de Crédito (InfinitePay Oficial) -->
      <div class="payment-card-zero-g payment-card-card p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group">
        <div>
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/90 text-[10px] font-bold uppercase tracking-wider mb-3">
            <CreditCardIcon class="size-3 text-white" />
            <span>PARCELAMENTO EM ATÉ 12X</span>
          </div>
          <h2 class="text-xl sm:text-2xl font-display text-white">Cartão de Crédito</h2>
          <p class="text-xs text-white/70 mt-1">Parcelamento flexível em ambiente seguro InfinitePay.</p>

          <div class="mt-6 mb-4">
            <span class="text-3xl sm:text-4xl font-display text-white font-bold tracking-tight">{creditPrice}</span>
            <span class="text-xs text-white/50 block mt-1">ou parcelado em até 12x no cartão</span>
          </div>

          <ul class="text-xs text-white/80 space-y-2.5 mt-4 text-left">
            <li class="flex items-center gap-2.5">
              <span class="flex size-4 items-center justify-center rounded-full bg-white/10 text-white/80 text-[11px] font-bold">✓</span>
              <span>Pagamento seguro via gateway InfinitePay</span>
            </li>
            <li class="flex items-center gap-2.5">
              <span class="flex size-4 items-center justify-center rounded-full bg-white/10 text-white/80 text-[11px] font-bold">✓</span>
              <span>Sem cobrança de mensalidades surpresa</span>
            </li>
            <li class="flex items-center gap-2.5">
              <span class="flex size-4 items-center justify-center rounded-full bg-white/10 text-white/80 text-[11px] font-bold">✓</span>
              <span>Certificado reconhecido pelo MEC incluso</span>
            </li>
          </ul>
        </div>

        <div class="mt-8 pt-4 border-t border-white/10">
          <button
            type="button"
            onclick={selectCredit}
            disabled={busy}
            class="w-full min-h-[48px] py-3.5 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 active:scale-[0.985] text-white text-sm font-bold uppercase tracking-wider cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CreditCardIcon class="size-4 text-white" />
            <span>{busy && selectedModality === "credit_card" ? "Abrindo InfinitePay..." : "Pagar no Cartão (InfinitePay) ↗"}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Tríade de Confiança Decisória de supletivo.net.br com Selos Vetoriais -->
    <div class="mt-8 pt-4 border-t border-white/10">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
        <div class="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
          <div class="shrink-0 size-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div class="text-xs">
            <strong class="text-white block font-bold">Certificado Oficial</strong>
            <span class="text-white/60 leading-tight block mt-0.5">Amparado pela LDB (Lei 9.394/96) com publicação no Diário Oficial.</span>
          </div>
        </div>

        <div class="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
          <div class="shrink-0 size-8 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400">
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <div class="text-xs">
            <strong class="text-white block font-bold">Validade Nacional</strong>
            <span class="text-white/60 leading-tight block mt-0.5">Aceito em faculdades, concursos públicos, vestibulares e CNH.</span>
          </div>
        </div>

        <div class="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
          <div class="shrink-0 size-8 rounded-xl bg-[var(--yellow)]/15 flex items-center justify-center text-[var(--yellow)]">
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="text-xs">
            <strong class="text-white block font-bold">Garantia 7 Dias</strong>
            <span class="text-white/60 leading-tight block mt-0.5">Devolução de 100% do valor caso desista (Art. 49 do CDC).</span>
          </div>
        </div>
      </div>

      <div class="text-center mt-6">
        <a
          href="https://wa.me/5543996648750?text=Ol%C3%A1%2C%20estou%20na%20tela%20de%20escolha%20de%20pagamento%20do%20Supletivo%20e%20tenho%20d%C3%BAvidas."
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 text-white/70 text-xs font-medium hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
        >
          <svg class="size-3.5 fill-emerald-400" viewBox="0 0 24 24">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2Z"/>
          </svg>
          <span>Dúvidas sobre o curso ou valores? Fale conosco no WhatsApp</span>
        </a>
      </div>
    </div>

  {:else if mode === "preparing"}
    <!-- Loop de Preparação & Conexão Segura com Vetores -->
    <div class="max-w-md mx-auto p-8 rounded-3xl glass-panel border border-white/20 shadow-2xl text-center space-y-6 bg-white/[0.03]" in:fade={{ duration: 200 }} out:fade={{ duration: 150 }}>
      <div class="relative size-20 mx-auto flex items-center justify-center">
        <!-- Radar Pulse Animação -->
        <span class="absolute inset-0 rounded-full bg-[var(--yellow)]/20 animate-ping"></span>
        <span class="relative flex size-14 rounded-full bg-[var(--yellow)] text-[var(--ink)] items-center justify-center shadow-lg font-bold">
          {#if selectedModality === "pix"}
            <PixIcon class="size-7 text-[var(--ink)]" />
          {:else}
            <CreditCardIcon class="size-7 text-[var(--ink)]" />
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

  {:else if mode === "card_waiting"}
    <!-- Retorno da InfinitePay / Aguardando Compensação -->
    <div class="max-w-md mx-auto p-6 sm:p-8 rounded-3xl glass-panel border border-white/20 shadow-2xl text-center space-y-6 bg-white/[0.03]">
      <div class="inline-flex size-14 rounded-full bg-emerald-500/20 text-emerald-400 items-center justify-center text-2xl border border-emerald-500/40">
        💳
      </div>

      <div class="space-y-2">
        <span class="inline-block px-3 py-1 rounded-full bg-white/10 text-white/80 text-[10px] font-bold uppercase tracking-wider">
          Retorno do Gateway Seguro
        </span>
        <h2 class="text-xl font-display text-white">Você concluiu seu pagamento?</h2>
        <p class="text-xs text-white/70 leading-relaxed">
          Se você concluiu o pagamento na página da InfinitePay, a operadora processa a autorização em instantes. Clique abaixo para checar a liberação da sua matrícula.
        </p>
      </div>

      {#if errorMessage}
        <div class="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-xs text-amber-200 text-center">
          {errorMessage}
        </div>
      {/if}

      <div class="space-y-3 pt-2">
        <button
          type="button"
          onclick={checkCardPaymentStatus}
          disabled={busy}
          class="btn w-full py-3.5 rounded-full bg-[var(--yellow)] text-[var(--ink)] font-bold text-xs uppercase tracking-wide hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-lg disabled:opacity-50"
        >
          {busy ? "Verificando com o Banco..." : "✓ Já paguei, Verificar Liberação"}
        </button>

        {#if (checkoutData?.checkout_url || (typeof localStorage !== "undefined" && localStorage.getItem("supletivo_card_checkout_url")))}
          <a
            href={checkoutData?.checkout_url || localStorage.getItem("supletivo_card_checkout_url")}
            target="_blank"
            rel="noopener noreferrer"
            class="block w-full py-3 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-colors"
          >
            Reabrir Página da InfinitePay ↗
          </a>
        {/if}

        <button
          type="button"
          onclick={backToSelection}
          class="w-full text-center text-xs text-white/50 hover:text-white transition-colors pt-1 cursor-pointer"
        >
          Escolher outra forma de pagamento
        </button>
      </div>
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
