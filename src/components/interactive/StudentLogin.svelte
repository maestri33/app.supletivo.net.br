<script lang="ts">
  import { onMount } from "svelte";
  import { checkPhone } from "@/lib/api";
  import { getAccessToken, saveSession } from "@/lib/session";

  let phone = $state("");
  let busy = $state(false);
  let errorMessage = $state<string | null>(null);
  let notFound = $state(false);

  let phoneDigits = $derived(phone.replace(/\D/g, ""));
  let isPhoneValid = $derived(phoneDigits.length >= 10 && phoneDigits.length <= 11);

  onMount(() => {
    if (getAccessToken()) {
      window.location.replace("/painel");
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
    errorMessage = null;
    notFound = false;
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!isPhoneValid || busy) return;

    busy = true;
    errorMessage = null;
    notFound = false;

    try {
      const res = await checkPhone(phoneDigits);

      if (res.whatsapp === false) {
        errorMessage = "Este número não possui WhatsApp ativo. O código é enviado exclusivamente por WhatsApp.";
        busy = false;
        return;
      }

      if (res.found === false && !res.created && !res.external_id) {
        notFound = true;
        busy = false;
        return;
      }

      if (res.external_id) {
        saveSession({ phone: phoneDigits, externalId: res.external_id });
        window.location.href = "/autenticacao/otp";
      } else {
        errorMessage = "Não foi possível gerar seu código de acesso. Tente novamente.";
      }
    } catch (err: any) {
      errorMessage = err?.message || "Falha ao conectar com o servidor. Verifique sua conexão.";
    } finally {
      busy = false;
    }
  }
</script>

<div class="w-full max-w-md mx-auto my-auto p-6 sm:p-8 rounded-2xl glass-panel text-white shadow-2xl border border-white/15">
  <div class="text-center mb-6">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-xs font-semibold text-emerald-300 mb-3">
      <span class="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
      Portal do Aluno
    </div>
    <h1 class="text-2xl sm:text-3xl font-display tracking-tight text-white">
      Acesse sua conta
    </h1>
    <p class="mt-2 text-sm text-white/70 font-sans">
      Informe seu WhatsApp para receber seu código de acesso instantâneo.
    </p>
  </div>

  <form onsubmit={handleSubmit} class="space-y-4">
    <div>
      <label for="student-phone" class="block text-xs font-bold text-white/80 uppercase tracking-wider mb-2">
        Seu WhatsApp:
      </label>
      <div class="relative flex items-center">
        <span class="absolute left-4 text-emerald-400 text-base select-none">💬</span>
        <input
          id="student-phone"
          type="tel"
          inputmode="numeric"
          autocomplete="tel"
          placeholder="(11) 90000-0000"
          value={phone}
          oninput={onInput}
          disabled={busy}
          required
          class="w-full pl-11 pr-4 py-3 rounded-[10px] bg-white/5 border border-white/20 text-white placeholder:text-white/30 font-sans text-base focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition"
        />
      </div>
    </div>

    {#if errorMessage}
      <div class="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
        <span>⚠️</span>
        <span>{errorMessage}</span>
      </div>
    {/if}

    {#if notFound}
      <div class="p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-100 text-xs space-y-2">
        <p class="font-bold text-amber-300">Nenhuma matrícula localizada com este número.</p>
        <p>Ainda não iniciou seus estudos oficiais? Conclua o Ensino Fundamental ou Médio com certificado válido MEC.</p>
        <a
          href="https://supletivo.net.br"
          class="inline-block w-full py-2 px-3 text-center rounded-lg bg-amber-400 text-black font-bold hover:bg-amber-300 transition mt-1"
        >
          Fazer Minha Matrícula Oficial →
        </a>
      </div>
    {/if}

    <button
      type="submit"
      disabled={!isPhoneValid || busy}
      class="btn w-full disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    >
      {#if busy}
        <span>Enviando código...</span>
      {:else}
        <span>Receber Código de Acesso →</span>
      {/if}
    </button>
  </form>

  <div class="mt-6 pt-6 border-t border-white/10 text-center">
    <p class="text-xs text-white/50">
      Ainda não é aluno?
      <a href="https://supletivo.net.br" class="text-yellow hover:underline font-bold">
        Conheça o Supletivo Brasil
      </a>
    </p>
  </div>
</div>
