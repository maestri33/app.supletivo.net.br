<script lang="ts">
  interface Props {
    page: number;
    totalPages: number;
    totalItems?: number;
    itemsPerPage?: number;
    onPageChange: (newPage: number) => void;
  }

  let {
    page = 1,
    totalPages = 1,
    totalItems,
    itemsPerPage,
    onPageChange,
  }: Props = $props();

  let canPrev = $derived(page > 1);
  let canNext = $derived(page < totalPages);
</script>

<div
  class="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl border border-white/10 bg-white/[0.03] text-xs text-white/70"
  role="navigation"
  aria-label="Paginação"
>
  <div>
    {#if totalItems !== undefined && itemsPerPage !== undefined}
      <span>
        Exibindo {Math.min((page - 1) * itemsPerPage + 1, totalItems)} a {Math.min(page * itemsPerPage, totalItems)} de {totalItems} registros
      </span>
    {:else}
      <span>Página {page} de {totalPages}</span>
    {/if}
  </div>

  <div class="flex items-center gap-2">
    <button
      type="button"
      disabled={!canPrev}
      onclick={() => onPageChange(page - 1)}
      aria-label="Página anterior"
      class="min-h-[48px] px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
    >
      ← Anterior
    </button>

    <span class="px-2 font-mono font-bold text-[var(--yellow)]">
      {page} / {totalPages || 1}
    </span>

    <button
      type="button"
      disabled={!canNext}
      onclick={() => onPageChange(page + 1)}
      aria-label="Próxima página"
      class="min-h-[48px] px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
    >
      Próxima →
    </button>
  </div>
</div>
