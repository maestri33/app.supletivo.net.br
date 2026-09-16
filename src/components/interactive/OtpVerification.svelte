<script lang="ts">
  import { onMount } from "svelte";
  import { loginOtp, checkPhone, whoami } from "@/lib/api";
  import { getSession, saveLogin, saveSession, getAccessToken } from "@/lib/session";

  let digits = $state(["", "", "", "", "", ""]);
  let busy = $state(false);
  let errorMessage = $state<string | null>(null);
  let resendCooldown = $state(45);
  let phone = $state("");
  let externalId = $state("");

  let code = $derived(digits.join(""));
  let isComplete = $derived(code.length === 6);

  onMount(() => {
    if (getAccessToken()) {
      window.location.replace("/painel");
      return;
    }

    // Lê parâmetros da URL ou recupera da sessão salva
    const urlParams = new URLSearchParams(window.location.search);
    const urlId = urlParams.get("id");
    const urlTel = urlParams.get("tel");

    const saved = getSession();

    externalId = urlId || saved.externalId || "";
    phone = urlTel || saved.phone || "";

    if (externalId && phone) {
      saveSession({ phone, externalId });
    } else if (!externalId || !phone) {
      window.location.replace("/autenticacao/login");
      return;
    }

    // Foca o primeiro input
    focusInput(0);

    // Inicia contagem regressiva
    const timer = setInterval(() => {
      if (resendCooldown > 0) {
        resendCooldown -= 1;
      } else {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  });

  function focusInput(idx: number) {
    setTimeout(() => {
      const el = document.getElementById(`otp-${idx}`) as HTMLInputElement | null;
      el?.focus();
    }, 40);
  }

  function handleInput(idx: number, e: Event) {
    const target = e.target as HTMLInputElement;
    const val = target.value.replace(/\D/g, "");

    if (val.length > 1) {
      // Tratamento de colagem (paste) ou digitação rápida
      const chars = val.slice(0, 6).split("");
      for (let i = 0; i < 6; i++) {
        digits[i] = chars[i] || "";
      }
      if (chars.length === 6) {
        focusInput(5);
        submitCode();
      } else {
        focusInput(chars.length);
      }
      return;
    }

    digits[idx] = val;
    errorMessage = null;

    if (val && idx < 5) {
      focusInput(idx + 1);
    }

    if (idx === 5 && digits.every((d) => d.length === 1)) {
      submitCode();
    }
  }

  function handleKeyDown(idx: number, e: KeyboardEvent) {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      digits[idx - 1] = "";
      focusInput(idx - 1);
    }
  }

  function handlePaste(e: ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData?.getData("text") || "";
    const clean = pasted.replace(/\D/g, "").slice(0, 6);
    if (!clean) return;

    const chars = clean.split("");
    for (let i = 0; i < 6; i++) {
      digits[i] = chars[i] || "";
    }

    if (clean.length === 6) {
      focusInput(5);
      submitCode();
    } else {
      focusInput(clean.length);
    }
  }

  async function submitCode() {
    if (!isComplete || busy) return;

    busy = true;
    errorMessage = null;

    try {
      const tokens = await loginOtp(externalId, code);
      saveLogin(tokens);

      // Avalia a role para direcionamento correto
      try {
        const info = await whoami();
        const roles = info.roles || [];
        if (roles.includes("enrollment")) {
          window.location.href = "/matricula";
          return;
        }
      } catch {
        // Segue para /painel se falhar whoami
      }

      window.location.href = "/painel";
    } catch (err: any) {
      errorMessage = err?.message || "Código incorreto ou expirado. Tente novamente.";
      digits = ["", "", "", "", "", ""];
      focusInput(0);
    } finally {
      busy = false;
    }
  }

  async function handleResend() {
    if (resendCooldown > 0 || busy || !phone) return;
    busy = true;
    errorMessage = null;

    try {
      const res = await checkPhone(phone);
      if (res.external_id) {
        externalId = res.external_id;
        saveSession({ phone, externalId: res.external_id });
      }
      resendCooldown = res.otp_wait || 45;
      digits = ["", "", "", "", "", ""];
      focusInput(0);
    } catch (err: any) {
      errorMessage = "Não foi possível reenviar o código. Tente novamente em instantes.";
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
      <a href="/autenticacao/login" class="text-xs text-white/40 hover:text-white underline">
        Trocar
      </a>
    </div>
  </div>

  <form onsubmit={(e) => { e.preventDefault(); submitCode(); }} class="space-y-6">
    <!-- Grid dos 6 dígitos -->
    <div class="flex items-center justify-between gap-2 sm:gap-3" onpaste={handlePaste}>
      {#each digits as digit, i (i)}
        <input
          id="otp-{i}"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          maxlength="1"
          autocomplete={i === 0 ? "one-time-code" : "off"}
          value={digit}
          oninput={(e) => handleInput(i, e)}
          onkeydown={(e) => handleKeyDown(i, e)}
          disabled={busy}
          class="size-12 sm:size-14 text-center text-xl sm:text-2xl font-bold font-mono rounded-xl bg-white/5 border border-white/20 text-white focus:border-yellow focus:ring-2 focus:ring-yellow/30 focus:outline-none transition shadow-inner"
        />
      {/each}
    </div>

    {#if errorMessage}
      <div class="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
        <span>⚠️</span>
        <span>{errorMessage}</span>
      </div>
    {/if}

    <button
      type="submit"
      disabled={!isComplete || busy}
      class="btn w-full disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    >
      {#if busy}
        <span>Validando código...</span>
      {:else}
        <span>Confirmar e Entrar →</span>
      {/if}
    </button>
  </form>

  <div class="mt-6 pt-6 border-t border-white/10 text-center">
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
  </div>
</div>
