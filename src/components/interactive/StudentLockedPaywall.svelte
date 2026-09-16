<script lang="ts">
  import { onMount } from "svelte";
  import { getSession } from "@/lib/session";
  import { setLeadCheckout, getLeadCheckoutUrl, fetchPricing, type Pricing } from "@/lib/api";
  import PixCheckout from "./PixCheckout.svelte";

  // 3 Caminhos do Aluno Travado:
  // 1. "selection": Exibição dos 2 cards (PIX vs Cartão)
  // 2. "pix": Checkout nativo inline com QR Code
  // 3. "credit": Checkout externo via gateway oficial
  type PaywallMode = "selection" | "pix" | "credit";

  let mode = $state<PaywallMode>("selection");
  let busy = $state(false);
  let errorMessage = $state<string | null>(null);

  let pixToken = $state<string | null>(null);
  let creditCheckoutUrl = $state<string | null>(null);

  // Valores padrão / promocionais consultor
  let hasRef = $state(false);
  let pixPrice = $derived(hasRef ? "R$ 999,00" : "R$ 1.615,00");
  let creditPrice = $derived(hasRef ? "12x de R$ 99,00" : "12x de R$ 161,00");
  let discountBadge = $derived(hasRef ? "Desconto Especial de Consultor Aplicado" : null);

  onMount(() => {
    const session = getSession();
    if (session?.ref) {
      hasRef = true;
    }
  });

  async function selectPix() {
    busy = true;
    errorMessage = null;

    try {
      const res = await setLeadCheckout("pix");
      // Se a resposta trouxer identificador ou token de checkout:
      if (res.checkout_url) {
        // Extrai token do checkout_url ou usa payload
        const match = res.checkout_url.match(/\/pix\/([^/?]+)/);
        pixToken = match ? match[1] : res.checkout_url;
      }
      mode = "pix";
    } catch (err: any) {
      // Fallback gracioso: se o backend já tiver checkout criado
      try {
        const checkUrl = await getLeadCheckoutUrl();
        const match = checkUrl.url.match(/\/pix\/([^/?]+)/);
        if (match) {
          pixToken = match[1];
          mode = "pix";
          return;
        }
      } catch {}
      errorMessage = err?.message || "Não foi possível gerar a cobrança PIX no momento.";
    } finally {
      busy = false;
    }
  }

  async function selectCredit() {
    busy = true;
    errorMessage = null;

    try {
      const res = await setLeadCheckout("credit_card");
      if (res.checkout_url) {
        window.location.href = res.checkout_url;
      } else {
        const checkUrl = await getLeadCheckoutUrl();
        window.location.href = checkUrl.url;
      }
    } catch (err: any) {
      try {
        const checkUrl = await getLeadCheckoutUrl();
        window.location.href = checkUrl.url;
      } catch {
        errorMessage = err?.message || "Não foi possível abrir o checkout seguro de cartão.";
      }
    } finally {
      busy = false;
    }
  }

  function backToSelection() {
    mode = "selection";
    errorMessage = null;
  }
</script>

