<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import {
    ApiError,
    confirmCardPayment,
    confirmIdentity,
    createCheckout,
    fetchContact,
    fetchPricing,
    getCheckoutStatus,
    getCurrentPayment,
    getErrorMessage,
    setLeadEmail,
    whoami,
    type StudentCurrentPayment,
    type WhoAmI,
  } from "@/lib/api";
  import { resolveSupportHref, type InstitutionalContact } from "@/lib/config";
  import { isValidCpf, maskCpf } from "@/lib/cpf";
  import { isEmailFormatValid, isTempEmail, suggestEmail } from "@/lib/email";
  import { formatBRL } from "@/lib/money";
  import { parsePaymentMethod, PAYMENT_LABEL, type PaymentMethod, type Pricing } from "@/lib/payment";
  import { getRoleDestination } from "@/lib/roles";
  import { getCheckout, getLogin, saveCheckout, saveLogin } from "@/lib/session";
  import TurnstileWidget from "@/components/interactive/TurnstileWidget.svelte";
  import { Alert, Badge, Card } from "@/components/ui";

  interface Props {
    initialPhase?: "selection" | "checkout";
  }

  let { initialPhase = "selection" }: Props = $props();

  let loading = $state(true);
  let busy = $state(false);
  let error = $state("");
  let notice = $state("");

  let me = $state<WhoAmI | null>(null);
  let pricing = $state<Pricing | null>(null);
  let contact = $state<InstitutionalContact | null>(null);
  let currentPayment = $state<StudentCurrentPayment | null>(null);

  let selectedMethod = $state<PaymentMethod>("pix");
  let checkoutUrl = $state<string | null>(null);
  let activePaymentId = $state<string | null>(null);
  let paidConfirmed = $state(false);

  let needsCpf = $state(false);
  let needsEmail = $state(false);
  let cpfInput = $state("");
  let emailInput = $state("");
  let turnstileToken = $state("");
  let turnstileResetKey = $state(0);
  let pendingRetryCheckout = $state(false);

  let pollTimer = $state<ReturnType<typeof setTimeout> | null>(null);

  const supportHref = $derived(resolveSupportHref(contact));
  const pixPriceText = $derived.by(() => {
    if (!pricing) return null;
    const raw = pricing.promo_pix ?? pricing.pix;
    return formatBRL(raw);
  });
  const anchorPriceText = $derived.by(() => {
    if (!pricing?.anchor_full) return null;
    return formatBRL(pricing.anchor_full);
  });
  const emailHint = $derived(emailInput.trim() ? suggestEmail(emailInput) : null);

  function stopPolling() {
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }
  }

  onDestroy(() => {
    stopPolling();
  });

  function syncProfileNeeds(user: WhoAmI | null | undefined) {
    needsCpf = !user?.cpf;
    needsEmail = !user?.email;
    if (user?.cpf && !cpfInput) cpfInput = maskCpf(user.cpf);
    if (user?.email && !emailInput) emailInput = user.email;
  }

  async function refreshSessionAndAdvance(fallbackPath?: string): Promise<boolean> {
    const updated = await whoami();
    me = updated;
    saveLogin({ ...getLogin(), ...updated });
    const dest = getRoleDestination(updated);
    const currentStatus = updated.role_statuses?.client ?? updated.status;
    const isAdminOnly = updated.roles?.includes("admin") && !updated.roles?.includes("client");
    if (dest && (isAdminOnly || (currentStatus && currentStatus !== "lead" && currentStatus !== "payment_pending"))) {
      window.location.href = dest;
      return true;
    }
    if (fallbackPath) {
      window.location.href = fallbackPath;
      return true;
    }
    return false;
  }

  async function pollPaymentUntilPaid(paymentId: string, remaining = 6) {
    stopPolling();
    try {
      const status = await getCheckoutStatus(paymentId);
      if (status.paid || status.status === "paid") {
        paidConfirmed = true;
        notice = "Pagamento confirmado! Preparando suas etapas de matrícula...";
        await refreshSessionAndAdvance();
        return;
      }
      if (status.checkout_url && !checkoutUrl) {
        checkoutUrl = status.checkout_url;
      }
    } catch {
      // keep silent during background poll; user has manual button
    }
    if (remaining > 0) {
      pollTimer = setTimeout(() => {
        void pollPaymentUntilPaid(paymentId, remaining - 1);
      }, 4000);
    }
  }

  onMount(async () => {
    try {
      const url = new URL(window.location.href);
      const urlMethod = parsePaymentMethod(url.searchParams.get("method"));
      if (urlMethod) selectedMethod = urlMethod;

      const orderNsu = url.searchParams.get("order_nsu")?.trim();
      const transactionNsu = url.searchParams.get("transaction_nsu")?.trim();
      const slug = url.searchParams.get("slug")?.trim();
      const receiptUrl = url.searchParams.get("receipt_url")?.trim();
      const paymentIdFromUrl = url.searchParams.get("payment_id")?.trim();

      const [userRes, pricingRes, contactRes, payRes] = await Promise.all([
        whoami().catch(() => null),
        fetchPricing().catch(() => null),
        fetchContact().catch(() => null),
        getCurrentPayment().catch(() => null),
      ]);

      me = userRes;
      pricing = pricingRes;
      contact = contactRes;
      currentPayment = payRes;

      if (userRes) {
        syncProfileNeeds(userRes);
      }

      const currentStatus = userRes?.role_statuses?.client ?? userRes?.status;
      const isAdminOnly = userRes?.roles?.includes("admin") && !userRes?.roles?.includes("client");
      if (userRes && (isAdminOnly || (currentStatus && currentStatus !== "lead" && currentStatus !== "payment_pending"))) {
        const moved = await refreshSessionAndAdvance();
        if (moved) return;
      }

      if (orderNsu && transactionNsu && slug) {
        busy = true;
        notice = "Confirmando seu pagamento na InfinitePay...";
        try {
          const confirmed = await confirmCardPayment({
            order_nsu: orderNsu,
            transaction_nsu: transactionNsu,
            slug,
            ...(receiptUrl ? { receipt_url: receiptUrl } : {}),
          });
          activePaymentId = confirmed.payment_id;
          if (confirmed.paid || confirmed.already_paid || confirmed.status === "paid") {
            paidConfirmed = true;
            notice = "Pagamento confirmado! Redirecionando para o envio de documentos...";
            await refreshSessionAndAdvance("/student/enrollment");
            return;
          }
          await pollPaymentUntilPaid(confirmed.payment_id, 5);
        } catch (err) {
          error = getErrorMessage(err);
          notice = "";
        } finally {
          busy = false;
        }
      } else {
        const cached = getCheckout();
        const cachedId = paymentIdFromUrl ?? (typeof cached?.payment_id === "string" ? cached.payment_id : null);
        if (payRes && payRes.status === "paid") {
          paidConfirmed = true;
          notice = "Pagamento já confirmado. Redirecionando...";
          await refreshSessionAndAdvance();
          return;
        }
        if (payRes?.checkout_url) {
          checkoutUrl = payRes.checkout_url;
          activePaymentId = payRes.payment_attempt_id;
        } else if (cachedId) {
          activePaymentId = cachedId;
          if (typeof cached?.checkout_url === "string") checkoutUrl = cached.checkout_url;
        }
      }

      if (initialPhase === "checkout" && !checkoutUrl && !needsCpf && !needsEmail && me) {
        // User navigated directly to /student/lead/checkout with complete profile
        notice = "Clique abaixo para gerar seu link seguro na InfinitePay.";
      }
    } catch (err) {
      error = getErrorMessage(err);
    } finally {
      loading = false;
    }
  });

  async function saveMissingProfile(): Promise<boolean> {
    error = "";
    if (needsCpf) {
      const digits = cpfInput.replace(/\D/g, "");
      if (!isValidCpf(digits)) {
        error = "Informe um CPF válido com 11 dígitos.";
        return false;
      }
      await confirmIdentity(digits, turnstileToken || undefined);
    }
    if (needsEmail) {
      const trimmed = emailInput.trim();
      if (!isEmailFormatValid(trimmed)) {
        error = "Informe um e-mail válido.";
        return false;
      }
      if (isTempEmail(trimmed)) {
        error = "Use um e-mail pessoal permanente para receber seus comprovantes e acesso.";
        return false;
      }
      await setLeadEmail(trimmed);
    }
    const refreshed = await whoami().catch(() => null);
    if (refreshed) {
      me = refreshed;
      syncProfileNeeds(refreshed);
    } else {
      needsCpf = false;
      needsEmail = false;
    }
    return true;
  }

  async function handleProfileSubmit(event: Event) {
    event.preventDefault();
    busy = true;
    error = "";
    try {
      const ok = await saveMissingProfile();
      if (ok && pendingRetryCheckout) {
        pendingRetryCheckout = false;
        await startCheckout();
      }
    } catch (err) {
      error = getErrorMessage(err);
      turnstileResetKey += 1;
    } finally {
      busy = false;
    }
  }

  async function startCheckout() {
    error = "";
    notice = "";

    if (needsCpf || needsEmail) {
      pendingRetryCheckout = true;
      error = "Complete seu CPF e e-mail abaixo antes de ir para o pagamento.";
      return;
    }

    busy = true;
    try {
      const idemp =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `chk-${Date.now()}`;
      const res = await createCheckout(selectedMethod, idemp);
      activePaymentId = res.payment_id;
      checkoutUrl = res.checkout_url;
      saveCheckout({
        payment_id: res.payment_id,
        checkout_url: res.checkout_url,
        payment_method: selectedMethod,
      });

      if (res.status === "paid") {
        paidConfirmed = true;
        await refreshSessionAndAdvance();
        return;
      }

      if (res.checkout_url && /^https:\/\/|^http:\/\//i.test(res.checkout_url)) {
        window.location.href = res.checkout_url;
        return;
      }
      await pollPaymentUntilPaid(res.payment_id, 5);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && err.code === "PROFILE_INCOMPLETE") {
        const missing = Array.isArray(err.extra?.missing_fields)
          ? (err.extra.missing_fields as string[])
          : [];
        needsCpf = missing.includes("cpf") || !me?.cpf;
        needsEmail = missing.includes("email") || !me?.email;
        pendingRetryCheckout = true;
        error = "Antes de continuar, precisamos confirmar os dados cadastrais faltantes abaixo.";
      } else {
        error = getErrorMessage(err);
      }
    } finally {
      busy = false;
    }
  }

  async function handleManualRecheck() {
    busy = true;
    error = "";
    try {
      if (activePaymentId) {
        const st = await getCheckoutStatus(activePaymentId);
        if (st.paid || st.status === "paid") {
          paidConfirmed = true;
          notice = "Pagamento confirmado! Redirecionando...";
          await refreshSessionAndAdvance("/student/enrollment");
          return;
        }
      }
      const pay = await getCurrentPayment().catch(() => null);
      currentPayment = pay;
      if (pay?.status === "paid") {
        paidConfirmed = true;
        await refreshSessionAndAdvance("/student/enrollment");
        return;
      }
      notice = "Pagamento ainda pendente de confirmação bancária. Aguarde alguns instantes e tente novamente.";
    } catch (err) {
      error = getErrorMessage(err);
    } finally {
      busy = false;
    }
  }
