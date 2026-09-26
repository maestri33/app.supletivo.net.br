<script lang="ts">
  import { maskBrPhone, isValidBrMobile } from "@/lib/phone";
  import Modal from "@/components/ui/Modal.svelte";

  interface Props {
    isOpen?: boolean;
    currentPhone?: string;
    initialCpf?: string;
    initialNewPhone?: string;
    onClose: () => void;
    onSuccess?: (protocol: string) => void;
  }

  let {
    isOpen = false,
    currentPhone = "",
    initialCpf = "",
    initialNewPhone = "",
    onClose,
    onSuccess,
  }: Props = $props();

  // Estados do fluxo
  let step = $state<"form" | "challenge" | "loading" | "success">("form");
  let cpf = $state("");
  let newPhone = $state("");
  let birthDate = $state("");
  let otpCode = $state("");
  let selectedMethod = $state<"email" | "birth_date" | "biometric" | "secretaria">("email");
  let errorMessage = $state<string | null>(null);
  let protocol = $state<string | null>(null);
  let instructions = $state<string | null>(null);
  let maskedEmail = $state<string | null>(null);
  let maskedNewPhone = $state<string | null>(null);

  $effect(() => {
    if (initialCpf && !cpf) {
      cpf = formatCpf(initialCpf);
    }
    if (initialNewPhone && !newPhone) {
      newPhone = maskBrPhone(initialNewPhone);
    }
  });

  function formatCpf(val: string) {
    const digits = val.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  function formatBirthDate(val: string) {
    const digits = val.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
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

  function onBirthDateInput(e: Event) {
    const target = e.target as HTMLInputElement;
    birthDate = formatBirthDate(target.value);
    target.value = birthDate;
    errorMessage = null;
  }

  async function submitRecovery() {
    const cleanCpf = cpf.replace(/\D/g, "");
    const cleanPhone = newPhone.replace(/\D/g, "");

    if (cleanCpf.length !== 11) {
      errorMessage = "Por favor, digite um CPF válido com 11 dígitos.";
      return;
    }

    if (!isValidBrMobile(cleanPhone)) {
      errorMessage = "Por favor, informe seu novo celular com DDD (11 dígitos).";
      return;
    }

    if (selectedMethod === "birth_date" && birthDate.replace(/\D/g, "").length !== 8) {
      errorMessage = "Por favor, informe a data de nascimento completa (DD/MM/AAAA).";
      return;
    }

    step = "loading";
    errorMessage = null;

    try {
      const res = await fetch("/api/v1/auth/recovery/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cpf: cleanCpf,
          new_phone: cleanPhone,
          birth_date: selectedMethod === "birth_date" ? birthDate : undefined,
          otp: otpCode.trim() || undefined,
          method: selectedMethod,
          current_phone: currentPhone,
        }),
      });

      const data = await res.json();

      if (!res.ok || (!data.success && !data.requires_challenge)) {
        throw new Error(data.error || "Não foi possível processar a recuperação de contato.");
      }

      protocol = data.protocol;
      instructions = data.instructions;
      maskedEmail = data.masked_email;
      maskedNewPhone = data.masked_new_phone;

      if (data.requires_challenge || data.status === "CHALLENGE_REQUIRED") {
        step = "challenge";
        return;
      }

      step = "success";
      onSuccess?.(data.protocol);
    } catch (err: any) {
      step = "form";
      errorMessage = err.message || "Erro de conexão ao processar recuperação.";
    }
  }

  async function submitChallengeOtp() {
    const cleanOtp = otpCode.replace(/\D/g, "");
    if (cleanOtp.length !== 6) {
      errorMessage = "Informe o código de segurança com 6 dígitos.";
      return;
    }

    step = "loading";
    errorMessage = null;

    try {
      const cleanCpf = cpf.replace(/\D/g, "");
      const cleanPhone = newPhone.replace(/\D/g, "");

      const res = await fetch("/api/v1/auth/recovery/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cpf: cleanCpf,
          new_phone: cleanPhone,
          otp: cleanOtp,
          method: selectedMethod,
          current_phone: currentPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Código de verificação incorreto ou expirado.");
      }

      protocol = data.protocol || protocol;
      instructions = data.instructions || "Telefone atualizado com sucesso no cadastro.";
      step = "success";
      onSuccess?.(protocol ?? "");
    } catch (err: any) {
      step = "challenge";
      errorMessage = err.message || "Erro ao validar código OTP.";
    }
  }

  function resetAndClose() {
    step = "form";
    cpf = "";
    newPhone = "";
    birthDate = "";
    otpCode = "";
    errorMessage = null;
    protocol = null;
    instructions = null;
    maskedEmail = null;
    maskedNewPhone = null;
    onClose();
  }
