<script lang="ts">
  import { onMount } from "svelte";
  import {
    loginOtp,
    sendOtp,
    checkPhone,
    whoami,
    getErrorMessage,
    ApiError,
  } from "@/lib/api";
  import {
    getSession,
    saveLogin,
    saveSession,
    getAccessToken,
    clearLogin,
  } from "@/lib/session";
  import { getRoleDestination } from "@/lib/roles";
  import ContactRecoveryModal from "./ContactRecoveryModal.svelte";
  import InputOtp from "@/components/ui/InputOtp.svelte";
  import ErrorDialog from "@/components/ui/ErrorDialog.svelte";
  import { toast } from "@/lib/toast";

  let code = $state("");
  let otpInputRef = $state<ReturnType<typeof InputOtp> | null>(null);
  let busy = $state(false);
  let errorMessage = $state<string | null>(null);
  let errorCode = $state("");
  let isErrorDialogOpen = $state(false);
  let resendCooldown = $state(60);
  let phone = $state("");
  let externalId = $state("");
  let isRecoveryOpen = $state(false);
  let recoveryCpf = $state("");
  let recoveryNewPhone = $state("");
  let mounted = $state(false);

  let isComplete = $derived(code.length === 6);

  onMount(() => {
    mounted = true;

    const urlParams = new URLSearchParams(window.location.search);
    const urlId = urlParams.get("id");
    const urlTel = urlParams.get("tel");
    const urlCpf = urlParams.get("cpf");
    const urlNovoTelefone = urlParams.get("novo_telefone") || urlParams.get("new_phone");
    const urlOpenRecovery = urlParams.get("open_recovery") === "true";

    const saved = getSession();

    const init = async () => {
      if (getAccessToken()) {
        if (urlId || urlTel) {
          clearLogin();
        } else {
          try {
            const who = await whoami();
            const target = getRoleDestination(who);
            if (!target) throw new Error("Não foi possível identificar a etapa da sua conta.");
            window.location.replace(target);
            return;
          } catch {
            clearLogin();
          }
        }
      }

      if (urlCpf) recoveryCpf = urlCpf;
      if (urlNovoTelefone) recoveryNewPhone = urlNovoTelefone;
      if (urlOpenRecovery || urlNovoTelefone || (urlCpf && !urlTel && !saved?.phone)) {
        isRecoveryOpen = true;
      }

      const rawTel = urlTel || saved?.phone || "";
      phone = rawTel.replace(/\D/g, "");
      externalId = urlId || saved?.externalId || "";

      if (phone) {
        saveSession({
          phone,
          externalId: externalId || null,
          cpf: urlCpf || saved?.cpf,
        });
        if (!externalId) {
          busy = true;
          try {
            const res = await checkPhone(phone);
            if (res?.external_id) {
              externalId = res.external_id;
              saveSession({ phone, externalId: res.external_id, cpf: urlCpf || saved?.cpf });
            }
          } catch {
            // Keep screen active if phone is available
          } finally {
            busy = false;
          }
        }
      } else if (!isRecoveryOpen) {
        window.location.replace("/");
        return;
      }
    };

    void init();

    const timer = setInterval(() => {
      if (resendCooldown > 0) {
        resendCooldown -= 1;
      }
    }, 1000);

    return () => clearInterval(timer);
  });

  async function submitCode() {
    if (!isComplete || busy || !phone) return;

    busy = true;
    errorMessage = null;

    try {
      const tokens = await loginOtp(phone, code, "whatsapp");
      saveLogin(tokens as unknown as Record<string, unknown>);

      try {
        const who = await whoami();
        saveLogin({
          ...tokens,
          roles: who.roles || [],
          role_statuses: who.role_statuses || {},
          active_role: who.active_role ?? null,
          status: who.status ?? null,
          substatus: who.substatus ?? null,
          name: who.name || null,
        });
        const target = getRoleDestination(who);
        if (!target) throw new Error("Não foi possível identificar a etapa da sua conta.");
        const urlParams = new URLSearchParams(window.location.search);
        const returnTo = urlParams.get("return_to");
        const safeReturnTo =
          returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
            ? returnTo
            : null;
        window.location.href = safeReturnTo || target;
        return;
      } catch {
        window.location.href = "/autenticacao/conta";
      }
    } catch (err: unknown) {
      errorMessage = getErrorMessage(err);
      errorCode = err instanceof ApiError ? err.code || "" : "";
      isErrorDialogOpen = true;
      code = "";
      otpInputRef?.clear();
    } finally {
      busy = false;
    }
  }

  async function handleResend() {
    if (resendCooldown > 0 || busy || !phone) return;
    busy = true;
    errorMessage = null;

    try {
      await sendOtp(phone, "whatsapp");
      resendCooldown = 60;
      code = "";
      otpInputRef?.clear();
      isErrorDialogOpen = false;
      toast.success("Novo código enviado para seu WhatsApp!");
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 429) {
        const retrySec =
          Number(err.extra?.wait_seconds ?? err.extra?.retry_after_s) || 60;
        resendCooldown = retrySec;
        errorMessage = `Aguarde ${retrySec}s antes de pedir outro código.`;
        errorCode = "RATE_LIMITED";
        isErrorDialogOpen = true;
      } else {
        errorMessage = "Não foi possível reenviar o código. Tente novamente em instantes.";
        errorCode = "RESEND_FAILED";
        isErrorDialogOpen = true;
      }
    } finally {
      busy = false;
    }
  }

  function formatDisplayPhone(p: string) {
    if (!p) return "";
    const d = p.replace(/\D/g, "");
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    return p;
  }
