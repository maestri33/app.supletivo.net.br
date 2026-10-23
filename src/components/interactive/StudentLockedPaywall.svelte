<script lang="ts">
  import { onMount } from "svelte";
  import { fade, fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import {
    setLeadCheckout, getLeadMe, confirmLeadCardPayment, confirmIdentity, setLeadEmail,
    ApiError, getErrorMessage, type CheckoutOut, type LeadMe, type CardPaymentReferences,
  } from "@/lib/api";
  import { SUPPORT_WHATSAPP_NUMBER } from "@/lib/config";
  import type { Pricing } from "@/lib/payment";
  import { setLeadCheckoutReadyState } from "@/components/interactive/dock";
  import PixCheckout from "./PixCheckout.svelte";
  import PixIcon from "@/components/icons/PixIcon.svelte";
  import CreditCardIcon from "@/components/icons/CreditCardIcon.svelte";

  interface Props { initialPhase?: "selection" | "checkout"; }
  let { initialPhase = "selection" }: Props = $props();
  type PaywallMode = "selection" | "preparing" | "pix" | "profile" | "card_waiting";
  type PaymentMethod = "pix" | "credit_card";

  let mode = $state<PaywallMode>("selection");
  let busy = $state(false);
  let querying = $state(false);
  let errorMessage = $state<string | null>(null);
  let recoveryAction = $state<"retry" | "login" | "environment">("retry");
  let isCheckoutReady = $state(false);
  let selectedModality = $state<PaymentMethod | null>(null);
  let checkoutData = $state<CheckoutOut | null>(null);
  let preparingTitle = $state("Preparando sua cobrança...");
  let preparingMessage = $state("Consultando sua proposta no servidor...");
  let preparingStep = $state(1);
  let pendingPaymentMethod = $state<PaymentMethod>("pix");
  let missingFields = $state<string[]>([]);
  let profileCpf = $state("");
  let profileEmail = $state("");
  let profileBusy = $state(false);
  let profileError = $state<string | null>(null);
  let livePricing = $state<Pricing | null>(null);
  let leadSnapshot = $state<LeadMe | null>(null);
  let hasRef = $state(false);
  let lastCheckedAt = $state<string | null>(null);
  let returnReferences: CardPaymentReferences | null = null;
  let active = true;

  let quotedCard = $derived(hasRef && livePricing?.promo_card ? livePricing.promo_card : livePricing?.card);
  let pricingAvailable = $derived(Boolean(leadSnapshot && livePricing &&
    Number(hasRef && livePricing.promo_pix ? livePricing.promo_pix : livePricing.pix) > 0 &&
    Number(quotedCard?.total) > 0));
  let paymentStage = $derived(leadSnapshot?.payment_status?.stage ??
    (leadSnapshot?.checkout?.is_paid || leadSnapshot?.status === "paid" ? "completed" : "pending"));
  let paymentTitle = $derived(paymentStage === "provider_confirmed"
    ? "Pagamento recebido; finalizando matrícula"
    : paymentStage === "review" ? "Pagamento precisa de conferência"
    : paymentStage === "completed" ? "Pagamento confirmado" : "Aguardando confirmação do pagamento");
  let canPay = $derived(pricingAvailable && paymentStage === "pending" && recoveryAction === "retry" && !errorMessage);

  function formatMoney(value: string | undefined): string {
    const amount = Number(value);
    return Number.isFinite(amount) && amount > 0
      ? amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "Preço indisponível";
  }
  let pixPrice = $derived(formatMoney(hasRef && livePricing?.promo_pix ? livePricing.promo_pix : livePricing?.pix));
  let creditPrice = $derived(formatMoney(quotedCard?.total));
  let discountBadge = $derived(hasRef ? (livePricing?.promoter_name
    ? "Desconto de Consultor (" + livePricing.promoter_name + ")" : "Desconto de Consultor Aplicado") : null);

  function notifyDock(phase: "selection" | "checkout", ready: boolean, modality = selectedModality) {
    setLeadCheckoutReadyState(ready);
    window.dispatchEvent(new CustomEvent("supletivo:lead-checkout-status", { detail: { ready, phase, modality } }));
    window.dispatchEvent(new CustomEvent("supletivo:lead-wizard-phase", { detail: { phase } }));
  }

  function checkoutUrl(checkout: CheckoutOut | null): string | null {
    return checkout?.checkout_url || checkout?.url || checkout?.short_url || null;
  }

  function restoreCheckout(checkout: CheckoutOut | null) {
    checkoutData = checkout;
    selectedModality = checkout?.payment_method === "pix" || checkout?.payment_method === "credit_card"
      ? checkout.payment_method : null;
    isCheckoutReady = Boolean(selectedModality &&
      (checkout?.qrcode_payload || checkout?.qrcode_image || checkoutUrl(checkout)));
  }

  function applyLead(lead: LeadMe) {
    leadSnapshot = lead;
    livePricing = lead.pricing ?? null;
    hasRef = Boolean(lead.pricing?.has_discount);
    restoreCheckout(lead.checkout ?? null);
    lastCheckedAt = new Date().toLocaleTimeString("pt-BR");
    errorMessage = null;
    recoveryAction = "retry";
    const stage = lead.payment_status?.stage ?? (lead.checkout?.is_paid || lead.status === "paid" ? "completed" : "pending");
    if (stage !== "pending") {
      mode = "card_waiting";
      const destination = lead.payment_status?.continuation_url;
      if (stage === "completed" && destination && /^\/student\/(enrollment|active|veteran)(?:[/?#]|$)/.test(destination)) {
        window.location.href = destination;
        return;
      }
    }
    notifyDock(mode === "selection" || mode === "profile" ? "selection" : "checkout", isCheckoutReady);
  }

  function showError(error: unknown) {
    if (error instanceof ApiError && error.status === 401) {
      recoveryAction = "login";
      errorMessage = "Sua sessão expirou. Entre novamente para consultar a proposta e o pagamento.";
    } else if (error instanceof ApiError && error.status === 403) {
      recoveryAction = "environment";
      errorMessage = "Esta conta não tem acesso à proposta de aluno. Abra o ambiente autorizado da sua conta.";
    } else if (error instanceof ApiError && error.status === 404) {
      recoveryAction = "environment";
      errorMessage = "Não há uma proposta de matrícula disponível para esta conta. Abra seu ambiente ou fale com o atendimento.";
    } else {
      recoveryAction = "retry";
      const message = error instanceof Error && !(error instanceof TypeError) && error.name !== "AbortError"
        ? error.message : getErrorMessage(error);
      errorMessage = message + " Se já pagou, aguarde a confirmação e evite pagar novamente.";
    }
  }

  async function refreshLead(verifyReturn = false) {
    if (querying || !active) return;
    querying = true;
    try {
      const lead = verifyReturn && returnReferences
        ? await confirmLeadCardPayment(returnReferences) : await getLeadMe();
      if (active) applyLead(lead);
    } catch (error) {
      if (active) showError(error);
    } finally {
      querying = false;
    }
  }

  function openCheckout() {
    if (!isCheckoutReady || paymentStage !== "pending") return;
    if (selectedModality === "pix") {
      mode = "pix";
      notifyDock("checkout", true);
    } else if (selectedModality === "credit_card") {
      mode = "card_waiting";
      notifyDock("checkout", true);
    }
  }

  onMount(() => {
    notifyDock("selection", false, null);
    // Old global browser hints are retired. The authenticated proposal decides the provider.
    localStorage.removeItem("supletivo_pending_card_checkout");
    localStorage.removeItem("supletivo_card_checkout_url");
    const params = new URLSearchParams(window.location.search);
    const order = params.get("order_nsu");
    const transaction = params.get("transaction_nsu");
    const slug = params.get("slug");
    if (order && transaction && slug) {
      returnReferences = { order_nsu: order, transaction_nsu: transaction, slug };
      mode = "card_waiting";
    }
    void refreshLead(Boolean(returnReferences)).then(() => {
      if (active && initialPhase === "checkout" && mode === "selection") openCheckout();
    });

    const handleWizardStep = (event: Event) => {
      if (busy) return;
      const step = (event as CustomEvent<{ step: "selection" | "checkout" }>).detail?.step;
      if (step === "selection") backToSelection();
      else if (step === "checkout") openCheckout();
    };
    const handleVisible = () => {
      if (document.visibilityState === "visible" && !busy) void refreshLead();
    };
    window.addEventListener("supletivo:lead-wizard-step", handleWizardStep);
    document.addEventListener("visibilitychange", handleVisible);
    const timer = setInterval(() => {
      if (!busy && document.visibilityState !== "hidden" && recoveryAction === "retry") void refreshLead();
    }, 3500);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("supletivo:lead-wizard-step", handleWizardStep);
      document.removeEventListener("visibilitychange", handleVisible);
    };
  });

  function handleProfileIncomplete(method: PaymentMethod, extra?: Record<string, unknown>) {
    pendingPaymentMethod = method;
    const rawMissing = extra?.missing_fields;
    missingFields = Array.isArray(rawMissing) ? rawMissing as string[] : ["cpf", "email"];
    mode = "profile";
    notifyDock("selection", false, method);
  }

  async function submitProfileCompletion() {
    profileBusy = true;
    profileError = null;
    try {
      if (missingFields.includes("cpf") && profileCpf.trim()) {
        const cleanCpf = profileCpf.replace(/\D/g, "");
        if (cleanCpf.length !== 11) throw new Error("CPF deve conter 11 dígitos numéricos.");
        const identity = await confirmIdentity(cleanCpf);
        if (identity.pending) throw new Error("Seu CPF está em conferência. Tente continuar em instantes.");
      }
      if (missingFields.includes("email") && profileEmail.trim()) {
        if (!profileEmail.includes("@") || !profileEmail.includes(".")) throw new Error("Informe um endereço de e-mail válido.");
        await setLeadEmail(profileEmail.trim());
      }
      await selectPayment(pendingPaymentMethod);
    } catch (error) {
      profileError = error instanceof Error ? error.message : "Erro ao salvar seus dados cadastrais.";
    } finally {
      profileBusy = false;
    }
  }

  async function selectPayment(method: PaymentMethod) {
    if (!canPay || busy) return;
    busy = true;
    errorMessage = null;
    mode = "preparing";
    selectedModality = method;
    preparingStep = 1;
    preparingTitle = method === "pix" ? "Preparando cobrança PIX..." : "Conectando à InfinitePay...";
    preparingMessage = "Retomando ou preparando a cobrança vinculada à sua proposta.";
    notifyDock("selection", false, method);
    try {
      restoreCheckout(await setLeadCheckout(method));
      preparingStep = 2;
      for (let attempt = 0; !isCheckoutReady && attempt < 12; attempt++) {
        preparingMessage = "Aguardando o servidor concluir a emissão. Não é necessário gerar outra cobrança.";
        await new Promise((resolve) => setTimeout(resolve, 1200));
        if (!active) return;
        const lead = await getLeadMe();
        applyLead(lead);
        if (paymentStage !== "pending") return;
      }
      if (!isCheckoutReady) throw new Error("A emissão ainda não foi concluída. Consulte o pagamento novamente antes de tentar pagar.");
      preparingStep = 3;
      if (selectedModality === "pix") {
        mode = "pix";
        notifyDock("checkout", true);
      } else if (selectedModality === "credit_card" && checkoutUrl(checkoutData)) {
        notifyDock("checkout", true);
        window.location.href = checkoutUrl(checkoutData)!;
      } else {
        throw new Error("O servidor não informou um meio de pagamento disponível para esta cobrança.");
      }
    } catch (error) {
      if (error instanceof ApiError && error.code === "PROFILE_INCOMPLETE") {
        handleProfileIncomplete(method, error.extra);
        return;
      }
      mode = "selection";
      notifyDock("selection", isCheckoutReady);
      showError(error);
    } finally {
      busy = false;
    }
  }

  function selectPix() { return selectPayment("pix"); }
  function selectCredit() { return selectPayment("credit_card"); }
  function checkCardPaymentStatus() { return refreshLead(Boolean(returnReferences)); }

  function backToSelection() {
    if (busy || paymentStage !== "pending") return;
    mode = "selection";
    profileError = null;
    notifyDock("selection", isCheckoutReady);
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
          <span class="aleta-text">{hasRef ? "CONDIÇÃO PROMOCIONAL · INDICAÇÃO CONFIRMADA" : "CONDIÇÕES DA SUA PROPOSTA"}</span>
        </div>
      </div>

      <h1 class="text-2xl sm:text-4xl font-display tracking-tight text-white">
        Conclua sua matrícula para acessar a etapa de liberação
      </h1>
      <p class="text-xs sm:text-sm text-white/70 max-w-lg mx-auto">
        Escolha abaixo como prefere realizar o pagamento único da sua formação do Ensino Médio.
      </p>

      {#if leadSnapshot}
        <div id="lead-context" class="mt-5 rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-left">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">Dados da sua proposta</p>
              <p class="mt-1 text-sm font-semibold text-white">{leadSnapshot.customer?.name ?? "Lead em atendimento"}</p>
              <p class="text-xs text-white/60">{leadSnapshot.customer?.phone ?? leadSnapshot.customer?.email ?? "Dados de contato ainda não informados"}</p>
            </div>
            <span class="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/70">{leadSnapshot.status ?? "lead"}</span>
          </div>
          <div class="mt-3 grid gap-2 text-xs text-white/70 sm:grid-cols-2">
            <p><strong class="text-white/90">Promotor:</strong> {String(leadSnapshot.promoter?.name ?? "Não informado")}</p>
            <p><strong class="text-white/90">Polo:</strong> {leadSnapshot.hub?.name ?? "Não informado pelo servidor"}</p>
            {#if leadSnapshot.hub?.coordinator_name}<p><strong class="text-white/90">Coordenador:</strong> {leadSnapshot.hub.coordinator_name}</p>{/if}
            {#if leadSnapshot.customer?.cpf}<p><strong class="text-white/90">CPF:</strong> {leadSnapshot.customer.cpf}</p>{/if}
            {#if leadSnapshot.customer?.email}<p><strong class="text-white/90">E-mail:</strong> {leadSnapshot.customer.email}</p>{/if}
          </div>
          <div class="mt-3 flex flex-wrap gap-2">
            {#if leadSnapshot.promoter.contact_url && /^https:\/\/wa\.me\/\d+(\?.*)?$/.test(leadSnapshot.promoter.contact_url)}<a class="secondary" href={leadSnapshot.promoter.contact_url} target="_blank" rel="noopener noreferrer">Falar com promotor</a>{/if}
            {#if leadSnapshot.hub?.contact_url && /^https:\/\/wa\.me\/\d+(\?.*)?$/.test(leadSnapshot.hub.contact_url)}<a class="secondary" href={leadSnapshot.hub.contact_url} target="_blank" rel="noopener noreferrer">Falar com polo</a>{/if}
          </div>
          <p class="mt-2 text-[11px] text-white/50">Os valores da proposta são calculados pelo servidor e permanecem vinculados a esta cobrança.</p>
        </div>
      {/if}

      {#if discountBadge}
        <div class="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-bold border border-emerald-500/30 shadow-sm">
          <span class="text-emerald-400">★</span>
          <span>{discountBadge}</span>
        </div>
      {/if}
    </div>

    {#if errorMessage}
      <div role="alert" class="mb-6 rounded-3xl border border-[var(--danger)] bg-[var(--danger-bg)] p-5 text-[var(--danger)] shadow-lg sm:p-6">
        <div class="flex items-start gap-4">
          <div class="flex size-11 shrink-0 items-center justify-center rounded-2xl text-[var(--danger)]" aria-hidden="true">
            <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3 2.8 20h18.4L12 3Z" />
              <path d="M12 9v4m0 3h.01" />
            </svg>
          </div>
          <div class="min-w-0 flex-1">
            <h2 class="font-display text-base text-[var(--ink)] sm:text-lg">{recoveryAction === "login" ? "Entre novamente" : recoveryAction === "environment" ? "Proposta indisponível para esta conta" : "Não conseguimos atualizar agora"}</h2>
            <p class="mt-1 text-sm leading-relaxed">{errorMessage}</p>
            {#if recoveryAction === "retry"}
              <button type="button" disabled={querying} class="btn mt-4 inline-flex min-h-12 items-center justify-center px-5 text-sm" onclick={() => void refreshLead()}>{querying ? "Consultando…" : "Consultar proposta novamente"}</button>
            {:else}
              <a href="/" class="btn mt-4 inline-flex min-h-12 items-center justify-center px-5 text-sm">{recoveryAction === "login" ? "Entrar na minha conta" : "Abrir meu ambiente"}</a>
            {/if}
          </div>
        </div>
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
            <span>PIX · CONFIRMAÇÃO PELO SERVIDOR</span>
          </div>
          <h2 class="text-xl sm:text-2xl font-display text-white flex items-center gap-2">
            <span>Pagamento via PIX</span>
          </h2>
          <p class="text-xs text-white/70 mt-1">Valor informado pelo servidor de pagamentos.</p>

          <div class="mt-6 mb-4">
            <span class="text-3xl sm:text-4xl font-display text-emerald-400 font-black tracking-tight">{pixPrice}</span>
            <span class="text-xs text-white/50 block mt-1">taxa única sem mensalidades futuras</span>
          </div>

          <ul class="text-xs text-white/80 space-y-2.5 mt-4 text-left">
            <li class="flex items-center gap-2.5">
              <span class="flex size-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold">✓</span>
              <span>QR Code e código copia-e-cola vinculados à proposta</span>
            </li>
            <li class="flex items-center gap-2.5">
              <span class="flex size-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold">✓</span>
              <span>Confirmação após o retorno do gateway de pagamentos</span>
            </li>
            <li class="flex items-center gap-2.5">
              <span class="flex size-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold">✓</span>
              <span>Matrícula liberada após a conclusão no servidor</span>
            </li>
          </ul>
        </div>

        <div class="mt-8 pt-4 border-t border-white/10">
          <button
            type="button"
            onclick={selectPix}
            disabled={busy || !canPay}
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
            <span>PAGAMENTO NO CARTÃO</span>
          </div>
          <h2 class="text-xl sm:text-2xl font-display text-white">Cartão de Crédito</h2>
          <p class="text-xs text-white/70 mt-1">Condições de pagamento apresentadas pela InfinitePay.</p>

          <div class="mt-6 mb-4">
            <span class="text-3xl sm:text-4xl font-display text-white font-bold tracking-tight">{creditPrice}</span>
            <span class="text-xs text-[var(--muted-on-dark)] block mt-1">Valor base da proposta. Parcelas, taxas e total com acréscimos são informados no checkout da InfinitePay, antes de pagar.</span>
          </div>

          <ul class="text-xs text-white/80 space-y-2.5 mt-4 text-left">
            <li class="flex items-center gap-2.5">
              <span class="flex size-4 items-center justify-center rounded-full bg-white/10 text-white/80 text-[11px] font-bold">✓</span>
              <span>Pagamento seguro via gateway InfinitePay</span>
            </li>
            <li class="flex items-center gap-2.5">
              <span class="flex size-4 items-center justify-center rounded-full bg-white/10 text-white/80 text-[11px] font-bold">✓</span>
              <span>As taxas da operadora são repassadas ao comprador no checkout</span>
            </li>
            <li class="flex items-center gap-2.5">
              <span class="flex size-4 items-center justify-center rounded-full bg-white/10 text-white/80 text-[11px] font-bold">✓</span>
              <span>Certificação emitida pela instituição parceira conforme a documentação vigente</span>
            </li>
          </ul>
        </div>

        <div class="mt-8 pt-4 border-t border-white/10">
          <button
            type="button"
            onclick={selectCredit}
            disabled={busy || !canPay}
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
            <span class="text-white/60 leading-tight block mt-0.5">A instituição parceira informa as regras aplicáveis e os registros após a conclusão.</span>
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
            <span class="text-white/60 leading-tight block mt-0.5">O uso do documento depende das regras da instituição e do órgão que o receber.</span>
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
          href={`https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=Ol%C3%A1%2C%20estou%20na%20tela%20de%20escolha%20de%20pagamento%20do%20Supletivo%20e%20tenho%20d%C3%BAvidas.`}
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
          disabled={busy}
          class="text-xs text-white/60 hover:text-white transition-colors cursor-pointer underline underline-offset-4"
        >
          Voltar às opções
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
              class="w-full px-4 py-2.5 rounded-xl border border-white/15 bg-black/40 text-white text-sm focus:outline-none focus:border-[var(--yellow)] focus-visible:ring-2 focus-visible:ring-[var(--yellow)]/30"
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
              class="w-full px-4 py-2.5 rounded-xl border border-white/15 bg-black/40 text-white text-sm focus:outline-none focus:border-[var(--yellow)] focus-visible:ring-2 focus-visible:ring-[var(--yellow)]/30"
            />
          </div>
        {/if}

        <button
          type="button"
          onclick={submitProfileCompletion}
          disabled={profileBusy}
          class="w-full py-3 rounded-xl bg-[var(--yellow)] text-[var(--ink)] font-bold text-xs uppercase tracking-wide hover:opacity-90 transition-[opacity,transform] duration-200 cursor-pointer disabled:opacity-50 mt-2 touch-manipulation"
        >
          {profileBusy ? "Salvando Dados…" : "Confirmar e Ir para o Pagamento →"}
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

      <PixCheckout token="default" initialData={checkoutData} />
    </div>

  {:else if mode === "card_waiting"}
    <!-- Retorno da InfinitePay / Aguardando Compensação -->
    <div class="max-w-md mx-auto p-6 sm:p-8 rounded-3xl glass-panel border border-white/20 shadow-2xl text-center space-y-6 bg-white/[0.03]">
      <div class="inline-flex size-14 rounded-full bg-emerald-500/20 text-emerald-400 items-center justify-center text-2xl border border-emerald-500/40">
        💳
      </div>

      <div class="space-y-2" role="status">
        <span class="inline-block px-3 py-1 rounded-full bg-white/10 text-white/80 text-[10px] font-bold uppercase tracking-wider">
          Retorno do Gateway Seguro
        </span>
        <h2 class="text-xl font-display text-white">{paymentTitle}</h2>
        <p class="text-xs text-[var(--muted-on-dark)] leading-relaxed">
          {paymentStage === "provider_confirmed" ? "O provedor confirmou o pagamento. Aguarde a conclusão da matrícula; não é necessário pagar novamente."
            : paymentStage === "review" ? "O pagamento precisa ser conferido pelo atendimento. Não faça outro pagamento para esta proposta."
            : paymentStage === "completed" ? "Entre na sua conta para abrir o ambiente autorizado pelo servidor."
            : "O servidor ainda não confirmou o pagamento. Se já pagou, acompanhe a consulta e evite pagar novamente."}
        </p>
        <p class="text-[11px] text-[var(--muted-on-dark)]">Última consulta ao servidor: {lastCheckedAt ?? "ainda não concluída"}</p>
        {#if leadSnapshot?.payment_status?.paid_amount}
          <p class="text-sm text-white">Valor pago confirmado: {formatMoney(leadSnapshot.payment_status.paid_amount)}</p>
        {/if}
        {#if leadSnapshot?.payment_status?.actual_capture_method}
          <p class="text-xs text-[var(--muted-on-dark)]">Meio confirmado: {leadSnapshot.payment_status.actual_capture_method === "pix" ? "PIX" : leadSnapshot.payment_status.actual_capture_method === "credit_card" ? "Cartão de crédito" : leadSnapshot.payment_status.actual_capture_method}</p>
        {/if}
      </div>

      {#if errorMessage}
        <div role="alert" class="p-3 rounded-xl bg-[var(--warning-bg)] border border-[var(--warning)] text-xs text-[var(--warning)] text-center">
          {errorMessage}
        </div>
      {/if}

      <div class="space-y-3 pt-2">
        <button
          type="button"
          onclick={checkCardPaymentStatus}
          disabled={querying}
          class="btn w-full min-h-12 py-3.5 rounded-full bg-[var(--yellow)] text-[var(--ink)] font-bold text-xs uppercase tracking-wide hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-lg disabled:opacity-50"
        >
          {querying ? "Consultando pagamento…" : "Consultar pagamento novamente"}
        </button>

        {#if checkoutData?.receipt_url}
          <a href={checkoutData.receipt_url} target="_blank" rel="noopener noreferrer" class="inline-flex w-full min-h-12 items-center justify-center text-sm text-[var(--muted-on-dark)] underline">Ver comprovante ↗</a>
        {/if}
        {#if paymentStage === "completed" || recoveryAction !== "retry"}
          <a href="/" class="inline-flex w-full min-h-12 items-center justify-center text-sm text-[var(--muted-on-dark)] underline">Abrir minha conta</a>
        {/if}
        {#if paymentStage === "review"}
          <a href={`https://wa.me/${SUPPORT_WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" class="inline-flex w-full min-h-12 items-center justify-center text-sm text-[var(--muted-on-dark)] underline">Falar com o atendimento</a>
        {/if}
        {#if paymentStage === "pending" && recoveryAction === "retry" && checkoutUrl(checkoutData)}
          <a
            href={checkoutUrl(checkoutData)}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex w-full min-h-12 items-center justify-center py-3 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-colors"
          >
            Reabrir checkout vigente ↗
          </a>
        {/if}

        {#if paymentStage === "pending"}
        <button
          type="button"
          onclick={backToSelection}
          class="w-full min-h-12 text-center text-xs text-[var(--muted-on-dark)] hover:text-white transition-colors pt-1 cursor-pointer"
        >
          Revisar forma de pagamento
        </button>
        {/if}
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
