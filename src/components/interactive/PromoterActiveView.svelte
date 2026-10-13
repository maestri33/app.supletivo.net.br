<script lang="ts">
  import { onMount } from "svelte";
  import { requestAuth, getErrorMessage } from "@/lib/api";
  import { commissionTotal, moneyLabel, type PromoterProfile, type PromoterSummary, type PromoterLead, type PromoterCommission } from "@/lib/promoter";
  import PromoterReferralShare from "./PromoterReferralShare.svelte";

  let promoterName = $state<string>("Promotor");
  let referralUrl = $state<string>("");
  let leadsCount = $state<number>(0);
  let paidEnrollmentsCount = $state<number>(0);
  let pendingPixBalance = $state<string>("");
  let loading = $state(true);
  let error = $state("");
  let payoutLocked = $state(false);

  let weekPaidLeads = $state(0);

  async function load() {
    loading = true;
    error = "";
    try {
      const [profile, summary, leads, commissions] = await Promise.all([
        requestAuth<PromoterProfile>("/api/v1/collaborators/promoter/me"),
        requestAuth<PromoterSummary>("/api/v1/collaborators/promoter/summary"),
        requestAuth<PromoterLead[]>("/api/v1/collaborators/promoter/leads"),
        requestAuth<PromoterCommission[]>("/api/v1/collaborators/promoter/commissions"),
      ]);
      if (profile.status === "suspended") { window.location.replace("/promoter/suspended"); return; }
      if (profile.locked) { window.location.replace("/promoter/training"); return; }
      promoterName = profile.name ?? "Promotor";
      referralUrl = profile.ref_url;
      payoutLocked = profile.payout_locked;
      leadsCount = leads.length;
      paidEnrollmentsCount = summary.lifetime.total_students;
      weekPaidLeads = summary.week_paid_leads;
      pendingPixBalance = moneyLabel(commissionTotal(commissions, ["pending", "processed"]));
      window.dispatchEvent(new CustomEvent("supletivo:promoter-state", { detail: { status: "active", newLeadsCount: leadsCount } }));
    } catch (cause) { error = getErrorMessage(cause); }
    finally { loading = false; }
  }
  onMount(() => { void load(); });

</script>

<div class="w-full max-w-4xl mx-auto p-4 sm:p-6 text-white space-y-6">
  {#if loading}<p role="status">Consultando seu painel…</p>
  {:else if error}<div role="alert" class="text-[var(--danger)]"><p>{error}</p><button type="button" class="btn min-h-12 px-5 mt-3" onclick={load}>Tentar novamente</button></div>
  {:else}
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
          Olá, <strong>{promoterName}</strong>! Compartilhe seu link exclusivo e acompanhe suas comissões.
        </p>
      </div>

    </div>

    <!-- Link Box -->
    <div id="referral" class="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-2 text-xs">
      <span class="text-white/60">Seu Link Oficial:</span>
      <code class="text-[var(--yellow)] font-mono truncate select-all">{referralUrl}</code>
    </div>
    <div class="mt-4"><PromoterReferralShare url={referralUrl} /></div>

    <!-- Métricas Reais -->
    {#if payoutLocked}<p role="status" class="text-[var(--warning)]">O repasse tem pendências cadastrais. Consulte suas comissões e regularize a chave Pix.</p>{/if}
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
      <div class="p-5 rounded-2xl bg-white/5 border border-white/10">
        <span class="text-xs text-white/60 uppercase font-semibold">Indicados no extrato recente</span>
        <p class="text-3xl font-bold text-white mt-1">{leadsCount}</p>
        <p class="text-xs text-emerald-400 mt-1.5">Até 200 indicações mais recentes</p>
      </div>
      <div class="p-5 rounded-2xl bg-white/5 border border-white/10">
        <span class="text-xs text-white/60 uppercase font-semibold">Matrículas Pagas</span>
        <p class="text-3xl font-bold text-white mt-1">{paidEnrollmentsCount}</p>
        <p class="text-xs text-white/70 mt-1.5">Nesta semana: {weekPaidLeads} matrícula(s) paga(s)</p>
      </div>
      <div class="p-5 rounded-2xl bg-white/5 border border-white/10">
        <span class="text-xs text-white/60 uppercase font-semibold">Comissões do extrato recente</span>
        <p class="text-3xl font-bold text-[var(--yellow)] mt-1">{pendingPixBalance}</p>
        <p class="text-xs text-white/70 mt-1.5">Pendentes e processadas nos últimos 200 registros</p>
      </div>
    </div>
  </div>
  {/if}
</div>
