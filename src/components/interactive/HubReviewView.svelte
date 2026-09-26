<script lang="ts">
  import { onMount } from "svelte";
  import { whoami } from "@/lib/api";

  let coordinatorName = $state<string>("Coordenador");
  let items = $state([
    { id: 1, type: "enrollment", kind: "rg", name: "Maria Clara Santos", doc: "RG Frente + Verso", status: "pending" },
    { id: 2, type: "enrollment", kind: "selfie", name: "João Pedro Oliveira", doc: "Selfie com Documento", status: "pending" },
    { id: 3, type: "candidate", kind: "selfie", name: "Carlos Eduardo Silva", doc: "Credenciamento de Promotor", status: "pending" },
    { id: 4, type: "enrollment", kind: "address", name: "Ana Beatriz Ferreira", doc: "Comprovante de Endereço", status: "pending" },
    { id: 5, type: "candidate", kind: "pix", name: "Marcos Vinicius Lima", doc: "Validação de Chave DICT", status: "pending" },
  ]);

  onMount(async () => {
    try {
      const who = await whoami();
      if (who?.name) coordinatorName = who.name;
    } catch (e) {}
  });

  function approveItem(id: number) {
    items = items.map(item => item.id === id ? { ...item, status: "approved" } : item);
  }

  function rejectItem(id: number) {
    items = items.map(item => item.id === id ? { ...item, status: "rejected" } : item);
  }
</script>

<div class="w-full max-w-4xl mx-auto p-4 sm:p-6 text-white space-y-6">
  <!-- Card de Atenção: Fila de Revisões -->
  <div class="rounded-3xl p-6 sm:p-8 glass-panel border border-amber-500/40 bg-gradient-to-br from-amber-950/60 to-[#001a52]/90 shadow-2xl">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-xs font-semibold text-amber-300 mb-2">
          <span class="size-2 rounded-full bg-amber-400 animate-pulse"></span>
          Status de Atenção: Revisão (review)
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
          ← Visão Geral do Hub
        </a>
      </div>
    </div>

    <!-- Lista de Itens para Revisão -->
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
                onclick={() => approveItem(item.id)}
                class="px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/30 font-bold transition-colors cursor-pointer"
              >
                ✓ Homologar
              </button>
              <button
                type="button"
                onclick={() => rejectItem(item.id)}
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
  </div>
</div>