</script>

<section class="mx-auto max-w-2xl px-4 pb-28 pt-6 space-y-5">
  <header class="space-y-2">
    <div class="flex flex-wrap items-center gap-2">
      <Badge variant="warning">Etapa 1 de 2 — Taxa de matrícula</Badge>
      {#if paidConfirmed}
        <Badge variant="success">Pagamento confirmado</Badge>
      {/if}
    </div>
    <h1 class="text-2xl font-extrabold tracking-tight text-[#0b1220]">
      Finalize sua matrícula na EJA
    </h1>
    <p class="text-sm text-slate-600">
      Assim que o pagamento for confirmado pela InfinitePay, liberamos o envio dos seus documentos.
    </p>
  </header>

  {#if loading}
    <Card class="p-6">
      <p class="text-sm text-slate-500">Carregando condições de matrícula...</p>
    </Card>
  {:else}
    {#if error}
      <Alert variant="error" title="Atenção">{error}</Alert>
    {/if}
    {#if notice}
      <Alert variant={paidConfirmed ? "success" : "info"}>{notice}</Alert>
    {/if}

    <Card class="p-5 sm:p-6 space-y-4">
      <div class="flex flex-wrap items-baseline justify-between gap-2 border-b border-black/10 pb-4">
        <div>
          <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Valor promocional no Pix</p>
          <div class="flex items-baseline gap-2.5">
            {#if pixPriceText}
              <span class="text-3xl font-black text-[#00734d]">{pixPriceText}</span>
              <span class="text-sm font-semibold text-slate-700">à vista</span>
            {:else}
              <span class="text-lg font-bold text-[#0b1220]">Consulte valores no checkout seguro</span>
            {/if}
            {#if anchorPriceText}
              <span class="text-sm text-slate-400 line-through">{anchorPriceText}</span>
            {/if}
          </div>
        </div>
        <Badge variant="info">InfinitePay</Badge>
      </div>

      <p class="text-sm text-slate-700">
        Pix à vista ou cartão de crédito em até <strong>12x com juros calculados no checkout da InfinitePay</strong>.
      </p>

      <div class="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onclick={() => { selectedMethod = "pix"; }}
          class={`min-h-12 rounded-xl border p-3.5 text-left transition ${
            selectedMethod === "pix"
              ? "border-[#00734d] bg-[#00734d]/5 ring-2 ring-[#00734d]/20"
              : "border-black/15 bg-white hover:border-black/30"
          }`}
        >
          <p class="text-sm font-bold text-[#0b1220]">{PAYMENT_LABEL.pix}</p>
          <p class="text-xs text-slate-600 mt-0.5">
            {pixPriceText ? `${pixPriceText} — compensação imediata` : "Compensação imediata"}
          </p>
        </button>

        <button
          type="button"
          onclick={() => { selectedMethod = "card"; }}
          class={`min-h-12 rounded-xl border p-3.5 text-left transition ${
            selectedMethod === "card"
              ? "border-[#002776] bg-[#002776]/5 ring-2 ring-[#002776]/20"
              : "border-black/15 bg-white hover:border-black/30"
          }`}
        >
          <p class="text-sm font-bold text-[#0b1220]">{PAYMENT_LABEL.card}</p>
          <p class="text-xs text-slate-600 mt-0.5">Parcelamento calculado no checkout seguro</p>
        </button>
      </div>

      {#if needsCpf || needsEmail}
        <form onsubmit={handleProfileSubmit} class="rounded-2xl border border-[#ffc400]/50 bg-[#ffc400]/10 p-4 space-y-4">
          <div>
            <h2 class="text-sm font-bold text-[#0b1220]">Complete seu cadastro para emitir a cobrança</h2>
            <p class="text-xs text-slate-700 mt-0.5">
              Estes dados são obrigatórios para registrar sua matrícula escolar.
            </p>
          </div>

          {#if needsCpf}
            <div class="space-y-2">
              <label for="lead-cpf" class="block text-xs font-bold uppercase tracking-wide text-slate-700">
                CPF do aluno
              </label>
              <input
                id="lead-cpf"
                type="text"
                inputmode="numeric"
                value={cpfInput}
                oninput={(e) => { cpfInput = maskCpf((e.currentTarget as HTMLInputElement).value); }}
                placeholder="000.000.000-00"
                disabled={busy}
                class="min-h-11 w-full rounded-xl border border-black/15 bg-white px-3.5 text-sm text-[#0b1220] focus:border-[#002776] focus:outline-none"
              />
              <TurnstileWidget
                resetKey={turnstileResetKey}
                onToken={(tok) => { turnstileToken = tok; }}
              />
            </div>
          {/if}

          {#if needsEmail}
            <div class="space-y-1.5">
              <label for="lead-email" class="block text-xs font-bold uppercase tracking-wide text-slate-700">
                E-mail pessoal
              </label>
              <input
                id="lead-email"
                type="email"
                bind:value={emailInput}
                placeholder="seuemail@exemplo.com"
                disabled={busy}
                class="min-h-11 w-full rounded-xl border border-black/15 bg-white px-3.5 text-sm text-[#0b1220] focus:border-[#002776] focus:outline-none"
              />
              {#if emailHint}
                <button
                  type="button"
                  onclick={() => { emailInput = emailHint; }}
                  class="text-xs font-semibold text-[#002776] underline"
                >
                  Você quis dizer {emailHint}? Clique para corrigir
                </button>
              {/if}
            </div>
          {/if}

          <button
            type="submit"
            disabled={busy}
            class="min-h-11 w-full rounded-xl bg-[#0b1220] px-4 text-sm font-bold text-white hover:opacity-95 disabled:opacity-50"
          >
            {busy ? "Validando dados..." : "Salvar dados e ir para pagamento"}
          </button>
        </form>
      {:else}
        <div class="flex flex-col gap-3 pt-1">
          <button
            type="button"
            onclick={startCheckout}
            disabled={busy || paidConfirmed}
            class="min-h-12 w-full rounded-xl bg-[#ffc400] px-5 text-base font-extrabold text-[#0b1220] shadow-sm transition hover:brightness-95 disabled:opacity-50"
          >
            {busy
              ? "Abrindo checkout InfinitePay..."
              : checkoutUrl
              ? "Abrir checkout InfinitePay novamente"
              : "Ir para pagamento seguro InfinitePay"}
          </button>

          {#if checkoutUrl}
            <div class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-black/10 bg-[#f6f6f2] p-3">
              <span class="text-xs text-slate-700">Já concluiu o Pix ou cartão na InfinitePay?</span>
              <button
                type="button"
                onclick={handleManualRecheck}
                disabled={busy}
                class="min-h-10 rounded-lg border border-[#00734d] px-3 text-xs font-bold text-[#00734d] hover:bg-[#00734d] hover:text-white disabled:opacity-50"
              >
                Verificar pagamento agora
              </button>
            </div>
          {/if}
        </div>
      {/if}
    </Card>

    <div class="text-center text-xs text-slate-500">
      Dúvidas sobre a taxa ou parcelamento?
      <a href={supportHref} class="font-semibold text-[#002776] underline">
        Falar com atendimento por e-mail
      </a>
    </div>
  {/if}
</section>
