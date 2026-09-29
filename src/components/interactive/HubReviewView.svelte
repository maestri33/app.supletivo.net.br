<script lang="ts">
  import { onMount } from "svelte";
  import { whoami, requestAuth } from "@/lib/api";

  interface ReviewItem {
    id: string;
    type: string;
    kind: string;
    name: string;
    doc: string;
    status: "pending" | "approved" | "rejected";
  }

  let coordinatorName = $state<string>("Coordenador");
  let items = $state<ReviewItem[]>([]);
  let loading = $state<boolean>(true);

  onMount(async () => {
    try {
      const who = await whoami();
      if (who?.name) coordinatorName = who.name;
    } catch (e) {}

    try {
      const data = await requestAuth<any>("/api/v1/leadership/reviews");
      const rawList = Array.isArray(data)
        ? data
        : [
            ...(data?.enrollment_rg || []),
            ...(data?.enrollment_selfie || []),
            ...(data?.candidate_document || []),
            ...(data?.candidate_selfie || []),
            ...(data?.student_documents || []),
            ...(data?.candidates_awaiting_approval || []),
          ];
      items = rawList.map((r: any) => ({
        id: String(r.external_id || r.id),
        type: r.type || "enrollment",
        kind: r.kind || "rg",
        name: r.name || "Aluno",
        doc: r.reason || r.doc || `${r.type || "enrollment"} / ${r.kind || "rg"}`,
        status: r.status || "pending",
      }));
    } catch {
      items = [];
    } finally {
      loading = false;
    }
  });

  async function decideItem(id: string, approve: boolean) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    try {
      const safeId = encodeURIComponent(id);
      let decisionUrl = `/api/v1/leadership/enrollments/${safeId}/rg/decide`;
      if (item.type === "enrollment" && item.kind === "selfie") {
        decisionUrl = `/api/v1/leadership/enrollments/${safeId}/selfie/decide`;
      } else if (item.type === "enrollment" && item.kind === "address") {
        decisionUrl = `/api/v1/leadership/enrollments/${safeId}/address-proof/decide`;
      } else if (item.type === "candidate" && item.kind === "selfie") {
        decisionUrl = `/api/v1/leadership/candidates/${safeId}/selfie/decide`;
      } else if (item.type === "candidate" && item.kind === "awaiting_approval") {
        decisionUrl = approve
          ? `/api/v1/leadership/candidates/${safeId}/approve`
          : `/api/v1/leadership/candidates/${safeId}/reject`;
      } else if (item.type === "candidate") {
        decisionUrl = `/api/v1/leadership/candidates/${safeId}/document/decide`;
      }

      await requestAuth(decisionUrl, {
        method: "POST",
        json: {
          approve,
          reason: approve ? null : "Correção solicitada pelo coordenador do polo",
        },
      });
    } catch {
      // Atualiza estado visual
    }
    items = items.map((i) => (i.id === id ? { ...i, status: approve ? "approved" : "rejected" } : i));
  }
</script>

<div class="w-full max-w-4xl mx-auto p-4 sm:p-6 text-white space-y-6">
  <!-- Card de Atenção: Fila de Revisões -->
  <div class="rounded-3xl p-6 sm:p-8 glass-panel border border-amber-500/40 bg-gradient-to-br from-amber-950/60 to-blue-deep/90 shadow-2xl">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-xs font-semibold text-amber-300 mb-2">
          <span class="size-2 rounded-full bg-amber-400 animate-pulse"></span>
          Status de Atenção: Revisão
        </div>
        <h1 class="text-2xl sm:text-3xl font-display text-white">Central de Análises do Polo</h1>
        <p class="text-xs sm:text-sm text-amber-100/80 mt-1">
          Pendências documentais de matrículas e aprovações de novos consultores aguardando validação presencial ou documental do coordenador.
        </p>
      </div>

      <div>
        <a
          href="/hub/active"
          class="inline-flex items-center gap-2 text-xs py-2.5 px-5 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
        >
          ← Visão Geral do Polo
        </a>
      </div>
    </div>

    <!-- Lista de Itens para Revisão -->
    {#if loading}
      <div class="p-8 text-center text-xs text-white/60">Carregando fila de revisões do polo...</div>
    {:else if items.length === 0}
      <div class="p-8 rounded-2xl border border-dashed border-white/15 text-center text-xs text-white/70">
        🎉 Nenhuma pendência documental na fila do polo no momento.
      </div>
    {:else}
      <div class="space-y-3">
        {#each items as item (item.id)}
          <div class="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded font-bold uppercase text-[10px] {item.type === 'enrollment' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'}">
                  {item.type === 'enrollment' ? 'Matrícula' : 'Promotor'}
                </span>
                <strong class="text-sm font-bold text-white">{item.name}</strong>
              </div>
              <p class="text-white/60">{item.doc}</p>
            </div>

            <div class="flex items-center gap-2">
              {#if item.status === "pending"}
                <button
                  type="button"
                  onclick={() => decideItem(item.id, true)}
                  class="px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/30 font-bold transition-colors cursor-pointer"
                >
                  ✓ Homologar
                </button>
                <button
                  type="button"
                  onclick={() => decideItem(item.id, false)}
                  class="px-3.5 py-2 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-300 hover:bg-rose-500/30 font-bold transition-colors cursor-pointer"
                >
                  ✕ Solicitar Correção
                </button>
              {:else if item.status === "approved"}
                <span class="text-emerald-400 font-bold px-3 py-1 bg-emerald-500/10 rounded-lg">
                  ✓ Homologado
                </span>
              {:else}
                <span class="text-rose-400 font-bold px-3 py-1 bg-rose-500/10 rounded-lg">
                  ✕ Notificado para Correção
                </span>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
