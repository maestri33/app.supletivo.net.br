<script lang="ts">
  import Badge from "@/components/ui/Badge.svelte";

  interface Props {
    title: string;
    status?: string | null;
    paths: string[];
    openingPath?: string | null;
    onOpen: (path: string) => void;
  }

  let {
    title,
    status = null,
    paths = [],
    openingPath = null,
    onOpen,
  }: Props = $props();

  const statusMap: Record<
    string,
    { label: string; variant: "success" | "warning" | "danger" | "info" | "neutral"; pulse?: boolean }
  > = {
    approved: { label: "Aprovado", variant: "success" },
    pending: { label: "Em análise", variant: "warning", pulse: true },
    review: { label: "Conferência do polo", variant: "info" },
    rejected: { label: "Precisa de novo envio", variant: "danger" },
    needs_kinship: { label: "Vínculo com titular pendente", variant: "warning" },
  };

  let badgeConfig = $derived(
    status && statusMap[status]
      ? statusMap[status]
      : { label: "Pendente de envio", variant: "neutral" as const }
  );
</script>

<div
  class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all duration-200"
  data-testid="document-status-card"
>
  <div class="flex flex-col gap-1.5 min-w-[10rem]">
    <div class="flex items-center gap-2">
      <strong class="text-sm sm:text-base font-bold text-white font-sans">
        {title}
      </strong>
    </div>

    <div>
      <Badge variant={badgeConfig.variant} size="sm" pulse={badgeConfig.pulse}>
        {badgeConfig.label}
      </Badge>
    </div>
  </div>

  {#if paths.length > 0}
    <div class="flex items-center gap-2 mt-1 sm:mt-0">
      {#each paths as path, index (path)}
        {@const isOpening = openingPath === path}
        {@const label = paths.length > 1 ? (index === 0 ? "Frente" : "Verso") : "Visualizar"}
        <button
          type="button"
          disabled={openingPath !== null}
          onclick={() => onOpen(path)}
          aria-label="Abrir {title} {label}"
          class="min-h-[44px] sm:min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all duration-150 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {#if isOpening}
            <span class="inline-block size-3 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
            <span>Abrindo…</span>
          {:else}
            <span>👁</span>
            <span>{label}</span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>
