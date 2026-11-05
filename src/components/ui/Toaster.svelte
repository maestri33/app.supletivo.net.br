<script lang="ts">
  import { toast } from "@/lib/toast";

  const icons: Record<string, string> = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };

  const borderStyles: Record<string, string> = {
    success: "border-emerald-500/40 bg-emerald-950/90 text-emerald-200",
    error: "border-red-500/40 bg-red-950/90 text-red-200",
    warning: "border-amber-500/40 bg-amber-950/90 text-amber-200",
    info: "border-blue-500/40 bg-blue-950/90 text-blue-200",
  };
</script>

<div
  class="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:bottom-5 right-4 sm:right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
  role="region"
  aria-label="Notificações"
>
  {#each $toast as item (item.id)}
    <div
      role="status"
      class="pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-200 animate-in slide-in-from-bottom-3 {borderStyles[item.type] || borderStyles.info}"
    >
      <div class="flex items-center gap-3">
        <span class="size-6 rounded-full flex items-center justify-center font-bold text-xs bg-white/10 shrink-0">
          {icons[item.type]}
        </span>
        <p class="text-xs sm:text-sm font-medium leading-snug">
          {item.message}
        </p>
      </div>

      <button
        type="button"
        onclick={() => toast.dismiss(item.id)}
        class="min-h-[48px] min-w-[48px] rounded-full hover:bg-white/10 flex items-center justify-center text-xs opacity-60 hover:opacity-100 transition cursor-pointer shrink-0"
        aria-label="Dispensar notificação"
      >
        <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  {/each}
</div>
