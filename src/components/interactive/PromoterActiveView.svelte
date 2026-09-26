<script lang="ts">
  import { onMount } from "svelte";
  import { whoami } from "@/lib/api";

  let promoterName = $state<string>("Promotor");
  let externalId = $state<string>("");
  let copied = $state<boolean>(false);

  let referralUrl = $derived(
    externalId
      ? `https://supletivo.net.br?ref=${externalId}`
      : "https://supletivo.net.br"
  );

  onMount(async () => {
    try {
      const who = await whoami();
      if (who?.name) promoterName = who.name;
      if (who?.external_id) externalId = who.external_id;
    } catch (e) {}
  });

  function copyReferralLink() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(referralUrl);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2500);
    }
  }
</script>

<div class="w-full max-w-4xl mx-auto p-4 sm:p-6 text-white space-y-6">
  <!-- Card Principal do Promotor Ativo -->
  <div class="rounded-3xl p-6 sm:p-8 glass-panel border border-white/15 bg-gradient-to-br from-[#005238]/90 to-[#002776]/90 shadow-2xl">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-xs font-semibold text-emerald-300 mb-2">
          <span class="size-2 rounded-full bg-emerald-400"></span>
          Status: Ativo (active)
        </div>
        <h1 class="text-2xl sm:text-3xl font-display text-white">Painel do Promotor</h1>
        <p class="text-xs sm:text-sm text-white/70 mt-1">
          Olá, <strong>{promoterName}</strong>! Compartilhe seu link exclusivo e receba comissões automáticas no PIX.
        </p>
      </div>

      <div>
        <button
          type="button"
          onclick={copyReferralLink}
          class="btn inline-flex items-center gap-2 text-xs py-3 px-6 font-bold uppercase tracking-wider text-[var(--ink)] cursor-pointer"
        >
          {copied ? "✓ Link Copiado!" : "Copiar Link ?ref 🔗"}
        </button>
      </div>
    </div>

    <!-- Link Box -->
    <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-2 text-xs">
      <span class="text-white/60">Seu Link Oficial:</span>
      <code class="text-[var(--yellow)] font-mono truncate select-all">{referralUrl}</code>
      <button
        type="button"
        onclick={copyReferralLink}
        class="text-white/80 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-colors"
      >
        Copiar
      </button>
    </div>

    <!-- Métricas -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
      <div class="p-5 rounded-2xl bg-white/5 border border-white/10">
        <span class="text-xs text-white/60 uppercase font-semibold">Leads Captados</span>
        <p class="text-3xl font-bold text-white mt-1">24</p>
        <p class="text-xs text-emerald-400 mt-1.5">+3 nas últimas 24h</p>
      </div>
      <div class="p-5 rounded-2xl bg-white/5 border border-white/10">
        <span class="text-xs text-white/60 uppercase font-semibold">Matrículas Pagas</span>
        <p class="text-3xl font-bold text-white mt-1">18</p>
        <p class="text-xs text-white/70 mt-1.5">Taxa de conversão: 75%</p>
      </div>
      <div class="p-5 rounded-2xl bg-white/5 border border-white/10">
        <span class="text-xs text-white/60 uppercase font-semibold">Comissões no PIX</span>
        <p class="text-3xl font-bold text-[var(--yellow)] mt-1">R$ 2.450,00</p>
        <p class="text-xs text-white/70 mt-1.5">Próximo fechamento semanal</p>
      </div>
    </div>
  </div>
</div>