</script>

<div class="w-full max-w-md mx-auto my-auto p-6 sm:p-8 rounded-2xl glass-panel text-white shadow-2xl border border-white/15">
  <div class="text-center mb-6">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-xs font-semibold text-blue-300 mb-3">
      <span class="size-2 rounded-full bg-blue-400 animate-pulse"></span>
      Autenticação Segura
    </div>
    <h1 class="text-2xl sm:text-3xl font-display tracking-tight text-white">
      Digite seu código
    </h1>
    <p class="mt-2 text-sm text-white/70 font-sans">
      Enviamos um código de 6 dígitos no WhatsApp para:
    </p>
    <div class="mt-1 flex items-center justify-center gap-2">
      <span class="font-mono font-bold text-emerald-300 text-sm">{formatDisplayPhone(phone)}</span>
      <a href={`/?trocar=1&tel=${encodeURIComponent(phone)}`} class="text-xs text-white/40 hover:text-white underline">
        Trocar
      </a>
    </div>
  </div>

  <div class="space-y-6">
    <InputOtp
      bind:this={otpInputRef}
      bind:value={code}
      length={6}
      disabled={busy}
      error={isErrorDialogOpen || !!errorMessage}
      oncomplete={() => { void submitCode(); }}
    />

    <ErrorDialog
      isOpen={isErrorDialogOpen}
      error={errorMessage}
      code={errorCode}
      primaryAction={errorCode === "OTP_EXPIRED" || (errorMessage || "").toLowerCase().includes("expirado")
        ? { label: "Reenviar Novo Código", action: () => { isErrorDialogOpen = false; void handleResend(); } }
        : errorCode === "OTP_INVALID" || (errorMessage || "").toLowerCase().includes("incorreto")
          ? { label: "Digitar Novamente", action: () => { isErrorDialogOpen = false; code = ""; otpInputRef?.clear(); otpInputRef?.focus(); } }
          : undefined}
      secondaryAction={errorCode === "OTP_EXPIRED" || (errorMessage || "").toLowerCase().includes("expirado")
        ? { label: "Trocar Número", action: () => { window.location.href = `/?trocar=1&tel=${encodeURIComponent(phone)}`; } }
        : undefined}
      onClose={() => { isErrorDialogOpen = false; }}
    />

    <div class="pt-1">
      {#if busy}
        <div class="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-white/10 text-yellow text-sm font-semibold border border-yellow/30" role="status" aria-live="polite">
          <span class="inline-block size-4 border-2 border-white/30 border-t-yellow rounded-full animate-spin"></span>
          <span>Validando código e acessando...</span>
        </div>
      {:else if isComplete}
        <div class="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-emerald-500/15 text-emerald-300 text-sm font-semibold border border-emerald-500/30" role="status" aria-live="polite">
          <span class="inline-block size-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Código completo. Validando...</span>
        </div>
      {:else}
        <div class="text-center text-xs text-white/50 py-2" aria-live="polite">
          Validação automática instantânea ao completar os 6 dígitos
        </div>
      {/if}
    </div>
  </div>

  <div class="mt-6 pt-6 border-t border-white/10 text-center flex flex-col items-center gap-3">
    {#if resendCooldown > 0}
      <p class="text-xs text-white/50">
        Reenviar código em <span class="font-mono text-white font-bold">{resendCooldown}s</span>
      </p>
    {:else}
      <button
        type="button"
        onclick={handleResend}
        disabled={busy}
        class="text-xs font-bold text-yellow hover:underline cursor-pointer"
      >
        Reenviar código via WhatsApp 💬
      </button>
    {/if}

    <button
      type="button"
      onclick={() => { isRecoveryOpen = true; }}
      data-testid="contact-recovery-trigger"
      data-hydrated={mounted}
      class="text-xs text-white/50 hover:text-white transition underline cursor-pointer"
    >
      Não tenho mais acesso a este número
    </button>
  </div>

  <ContactRecoveryModal
    isOpen={isRecoveryOpen}
    initialCpf={recoveryCpf}
    initialNewPhone={recoveryNewPhone}
    onClose={() => { isRecoveryOpen = false; }}
  />
</div>
