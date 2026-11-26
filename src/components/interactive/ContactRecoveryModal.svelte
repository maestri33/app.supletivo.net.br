<script lang="ts">
  import {
    recoverLookup,
    recoverSendOtp,
    recoverVerifyAndLink,
    getErrorMessage,
  } from "@/lib/api";
  import { maskBrPhone, isValidBrMobile } from "@/lib/phone";
  import Modal from "@/components/ui/Modal.svelte";
  import ErrorDialog from "@/components/ui/ErrorDialog.svelte";

  interface Props {
    isOpen?: boolean;
    initialCpf?: string;
    initialNewPhone?: string;
    onClose: () => void;
    onSuccess?: (newPhone: string) => void;
  }

  let {
    isOpen = false,
    initialCpf = "",
    initialNewPhone = "",
    onClose,
    onSuccess,
  }: Props = $props();

  let step = $state<"lookup" | "challenge" | "loading" | "success">("lookup");
  let cpf = $state("");
  let newPhone = $state("");
  let otpCode = $state("");
  let errorMessage = $state<string | null>(null);
  let isErrorDialogOpen = $state(false);
  let firstName = $state<string | null>(null);
  let maskedEmail = $state<string | null>(null);
  let maskedPhone = $state<string | null>(null);
  let maskedNewPhone = $state<string | null>(null);

  $effect(() => {
    if (initialCpf && !cpf) cpf = formatCpf(initialCpf);
    if (initialNewPhone && !newPhone) newPhone = maskBrPhone(initialNewPhone);
  });

  function formatCpf(val: string) {
    const digits = val.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  function onCpfInput(e: Event) {
    const target = e.target as HTMLInputElement;
    cpf = formatCpf(target.value);
    target.value = cpf;
    errorMessage = null;
  }

  function onPhoneInput(e: Event) {
    const target = e.target as HTMLInputElement;
    newPhone = maskBrPhone(target.value);
    target.value = newPhone;
    errorMessage = null;
  }

  async function submitLookupAndSendOtp() {
    const cleanCpf = cpf.replace(/\D/g, "");
    const cleanPhone = newPhone.replace(/\D/g, "");

    if (cleanCpf.length !== 11) {
      errorMessage = "Por favor, digite um CPF válido com 11 dígitos.";
      isErrorDialogOpen = true;
      return;
    }

    if (!isValidBrMobile(cleanPhone)) {
      errorMessage = "Por favor, informe seu novo celular com DDD (11 dígitos).";
      isErrorDialogOpen = true;
      return;
    }

    step = "loading";
    errorMessage = null;

    try {
      const lookup = await recoverLookup(cleanCpf);
      if (!lookup.found) {
        throw new Error(lookup.error || "Nenhum cadastro localizado para este CPF.");
      }
      firstName = lookup.first_name ?? null;
      maskedEmail = lookup.masked_email ?? null;
      maskedPhone = lookup.masked_phone ?? null;

      if (!lookup.has_email) {
        throw new Error(
          "Esta conta não possui e-mail cadastrado para receber o código de recuperação. Entre em contato com contato@supletivo.net.br."
        );
      }

      const dispatch = await recoverSendOtp(cleanCpf, "email");
      maskedEmail = dispatch.masked_email ?? maskedEmail;
      step = "challenge";
    } catch (err: unknown) {
      step = "lookup";
      errorMessage = getErrorMessage(err);
      isErrorDialogOpen = true;
    }
  }

  async function submitVerifyAndLink() {
    const cleanOtp = otpCode.replace(/\D/g, "");
    if (cleanOtp.length !== 6) {
      errorMessage = "Informe o código de segurança com 6 dígitos.";
      isErrorDialogOpen = true;
      return;
    }

    step = "loading";
    errorMessage = null;

    try {
      const cleanCpf = cpf.replace(/\D/g, "");
      const cleanPhone = newPhone.replace(/\D/g, "");
      const res = await recoverVerifyAndLink(cleanCpf, cleanOtp, cleanPhone);
      maskedNewPhone = res.user?.masked_new_phone ?? maskBrPhone(cleanPhone);
      step = "success";
      onSuccess?.(cleanPhone);
    } catch (err: unknown) {
      step = "challenge";
      errorMessage = getErrorMessage(err);
      isErrorDialogOpen = true;
    }
  }

  function resetAndClose() {
    step = "lookup";
    cpf = "";
    newPhone = "";
    otpCode = "";
    errorMessage = null;
    firstName = null;
    maskedEmail = null;
    maskedPhone = null;
    maskedNewPhone = null;
    onClose();
  }
</script>

<Modal
  {isOpen}
  onClose={resetAndClose}
  eyebrow="Segurança de Conta"
  eyebrowVariant="amber"
  title="Recuperação de Número por CPF"
  description="Confirme sua identidade pelo e-mail cadastrado para vincular o novo WhatsApp."
  testId="contact-recovery-modal"
  size="lg"
>
  {#if step === "lookup"}
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1.5">
        <label for="recovery-cpf" class="text-xs font-bold text-white/90">
          CPF cadastrado
        </label>
        <input
          id="recovery-cpf"
          data-testid="recovery-cpf-input"
          type="text"
          inputmode="numeric"
          placeholder="000.000.000-00"
          value={cpf}
          oninput={onCpfInput}
          class="h-12 w-full rounded-xl bg-white/5 border border-white/20 px-4 text-sm font-mono text-white focus:border-yellow focus:outline-none focus:ring-2 focus:ring-yellow/30 transition"
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="recovery-new-phone" class="text-xs font-bold text-white/90">
          Novo celular / WhatsApp (com DDD)
        </label>
        <input
          id="recovery-new-phone"
          data-testid="recovery-phone-input"
          type="tel"
          inputmode="tel"
          placeholder="(11) 90000-0000"
          value={newPhone}
          oninput={onPhoneInput}
          class="h-12 w-full rounded-xl bg-white/5 border border-white/20 px-4 text-sm font-mono text-white focus:border-yellow focus:outline-none focus:ring-2 focus:ring-yellow/30 transition"
        />
      </div>

      {#if errorMessage}
        <div class="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-center gap-2" data-testid="recovery-error">
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      {/if}

      <button
        type="button"
        onclick={submitLookupAndSendOtp}
        data-testid="recovery-submit-btn"
        class="mt-2 flex items-center justify-center h-12 w-full rounded-full bg-yellow hover:bg-yellow/90 text-ink font-bold text-sm transition shadow-lg active:scale-[0.99] cursor-pointer"
      >
        Enviar código para meu e-mail
      </button>
    </div>
  {:else if step === "challenge"}
    <div class="flex flex-col gap-4" data-testid="recovery-challenge-box">
      <div class="p-3.5 rounded-xl bg-yellow/10 border border-yellow/30 text-xs text-yellow-100 flex items-start gap-2.5">
        <span class="text-base">📧</span>
        <div>
          <span class="font-bold text-white">Olá{firstName ? `, ${firstName}` : ""}! Código enviado:</span>
          <p class="text-white/80 mt-0.5">
            Enviamos um código de 6 dígitos para {maskedEmail || "seu e-mail cadastrado"}{maskedPhone ? ` (número anterior ${maskedPhone})` : ""}.
          </p>
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="recovery-otp" class="text-xs font-bold text-white/90">
          Código de 6 dígitos
        </label>
        <input
          id="recovery-otp"
          data-testid="recovery-otp-input"
          type="text"
          inputmode="numeric"
          maxlength="6"
          placeholder="000000"
          bind:value={otpCode}
          class="h-14 w-full rounded-xl bg-white/5 border border-white/20 px-4 text-center tracking-[0.5em] text-2xl font-mono text-white focus:border-yellow focus:outline-none focus:ring-2 focus:ring-yellow/30 transition"
        />
      </div>

      {#if errorMessage}
        <div class="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-center gap-2" data-testid="recovery-error">
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      {/if}

      <button
        type="button"
        onclick={submitVerifyAndLink}
        data-testid="recovery-verify-otp-btn"
        class="mt-2 flex items-center justify-center h-12 w-full rounded-full bg-yellow hover:bg-yellow/90 text-ink font-bold text-sm transition shadow-lg active:scale-[0.99] cursor-pointer"
      >
        Confirmar Código e Vincular Novo Número
      </button>

      <button
        type="button"
        onclick={() => { step = "lookup"; }}
        class="text-xs text-white/60 hover:text-white transition text-center underline cursor-pointer"
      >
        Alterar CPF ou novo número
      </button>
    </div>
  {:else if step === "loading"}
    <div class="flex flex-col items-center justify-center py-10 text-center gap-3">
      <div class="size-10 animate-spin rounded-full border-4 border-yellow border-t-transparent"></div>
      <p class="text-sm font-bold text-white">Validando recuperação segura…</p>
      <span class="text-xs text-white/60">Verificando seu cadastro e enviando o código de segurança.</span>
    </div>
  {:else if step === "success"}
    <div class="flex flex-col gap-4 text-center items-center py-4" data-testid="recovery-success-box">
      <div class="size-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl font-black">
        ✓
      </div>
      <div>
        <h4 class="text-lg font-black text-white">Novo celular vinculado</h4>
        <p class="text-xs text-white/70 mt-1">
          Seu novo número foi atualizado com segurança no cadastro.
        </p>
      </div>
      {#if maskedNewPhone}
        <div class="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-xs flex justify-between items-center">
          <span class="text-white/60">Novo WhatsApp:</span>
          <span class="font-mono text-white font-bold">{maskedNewPhone}</span>
        </div>
      {/if}
      <button
        type="button"
        onclick={resetAndClose}
        data-testid="recovery-close-btn"
        class="w-full h-11 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer"
      >
        Entrar com meu novo número
      </button>
    </div>
  {/if}

  <ErrorDialog
    isOpen={isErrorDialogOpen}
    error={errorMessage}
    primaryAction={{
      label: "Entendido",
      action: () => { isErrorDialogOpen = false; }
    }}
    onClose={() => { isErrorDialogOpen = false; }}
  />
</Modal>
