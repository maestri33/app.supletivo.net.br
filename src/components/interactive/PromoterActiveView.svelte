<script lang="ts">
  import { onMount } from "svelte";
  import { whoami, requestAuth } from "@/lib/api";

  let promoterName = $state<string>("Promotor");
  let externalId = $state<string>("");
  let copied = $state<boolean>(false);
  let leadsCount = $state<number>(0);
  let paidEnrollmentsCount = $state<number>(0);
  let pendingPixBalance = $state<string>("R$ 0,00");

  let referralUrl = $derived(
    externalId
      ? `https://supletivo.net.br?ref=${externalId}`
      : "https://supletivo.net.br"
  );

  let conversionRate = $derived(
    leadsCount > 0 ? Math.round((paidEnrollmentsCount / leadsCount) * 100) : 0
  );

  onMount(async () => {
    try {
      const who = await whoami();
      const status = who?.role_statuses?.promoter;
      if (status === "candidate") {
        window.location.replace("/promoter/candidate");
        return;
      }
      if (status === "training") {
        window.location.replace("/promoter/training");
        return;
      }
      if (who?.name) promoterName = who.name;
      if (who?.external_id) externalId = who.external_id;
    } catch (e) {}

    try {
      const [meRes, sumRes] = await Promise.allSettled([
        requestAuth<any>("/api/v1/collaborators/promoter/me"),
        requestAuth<any>("/api/v1/collaborators/promoter/summary"),
      ]);

      if (meRes.status === "fulfilled" && meRes.value) {
        const meData = meRes.value;
        if (meData?.name) promoterName = meData.name;
        if (meData?.external_id) externalId = meData.external_id;
      }

      if (sumRes.status === "fulfilled" && sumRes.value) {
        const sumData = sumRes.value;
        leadsCount = Number(sumData?.total_leads ?? sumData?.leads_count ?? 0);
        paidEnrollmentsCount = Number(sumData?.total_sales ?? sumData?.paid_count ?? 0);
        const rawBal = parseFloat(String(sumData?.pending_amount ?? sumData?.total_earned ?? "0")) || 0;
        pendingPixBalance = `R$ ${rawBal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    } catch {}
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
  <div class="rounded-3xl p-6 sm:p-8 glass-panel border border-white/15 bg-gradient-to-br from-green-deep/90 to-blue/90 shadow-2xl">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-xs font-semibold text-emerald-300 mb-2">
          <span class="size-2 rounded-full bg-emerald-400"></span>
          Status: Ativo
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
          {copied ? "✓ Link Copiado!" : "Copiar Link de Indicação 🔗"}
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

    <!-- Métricas Reais -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
      <div class="p-5 rounded-2xl bg-white/5 border border-white/10">
        <span class="text-xs text-white/60 uppercase font-semibold">Indicados Captados</span>
        <p class="text-3xl font-bold text-white mt-1">{leadsCount}</p>
        <p class="text-xs text-emerald-400 mt-1.5">Vinculados ao seu link</p>
      </div>
      <div class="p-5 rounded-2xl bg-white/5 border border-white/10">
        <span class="text-xs text-white/60 uppercase font-semibold">Matrículas Pagas</span>
        <p class="text-3xl font-bold text-white mt-1">{paidEnrollmentsCount}</p>
        <p class="text-xs text-white/70 mt-1.5">Taxa de conversão: {conversionRate}%</p>
      </div>
      <div class="p-5 rounded-2xl bg-white/5 border border-white/10">
        <span class="text-xs text-white/60 uppercase font-semibold">Comissões no PIX</span>
        <p class="text-3xl font-bold text-[var(--yellow)] mt-1">{pendingPixBalance}</p>
        <p class="text-xs text-white/70 mt-1.5">R$ 100/matrícula + R$ 500 a cada 5</p>
      </div>
    </div>
  </div>
</div>
