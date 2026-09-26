<script lang="ts">
  import { onMount } from "svelte";
  import { whoami } from "@/lib/api";

  let coordinatorName = $state<string>("Coordenador");

  onMount(async () => {
    try {
      const who = await whoami();
      if (who?.name) coordinatorName = who.name;
    } catch (e) {}
  });
</script>

<div class="w-full max-w-4xl mx-auto p-4 sm:p-6 text-white space-y-6">
  <!-- Card Principal do Hub Ativo -->
  <div class="rounded-3xl p-6 sm:p-8 glass-panel border border-white/15 bg-gradient-to-br from-[#0b1220]/95 to-[#002776]/90 shadow-2xl">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-xs font-semibold text-blue-300 mb-2">
          <span class="size-2 rounded-full bg-blue-400"></span>
          Status: Ativo (active)
        </div>
        <h1 class="text-2xl sm:text-3xl font-display text-white">Secretaria de Polo (Hub)</h1>
        <p class="text-xs sm:text-sm text-white/70 mt-1">
          Gestão operacional do polo regional sob responsabilidade de <strong>{coordinatorName}</strong>.
        </p>
      </div>

      <div>
        <a
          href="/hub/review"
          class="btn inline-flex items-center gap-2 text-xs py-3 px-6 font-bold uppercase tracking-wider text-[var(--ink)] cursor-pointer"
        >
          Fila de Revisões (review) →
        </a>
      </div>
    </div>

    <!-- Métricas do Polo -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="p-5 rounded-2xl bg-white/5 border border-white/10">
        <span class="text-xs text-white/60 uppercase font-semibold">Fila de Conferência</span>
        <p class="text-3xl font-bold text-amber-300 mt-1">5 pendências</p>
        <p class="text-xs text-white/60 mt-1.5">RG, histórico e selfies</p>
      </div>
      <div class="p-5 rounded-2xl bg-white/5 border border-white/10">
        <span class="text-xs text-white/60 uppercase font-semibold">Bancas Presenciais</span>
        <p class="text-3xl font-bold text-blue-300 mt-1">2 agendadas</p>
        <p class="text-xs text-white/60 mt-1.5">Próxima sessão: Quinta-feira</p>
      </div>
      <div class="p-5 rounded-2xl bg-white/5 border border-white/10">
        <span class="text-xs text-white/60 uppercase font-semibold">Diplomas Prontos</span>
        <p class="text-3xl font-bold text-emerald-400 mt-1">4 para retirada</p>
        <p class="text-xs text-white/60 mt-1.5">Aguardando assinatura do concluinte</p>
      </div>
    </div>
  </div>
</div>
