<script lang="ts">
  import { maskBrPhone, isValidBrMobile } from "@/lib/phone";

  interface Props {
    isOpen?: boolean;
    currentPhone?: string;
    onClose: () => void;
    onSuccess?: (protocol: string) => void;
  }

  let {
    isOpen = false,
    currentPhone = "",
    onClose,
    onSuccess,
  }: Props = $props();

  // Estados do fluxo
  let step = $state<"form" | "loading" | "success">("form");
  let cpf = $state("");
  let newPhone = $state("");
  let selectedMethod = $state<"email" | "biometric" | "secretaria">("email");
  let errorMessage = $state<string | null>(null);
  let protocol = $state<string | null>(null);
  let instructions = $state<string | null>(null);

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

    step = "loading";
    errorMessage = null;

    try {
      const res = await fetch("/api/v1/auth/recovery/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cpf: cleanCpf,
          new_phone: cleanPhone,
          method: selectedMethod,
          current_phone: currentPhone,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Não foi possível enviar a solicitação.");
      }

      protocol = data.protocol;
      instructions = data.instructions;
      step = "success";
      onSuccess?.(data.protocol);
    } catch (err: any) {
      step = "form";
      errorMessage = err.message || "Erro de conexão ao processar recuperação.";
    }
  }

  function resetAndClose() {
    step = "form";
    cpf = "";
    newPhone = "";
    errorMessage = null;
    protocol = null;
    instructions = null;
    onClose();
  }
</script>

{#if isOpen}
  <div
    role="dialog"
    aria-modal="true"
    data-testid="contact-recovery-modal"
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 transition-opacity"
  >
    <div class="w-full max-w-lg bg-brand-surface sm:rounded-3xl rounded-t-3xl border border-white/15 p-6 sm:p-8 shadow-2xl flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-6">
      
      <!-- Cabeçalho -->
      <div class="flex items-start justify-between border-b border-white/10 pb-4">
        <div>
          <span class="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-300 uppercase tracking-wide border border-amber-500/30">
            Segurança de Conta
          </span>
          <h3 class="text-xl font-black text-white mt-1.5">Atualização Segura de Contato</h3>
          <p class="text-xs text-white/70 mt-0.5">
            Autoatendimento para recuperação de acesso vinculado ao seu CPF.
          </p>
        </div>
        <button
          type="button"
          onclick={resetAndClose}
          class="size-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold"
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>

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
                  <span class="text-[11px] text-white/60">Enviaremos um link de uso único para seu e-mail registrado na matrícula.</span>
                </div>
              </label>

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
                  <span class="text-[11px] text-white/60">Selfie rápida comparada à foto do RG/CNH homologado no sistema.</span>
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
                  <span class="text-[11px] text-white/60">Gera um protocolo prioritário para atendimento manual assistido.</span>
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
      {:else if step === "loading"}
        <div class="flex flex-col items-center justify-center py-10 text-center gap-3">
          <div class="size-10 animate-spin rounded-full border-4 border-yellow border-t-transparent"></div>
          <p class="text-sm font-bold text-white">Registrando protocolo de segurança…</p>
          <span class="text-xs text-white/60">Gravando log auditável contra sequestro de conta.</span>
        </div>
      {:else if step === "success"}
        <div class="flex flex-col gap-4 text-center items-center py-4" data-testid="recovery-success-box">
          <div class="size-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl font-black">
            ✓
          </div>

          <div>
            <h4 class="text-lg font-black text-white">Solicitação Protocolada</h4>
            <p class="text-xs text-white/70 mt-1">
              {instructions}
            </p>
          </div>

          <div class="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left backdrop-blur-md">
            <span class="text-[10px] font-bold text-white/50 uppercase tracking-wider">Número de Protocolo</span>
            <p class="font-mono text-base font-black text-yellow mt-0.5" data-testid="recovery-protocol-number">
              {protocol}
            </p>
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
    </div>
  </div>
{/if}
