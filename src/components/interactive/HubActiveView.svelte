<script lang="ts">
  import { onMount } from "svelte";
  import { whoami, requestAuth } from "@/lib/api";

  let coordinatorName = $state<string>("Coordenador");
  let pendingReviewsCount = $state<number>(0);
  let scheduledExamsCount = $state<number>(0);
  let readyDiplomasCount = $state<number>(0);

  onMount(async () => {
    try {
      const who = await whoami();
      const roles = Array.isArray(who?.roles) ? who.roles : [];
      const isHub = roles.some((r: string) => ["coordinator", "hub", "polo"].includes(r));
      if (!isHub) {
        window.location.replace("/student");
        return;
      }
      if (who?.name) coordinatorName = who.name;
    } catch (e) {
      window.location.replace("/student");
      return;
    }

    try {
      const [revRes, stuRes] = await Promise.allSettled([
        requestAuth<any>("/api/v1/leadership/reviews"),
        requestAuth<any>("/api/v1/leadership/students"),
      ]);

      if (revRes.status === "fulfilled" && revRes.value) {
        const revData = revRes.value;
        if (Array.isArray(revData)) {
          pendingReviewsCount = revData.length;
        } else if (revData && typeof revData === "object") {
          pendingReviewsCount =
            (revData.enrollment_rg?.length || 0) +
            (revData.enrollment_selfie?.length || 0) +
            (revData.candidate_document?.length || 0) +
            (revData.candidate_selfie?.length || 0) +
            (revData.student_documents?.length || 0) +
            (revData.candidates_awaiting_approval?.length || 0);
        }
      }

      if (stuRes.status === "fulfilled" && stuRes.value) {
        const stuData = stuRes.value;
        const items = Array.isArray(stuData) ? stuData : stuData?.items || [];
        scheduledExamsCount = items.filter((s: any) => s.status === "exam_scheduled" || s.status === "exam_released").length;
        readyDiplomasCount = items.filter((s: any) => s.status === "awaiting_pickup" || s.status === "diploma_ready").length;
      }
    } catch {}
  });
</script>

<div class="w-full max-w-4xl mx-auto p-4 sm:p-6 text-white space-y-6">
  <!-- Card Principal do Hub Ativo -->
  <div class="rounded-3xl p-6 sm:p-8 glass-panel border border-white/15 bg-gradient-to-br from-ink/95 to-blue/90 shadow-2xl">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-xs font-semibold text-blue-300 mb-2">
          <span class="size-2 rounded-full bg-blue-400"></span>
          Status: Ativo
        </div>
        <h1 class="text-2xl sm:text-3xl font-display text-white">Secretaria de Polo</h1>
        <p class="text-xs sm:text-sm text-white/70 mt-1">
          Gestão operacional do polo regional sob responsabilidade de <strong>{coordinatorName}</strong>.
        </p>
      </div>

      <div>
        <a
          href="/hub/review"
          class="btn inline-flex items-center gap-2 text-xs py-3 px-6 font-bold uppercase tracking-wider text-[var(--ink)] cursor-pointer"
        >
          Fila de Revisões →
        </a>
      </div>
    </div>

    <!-- Métricas Reais do Polo -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="p-5 rounded-2xl bg-white/5 border border-white/10">
        <span class="text-xs text-white/60 uppercase font-semibold">Fila de Conferência</span>
        <p class="text-3xl font-bold text-amber-300 mt-1">{pendingReviewsCount} pendências</p>
        <p class="text-xs text-white/60 mt-1.5">RG, histórico e selfies</p>
      </div>
      <div class="p-5 rounded-2xl bg-white/5 border border-white/10">
        <span class="text-xs text-white/60 uppercase font-semibold">Bancas Presenciais</span>
        <p class="text-3xl font-bold text-blue-300 mt-1">{scheduledExamsCount} agendadas</p>
        <p class="text-xs text-white/60 mt-1.5">Exames presenciais no polo</p>
      </div>
      <div class="p-5 rounded-2xl bg-white/5 border border-white/10">
        <span class="text-xs text-white/60 uppercase font-semibold">Diplomas Prontos</span>
        <p class="text-3xl font-bold text-emerald-400 mt-1">{readyDiplomasCount} para retirada</p>
        <p class="text-xs text-white/60 mt-1.5">Aguardando assinatura do concluinte</p>
      </div>
    </div>
  </div>
</div>