<div class="w-full max-w-3xl mx-auto p-4 sm:p-6 text-white">
  {#if mode === "selection"}
    <!-- Cabeçalho do Estado Travado -->
    <div class="text-center mb-8 space-y-2">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-xs font-semibold text-amber-300">
        <span class="size-2 rounded-full bg-amber-400 animate-pulse"></span>
        Etapa de Ativação de Matrícula
      </div>
      <h1 class="text-2xl sm:text-4xl font-display tracking-tight text-white">
        Conclua sua matrícula para liberar as aulas
      </h1>
      <p class="text-xs sm:text-sm text-white/70 max-w-lg mx-auto">
        Escolha abaixo como prefere realizar o pagamento único da sua formação do Ensino Médio.
      </p>

      {#if discountBadge}
        <div class="inline-block mt-2 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
          ★ {discountBadge}
        </div>
      {/if}
    </div>

    {#if errorMessage}
      <div class="mb-6 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-200 text-center">
        {errorMessage}
      </div>
    {/if}

    <!-- 2 Cards de Escolha (Caminho 1) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Card PIX (Caminho 2) -->
      <div class="rounded-3xl p-6 sm:p-8 glass-panel border-2 border-[var(--yellow)]/60 flex flex-col justify-between relative overflow-hidden group hover:border-[var(--yellow)] transition-all shadow-xl bg-white/[0.03]">
        <div class="absolute -right-8 -top-8 size-28 bg-[var(--yellow)]/10 rounded-full blur-2xl pointer-events-none"></div>
        <div>
          <div class="inline-flex px-2.5 py-1 rounded-md bg-[var(--yellow)] text-[var(--ink)] text-[10px] font-black uppercase tracking-wider mb-3">
            Liberação Instantânea
          </div>
          <h2 class="text-xl font-display text-white">Pagamento via PIX</h2>
          <p class="text-xs text-white/60 mt-1">À vista com o maior desconto promocional.</p>

          <div class="mt-6 mb-4">
            <span class="text-3xl sm:text-4xl font-display text-emerald-400 font-bold">{pixPrice}</span>
            <span class="text-xs text-white/50 block mt-1">taxa única sem mensalidades</span>
          </div>

          <ul class="text-xs text-white/70 space-y-2 mt-4">
            <li class="flex items-center gap-2">✓ QR Code e código copia-e-cola na hora</li>
            <li class="flex items-center gap-2">✓ Acesso liberado no mesmo minuto</li>
            <li class="flex items-center gap-2">✓ Sem consulta ao SPC/Serasa</li>
          </ul>
        </div>

        <div class="mt-8 pt-4 border-t border-white/10">
          <button
            type="button"
            onclick={selectPix}
            disabled={busy}
            class="btn w-full py-3 text-sm font-bold text-[var(--ink)] uppercase tracking-wide cursor-pointer disabled:opacity-50"
          >
            {busy ? "Gerando PIX..." : "Pagar com PIX →"}
          </button>
        </div>
      </div>

      <!-- Card Cartão de Crédito (Caminho 3) -->
      <div class="rounded-3xl p-6 sm:p-8 glass-panel border border-white/15 flex flex-col justify-between relative overflow-hidden group hover:border-white/30 transition-all shadow-xl bg-white/[0.02]">
        <div>
          <div class="inline-flex px-2.5 py-1 rounded-md bg-white/10 text-white/80 text-[10px] font-bold uppercase tracking-wider mb-3">
            Até 12x Sem Juros
          </div>
          <h2 class="text-xl font-display text-white">Cartão de Crédito</h2>
          <p class="text-xs text-white/60 mt-1">Parcelamento facilitado em ambiente seguro.</p>

          <div class="mt-6 mb-4">
            <span class="text-3xl sm:text-4xl font-display text-white font-bold">{creditPrice}</span>
            <span class="text-xs text-white/50 block mt-1">ou parcelado no seu cartão</span>
          </div>

          <ul class="text-xs text-white/70 space-y-2 mt-4">
            <li class="flex items-center gap-2">✓ Pagamento seguro via gateway oficial</li>
            <li class="flex items-center gap-2">✓ Liberação rápida após confirmação</li>
            <li class="flex items-center gap-2">✓ Certificado válido pelo MEC incluso</li>
          </ul>
        </div>

        <div class="mt-8 pt-4 border-t border-white/10">
          <button
            type="button"
            onclick={selectCredit}
            disabled={busy}
            class="w-full py-3 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 text-white text-sm font-bold uppercase tracking-wide cursor-pointer transition-colors disabled:opacity-50"
          >
            {busy ? "Abrindo Checkout..." : "Pagar no Cartão ↗"}
          </button>
        </div>
      </div>
    </div>

  {:else if mode === "pix"}
    <!-- Caminho 2: Checkout PIX Inline -->
    <div class="space-y-4">
      <div class="flex items-center justify-between pb-2 border-b border-white/10">
        <button
          type="button"
          onclick={backToSelection}
          class="inline-flex items-center gap-2 text-xs text-white/70 hover:text-white transition-colors"
        >
          ← Voltar para as opções de pagamento
        </button>
        <span class="text-xs text-emerald-400 font-bold">Checkout PIX Ativo</span>
      </div>

      {#if pixToken}
        <PixCheckout token={pixToken} />
      {:else}
        <div class="text-center p-8 glass-panel rounded-3xl border border-white/15">
          <p class="text-sm text-white/70">Carregando dados da sua chave PIX...</p>
        </div>
      {/if}
    </div>
  {/if}
</div>
