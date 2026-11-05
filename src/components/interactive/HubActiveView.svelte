<script lang="ts">
  import { onMount } from "svelte";
  import { whoami, requestAuth } from "@/lib/api";
  import Badge from "@/components/ui/Badge.svelte";
  import Alert from "@/components/ui/Alert.svelte";
  import Skeleton from "@/components/ui/Skeleton.svelte";

  interface LeadershipStudentItem {
    id?: string;
    status?: string;
  }

  interface LeadershipReviewsPayload {
    enrollment_rg?: unknown[];
    enrollment_selfie?: unknown[];
    enrollment_address_proof?: unknown[];
    candidate_document?: unknown[];
    candidate_selfie?: unknown[];
    student_documents?: unknown[];
    candidates_awaiting_approval?: unknown[];
  }

  interface LeadershipStudentsPayload {
    items?: LeadershipStudentItem[];
  }

  let coordinatorName = $state<string>("Coordenador");
  let pendingReviewsCount = $state<number>(0);
  let scheduledExamsCount = $state<number>(0);
  let readyDiplomasCount = $state<number>(0);
  let isLoading = $state<boolean>(true);
  let loadError = $state<string | null>(null);

  async function loadHubData() {
    isLoading = true;
    loadError = null;

    try {
      const who = await whoami();
      const roles = Array.isArray(who?.roles) ? who.roles : [];
      const isHub = roles.some((r: string) => ["coordinator", "hub", "polo"].includes(r));
      if (!isHub) {
        window.location.replace("/student");
        return;
      }
      if (who?.name) coordinatorName = who.name;
    } catch {
      try {
        const raw = localStorage.getItem("supletivo.login");
        if (raw) {
          const sess = JSON.parse(raw);
          const roles = Array.isArray(sess?.roles) ? sess.roles : [];
          const isHub = roles.some((r: string) => ["coordinator", "hub", "polo"].includes(r));
          if (!isHub) {
            window.location.replace("/student");
            return;
          }
          if (sess?.name) coordinatorName = sess.name;
        } else {
          window.location.replace("/student");
          return;
        }
      } catch {
        window.location.replace("/student");
        return;
      }
    }

    try {
      const [revRes, stuRes] = await Promise.allSettled([
        requestAuth<LeadershipReviewsPayload | unknown[]>("/api/v1/leadership/reviews"),
        requestAuth<LeadershipStudentsPayload | LeadershipStudentItem[]>("/api/v1/leadership/students"),
      ]);

      if (revRes.status === "fulfilled" && revRes.value) {
        const revData = revRes.value;
        if (Array.isArray(revData)) {
          pendingReviewsCount = revData.length;
        } else if (revData && typeof revData === "object") {
          const payload = revData as LeadershipReviewsPayload;
          pendingReviewsCount =
            (payload.enrollment_rg?.length || 0) +
            (payload.enrollment_selfie?.length || 0) +
            (payload.enrollment_address_proof?.length || 0) +
            (payload.candidate_document?.length || 0) +
            (payload.candidate_selfie?.length || 0) +
            (payload.student_documents?.length || 0) +
            (payload.candidates_awaiting_approval?.length || 0);
        }
      } else if (revRes.status === "rejected") {
        throw revRes.reason;
      }

      if (stuRes.status === "fulfilled" && stuRes.value) {
        const stuData = stuRes.value;
        const items: LeadershipStudentItem[] = Array.isArray(stuData)
          ? stuData
          : (stuData as LeadershipStudentsPayload)?.items || [];
        scheduledExamsCount = items.filter((s) => s.status === "exam_scheduled" || s.status === "exam_released").length;
        readyDiplomasCount = items.filter((s) => s.status === "awaiting_pickup" || s.status === "diploma_ready").length;
      } else if (stuRes.status === "rejected") {
        throw stuRes.reason;
      }
      window.dispatchEvent(new CustomEvent("supletivo:polo-state", { detail: {
        pendingValidationCount: pendingReviewsCount, pendingExamsCount: scheduledExamsCount, readyDiplomasCount,
      } }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao carregar indicadores operacionais do polo.";
      loadError = msg;
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadHubData();
  });
</script>

<div class="w-full max-w-4xl mx-auto p-4 sm:p-6 text-white space-y-6">
  <!-- Card Principal do Hub Ativo -->
  <div class="rounded-3xl p-6 sm:p-8 glass-panel border border-white/15 bg-gradient-to-br from-ink/95 to-blue/90 shadow-2xl">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
      <div>
        <Badge variant="info" pulse size="md" class="mb-2">
          Status: Ativo
        </Badge>
        <h1 class="text-2xl sm:text-3xl font-display text-white">Secretaria de Polo (Hub)</h1>
        <p class="text-xs sm:text-sm text-white/70 mt-1">
          Gestão operacional do polo regional sob responsabilidade de <strong>{coordinatorName}</strong>.
        </p>
      </div>

      <div>
        <a href="/hub/active/operations" class="btn inline-flex items-center gap-2 text-xs py-3 px-6 font-bold text-[var(--ink)] cursor-pointer">Gerenciar alunos →</a>
        <a
          href="/hub/review"
          class="btn inline-flex items-center gap-2 text-xs py-3 px-6 font-bold uppercase tracking-wider text-[var(--ink)] cursor-pointer"
        >
          Fila de Revisões →
        </a>
      </div>
    </div>

    {#if loadError}
      <Alert
        variant="danger"
        title="Erro operacional no polo"
        description={loadError}
        class="mb-4"
      >
        <button
          type="button"
          onclick={loadHubData}
          class="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-white font-semibold cursor-pointer transition-colors mt-2"
        >
          Tentar novamente
        </button>
      </Alert>
    {/if}

    <!-- Métricas Reais do Polo -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="p-5 rounded-2xl bg-white/5 border border-white/10">
        <span class="text-xs text-white/60 uppercase font-semibold">Fila de Conferência</span>
        <div class="mt-1">
          {#if isLoading}
            <Skeleton class="h-9 w-28 rounded-lg" />
          {:else if loadError}
            <span class="text-sm font-normal text-white/50">Indisponível</span>
          {:else}
            <p class="text-3xl font-bold text-amber-300">
              {pendingReviewsCount} pendências
            </p>
          {/if}
        </div>
        <p class="text-xs text-white/60 mt-1.5">RG, histórico e selfies</p>
      </div>
      <div class="p-5 rounded-2xl bg-white/5 border border-white/10">
        <span class="text-xs text-white/60 uppercase font-semibold">Provas presenciais</span>
        <div class="mt-1">
          {#if isLoading}
            <Skeleton class="h-9 w-28 rounded-lg" />
          {:else if loadError}
            <span class="text-sm font-normal text-white/50">Indisponível</span>
          {:else}
            <p class="text-3xl font-bold text-blue-300">
              {scheduledExamsCount} agendadas
            </p>
          {/if}
        </div>
        <p class="text-xs text-white/60 mt-1.5">Exames presenciais no polo</p>
      </div>
      <div class="p-5 rounded-2xl bg-white/5 border border-white/10">
        <span class="text-xs text-white/60 uppercase font-semibold">Diplomas Prontos</span>
        <div class="mt-1">
          {#if isLoading}
            <Skeleton class="h-9 w-28 rounded-lg" />
          {:else if loadError}
            <span class="text-sm font-normal text-white/50">Indisponível</span>
          {:else}
            <p class="text-3xl font-bold text-emerald-400">
              {readyDiplomasCount} prontos
            </p>
          {/if}
        </div>
        <p class="text-xs text-white/60 mt-1.5">Aguardando assinatura do concluinte</p>
      </div>
    </div>
  </div>
</div>
