<script lang="ts">
  import PixIcon from "../icons/PixIcon.svelte";
  import Badge from "@/components/ui/Badge.svelte";
  import {
    calculatePromoterWeeklyMetrics,
    type PromoterSummary,
    type PromoterCommission,
  } from "@/lib/promoter";

  interface Props {
    summary?: PromoterSummary | null;
    commissions?: PromoterCommission[];
    payoutLocked?: boolean;
    class?: string;
  }

  let {
    summary = null,
    commissions = [],
    payoutLocked = false,
    class: className = "",
  }: Props = $props();

  let metrics = $derived(calculatePromoterWeeklyMetrics(summary, commissions));
</script>

<div
  class="rounded-3xl border border-white/15 bg-white/5 backdrop-blur-md overflow-hidden p-5 sm:p-6 shadow-xl {className}"
  role="region"
  aria-label="Comissões recebidas e comissão a receber na semana"
>
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-white/10">
    <div>
      <Badge variant="conversion" size="sm" class="mb-1">
        Ciclo Semanal PIX
      </Badge>
      <h2 class="text-base sm:text-lg font-display font-bold text-white tracking-tight">
        Comissões do Promotor
      </h2>
      <p class="text-xs text-white/60">
        Extrato consolidado de comissões pagas e repasse previsto para a semana
      </p>
    </div>

    <a
      href="/promoter/active/commissions"
      class="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--yellow)] hover:text-white transition-colors self-start sm:self-auto py-1 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10"
    >
      <span>Ver extrato detalhado</span>
      <span aria-hidden="true">→</span>
    </a>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <!-- Card 1: Comissões Recebidas -->
    <div class="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-xs text-white/70 uppercase font-semibold">Comissões Recebidas</span>
          <Badge variant="success" size="sm">
            <PixIcon class="size-3 text-emerald-300" />
            <span>Pago no PIX</span>
          </Badge>
        </div>
        <p class="text-3xl font-display font-bold text-white tracking-tight mt-1">
          {metrics.receivedLabel}
        </p>
      </div>

      <div class="mt-4 pt-3 border-t border-white/10 text-xs text-white/60 flex items-center justify-between">
        <span>Total transferido em conta</span>
        <span class="text-emerald-400 font-medium">✓ 100% liquidado</span>
      </div>
    </div>

    <!-- Card 2: Comissão a Receber naquela Semana -->
    <div class="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-xs text-white/70 uppercase font-semibold">Comissão a Receber na Semana</span>
          <Badge variant="conversion" size="sm">
            Previsão do Ciclo
          </Badge>
        </div>
        <p class="text-3xl font-display font-bold text-[var(--yellow)] tracking-tight mt-1">
          {metrics.weekPendingLabel}
        </p>
      </div>

      <div class="mt-4 pt-3 border-t border-white/10 text-xs text-white/60 space-y-1.5">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <span class="text-emerald-400 font-medium">✓ {metrics.closingLabel}</span>
          {#if metrics.weekAccruedLabel && metrics.weekAccruedLabel !== metrics.weekPendingLabel}
            <span class="text-white/50 text-[11px]">(Ganhos da semana: {metrics.weekAccruedLabel})</span>
          {/if}
        </div>
        {#if payoutLocked}
          <p class="text-[var(--warning)] text-[11px] font-semibold">
            Atenção: pendência cadastral na chave Pix para o repasse.
          </p>
        {/if}
      </div>
    </div>
  </div>
</div>