</script>

<Modal
  {isOpen}
  onClose={resetAndClose}
  eyebrow="Segurança de Conta"
  eyebrowVariant="amber"
  title="Atualização Segura de Contato"
  description="Autoatendimento para recuperação de acesso vinculado ao seu CPF."
  testId="contact-recovery-modal"
  size="lg"
>
  {#if step === "form"}
    <div class="flex flex-col gap-4">
      <!-- Campo CPF -->
      <div class="flex flex-col gap-1.5">
        <label for="recovery-cpf" class="text-xs font-bold text-white/90">
          Confirme seu CPF cadastrado
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

      <!-- Campo Novo Telefone -->
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

      <!-- Métodos de Validação Secundária (Prevenção de Sequestro de Conta) -->
      <div class="flex flex-col gap-2 pt-2">
        <span class="text-xs font-bold text-white/90">
          Escolha o método de validação de segurança:
        </span>

        <div class="grid grid-cols-1 gap-2.5">
          <label class="flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition {selectedMethod === 'email' ? 'border-yellow bg-yellow/10' : 'border-white/10 bg-white/5 hover:border-white/20'}">
            <input
              type="radio"
              name="recovery_method"
              value="email"
              checked={selectedMethod === "email"}
              onchange={() => { selectedMethod = "email"; }}
              class="mt-1 accent-yellow"
            />
            <div class="flex flex-col text-left">
              <span class="text-xs font-bold text-white">Link de confirmação no e-mail cadastrado</span>
              <span class="text-[11px] text-white/60">Enviaremos um código OTP de 6 dígitos para o e-mail registrado na sua conta.</span>
            </div>
          </label>

          <label class="flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition {selectedMethod === 'birth_date' ? 'border-yellow bg-yellow/10' : 'border-white/10 bg-white/5 hover:border-white/20'}">
            <input
              type="radio"
              name="recovery_method"
              value="birth_date"
              checked={selectedMethod === "birth_date"}
              onchange={() => { selectedMethod = "birth_date"; }}
              class="mt-1 accent-yellow"
            />
            <div class="flex flex-col text-left">
              <span class="text-xs font-bold text-white">Confirmação por Data de Nascimento</span>
              <span class="text-[11px] text-white/60">Validação instantânea através da data de nascimento registrada no CPF.</span>
            </div>
          </label>

          {#if selectedMethod === "birth_date"}
            <div class="p-3 bg-white/5 border border-yellow/30 rounded-xl flex flex-col gap-1.5 ml-6">
              <label for="recovery-birth-date" class="text-xs font-bold text-yellow">
                Sua Data de Nascimento:
              </label>
              <input
                id="recovery-birth-date"
                data-testid="recovery-birthdate-input"
                type="text"
                inputmode="numeric"
                placeholder="DD/MM/AAAA"
                value={birthDate}
                oninput={onBirthDateInput}
                class="h-10 w-full rounded-lg bg-white/10 border border-white/20 px-3 text-sm font-mono text-white focus:border-yellow focus:outline-none"
              />
            </div>
          {/if}

          <label class="flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition {selectedMethod === 'biometric' ? 'border-yellow bg-yellow/10' : 'border-white/10 bg-white/5 hover:border-white/20'}">
            <input
              type="radio"
              name="recovery_method"
              value="biometric"
              checked={selectedMethod === "biometric"}
              onchange={() => { selectedMethod = "biometric"; }}
              class="mt-1 accent-yellow"
            />
            <div class="flex flex-col text-left">
              <span class="text-xs font-bold text-white">Reconhecimento facial biométrico</span>
              <span class="text-[11px] text-white/60">Selfie rápida comparada à foto do RG/CNH arquivado no sistema.</span>
            </div>
          </label>

          <label class="flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition {selectedMethod === 'secretaria' ? 'border-yellow bg-yellow/10' : 'border-white/10 bg-white/5 hover:border-white/20'}">
            <input
              type="radio"
              name="recovery_method"
              value="secretaria"
              checked={selectedMethod === "secretaria"}
              onchange={() => { selectedMethod = "secretaria"; }}
              class="mt-1 accent-yellow"
            />
            <div class="flex flex-col text-left">
              <span class="text-xs font-bold text-white">Atendimento humano na secretaria acadêmica</span>
              <span class="text-[11px] text-white/60">Gera um protocolo prioritário para atendimento manual seguro.</span>
            </div>
          </label>
        </div>
      </div>

      {#if errorMessage}
        <div class="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-center gap-2" data-testid="recovery-error">
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      {/if}

      <!-- Ação Principal -->
      <button
        type="button"
        onclick={submitRecovery}
        data-testid="recovery-submit-btn"
        class="mt-2 flex items-center justify-center h-12 w-full rounded-full bg-yellow hover:bg-yellow/90 text-ink font-bold text-sm transition shadow-lg active:scale-[0.99]"
      >
        Solicitar Atualização de Contato
      </button>
    </div>
  {:else if step === "challenge"}
    <!-- Etapa de Desafio de Código OTP no e-mail -->
    <div class="flex flex-col gap-4" data-testid="recovery-challenge-box">
      <div class="p-3.5 rounded-xl bg-yellow/10 border border-yellow/30 text-xs text-yellow-100 flex items-start gap-2.5">
        <span class="text-base">📧</span>
        <div>
          <span class="font-bold text-white">Código de Confirmação Enviado:</span>
          <p class="text-white/80 mt-0.5">
            {instructions || `Enviamos um código de 6 dígitos para ${maskedEmail || 'o seu e-mail'}. Digite-o abaixo:`}
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
        onclick={submitChallengeOtp}
        data-testid="recovery-verify-otp-btn"
        class="mt-2 flex items-center justify-center h-12 w-full rounded-full bg-yellow hover:bg-yellow/90 text-ink font-bold text-sm transition shadow-lg active:scale-[0.99]"
      >
        Confirmar Código e Atualizar Telefone
      </button>

      <button
        type="button"
        onclick={() => { step = "form"; }}
        class="text-xs text-white/60 hover:text-white transition text-center underline cursor-pointer"
      >
        Voltar e escolher outro método
      </button>
    </div>
  {:else if step === "loading"}
    <div class="flex flex-col items-center justify-center py-10 text-center gap-3">
      <div class="size-10 animate-spin rounded-full border-4 border-yellow border-t-transparent"></div>
      <p class="text-sm font-bold text-white">Validando protocolo de segurança…</p>
      <span class="text-xs text-white/60">Processando e gravando log auditável contra sequestro de conta.</span>
    </div>
  {:else if step === "success"}
    <div class="flex flex-col gap-4 text-center items-center py-4" data-testid="recovery-success-box">
      <div class="size-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl font-black">
        ✓
      </div>

      <div>
        <h4 class="text-lg font-black text-white">Solicitação Protocolada</h4>
        <p class="text-xs text-white/70 mt-1">
          {instructions || "Seu novo número de telefone foi validado e atualizado na base oficial."}
        </p>
      </div>

      <div class="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left backdrop-blur-md">
        <span class="text-[10px] font-bold text-white/50 uppercase tracking-wider">Número de Protocolo</span>
        <p class="font-mono text-base font-black text-yellow mt-0.5" data-testid="recovery-protocol-number">
          {protocol}
        </p>
        {#if maskedNewPhone}
          <div class="mt-2 pt-2 border-t border-white/10 flex justify-between items-center text-xs">
            <span class="text-white/60">Novo telefone:</span>
            <span class="font-mono text-white font-bold">{maskedNewPhone}</span>
          </div>
        {/if}
        <p class="text-[11px] text-white/60 mt-2">
          Guarde este código. Uma cópia do registro de auditoria foi vinculada com segurança ao seu histórico acadêmico.
        </p>
      </div>

      <button
        type="button"
        onclick={resetAndClose}
        data-testid="recovery-close-btn"
        class="w-full h-11 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
      >
        Entendido, voltar para o login
      </button>
    </div>
  {/if}
</Modal>
