<script lang="ts">
  import { onMount } from "svelte";
  import { checkPhone, whoami } from "@/lib/api";
  import { getAccessToken, saveSession } from "@/lib/session";
  import { isValidBrMobile } from "@/lib/phone";
  import { getPrimaryEnvironment } from "@/lib/roles";
  import UnregisteredRoleModal from "@/components/interactive/UnregisteredRoleModal.svelte";

  let phone = $state("");
  let busy = $state(false);
  let errorMessage = $state<string | null>(null);
  let notFound = $state(false);
  let isRoleModalOpen = $state(false);
  let isRoleSubmitting = $state(false);

  let phoneDigits = $derived(phone.replace(/\D/g, ""));
  let isPhoneComplete = $derived(isValidBrMobile(phoneDigits));

  let mounted = $state(false);

  onMount(async () => {
    mounted = true;
    if (getAccessToken()) {
      try {
        const who = await whoami();
        const target = getPrimaryEnvironment(who?.roles || []);
        window.location.replace(`/${target}`);
      } catch {
        window.location.replace("/student");
      }
    }
  });

  function formatPhone(val: string) {
    const d = val.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  function onInput(e: Event) {
    const target = e.target as HTMLInputElement;
    phone = formatPhone(target.value);
    target.value = phone;
    errorMessage = null;
    notFound = false;
    isRoleModalOpen = false;

    const digits = phone.replace(/\D/g, "");
    // Trigger Zero-Button: ao atingir 11 dígitos válidos, dispara automaticamente
    if (isValidBrMobile(digits) && !busy) {
      triggerAutoSubmit(digits);
    }
  }

  async function triggerAutoSubmit(digits: string) {
    busy = true;
    errorMessage = null;
    notFound = false;
    isRoleModalOpen = false;

    try {
      const res = await checkPhone(digits);

      if (res.whatsapp === false) {
        errorMessage = "Este número não possui WhatsApp ativo. O código é enviado exclusivamente por WhatsApp.";
        busy = false;
        return;
      }

      // Se o número existe no WhatsApp mas NÃO possui cadastro no banco:
      // Exibe modal com 2 cards para escolha: Quero ser Aluno ou Quero ser Promotor
      if (res.found === false && !res.created && !res.external_id) {
        busy = false;
        notFound = false;
        isRoleModalOpen = true;
        return;
      }

      if (res.external_id) {
        saveSession({ phone: digits, externalId: res.external_id });
        window.location.href = `/autenticacao/otp?id=${encodeURIComponent(res.external_id)}&tel=${encodeURIComponent(digits)}`;
      } else {
        window.location.href = `/autenticacao/otp?tel=${encodeURIComponent(digits)}`;
      }
    } catch (err: any) {
      errorMessage = err?.message || "Não foi possível conectar. Tente novamente em instantes.";
      busy = false;
    }
  }

  function onRoleSelect(role: "aluno" | "promotor") {
    isRoleSubmitting = true;
    const digits = phone.replace(/\D/g, "");

    if (role === "promotor") {
      saveSession({ phone: digits, role: "promotor" });
      const target = digits
        ? `https://promotor.supletivo.net.br?tel=${encodeURIComponent(digits)}&modal=cadastro`
        : "https://promotor.supletivo.net.br";
      window.location.href = target;
    } else {
      saveSession({ phone: digits, role: "aluno" });
      const target = digits
        ? `https://supletivo.net.br?tel=${encodeURIComponent(digits)}&modal=cadastro`
        : "https://supletivo.net.br";
      window.location.href = target;
    }
  }
</script>

<div class="w-full max-w-md mx-auto p-6 sm:p-8 rounded-3xl glass-panel border border-white/15 text-white shadow-2xl relative overflow-hidden backdrop-blur-2xl">
  <div class="flex justify-center mb-6">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--green)]/15 border border-[var(--green)]/30 text-xs font-semibold text-emerald-300">
      <span class="size-2 rounded-full bg-[var(--green)] animate-pulse"></span>
      Acesso Universal à Plataforma
    </div>
  </div>

  <div class="text-center mb-6">
    <h1 class="text-2xl sm:text-3xl font-display tracking-tight text-white">
      Acesse sua conta
    </h1>
    <p class="text-xs sm:text-sm text-white/70 font-sans mt-2">
      Digite seu WhatsApp. O sistema valida e avança automaticamente.
    </p>
  </div>

  {#if errorMessage}
    <div class="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-200 text-center">
      {errorMessage}
    </div>
  {/if}

  {#if notFound}
    <div class="mb-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200 text-center">
      Não encontramos um cadastro vinculado a este número.
      <a href="https://supletivo.net.br" class="underline font-bold text-white block mt-1">
        Conheça os cursos e inicie sua inscrição →
      </a>
    </div>
  {/if}

  <div class="space-y-4">
    <div>
      <label for="phone" class="block text-xs font-semibold uppercase tracking-wider text-white/80 mb-2">
        Seu WhatsApp:
      </label>
      <div class="relative">
        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-lg opacity-70 pointer-events-none">
          💬
        </span>
        <input
          id="phone"
          data-hydrated={mounted}
          type="tel"
          inputmode="numeric"
          autocomplete="tel"
          placeholder="(11) 90000-0000"
          value={phone}
          oninput={onInput}
          disabled={busy}
          class="w-full h-12 pl-12 pr-12 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 text-base font-medium focus:outline-none focus:border-[var(--yellow)] focus:ring-1 focus:ring-[var(--yellow)] transition-all disabled:opacity-50"
        />
        {#if busy}
          <div class="absolute right-4 top-1/2 -translate-y-1/2">
            <span class="inline-block size-5 border-2 border-white/30 border-t-[var(--yellow)] rounded-full animate-spin"></span>
          </div>
        {/if}
      </div>
    </div>

    <div class="pt-2 text-center">
      {#if busy}
        <div class="inline-flex items-center gap-2 text-xs text-[var(--yellow)] font-medium">
          <span class="size-1.5 rounded-full bg-[var(--yellow)] animate-ping"></span>
          Validando número e gerando acesso...
        </div>
      {:else if isPhoneComplete}
        <div class="inline-flex items-center gap-2 text-xs text-emerald-400 font-medium">
          ✓ WhatsApp verificado
        </div>
      {:else}
        <div class="text-[11px] text-white/50">
          Avanço automático ao completar 11 dígitos
        </div>
      {/if}
    </div>
  </div>

  <div class="mt-6 pt-6 border-t border-white/10 text-center text-xs text-white/60">
    Ainda não possui cadastro?
    <button
      type="button"
      onclick={() => { isRoleModalOpen = true; }}
      class="text-[var(--yellow)] font-bold hover:underline ml-1 cursor-pointer bg-transparent border-none p-0"
    >
      Conheça as opções de acesso
    </button>
  </div>
</div>

<UnregisteredRoleModal
  isOpen={isRoleModalOpen}
  phone={phone}
  isSubmitting={isRoleSubmitting}
  onClose={() => { isRoleModalOpen = false; }}
  onSelectRole={onRoleSelect}
/>
