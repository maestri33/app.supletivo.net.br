<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    isOpen?: boolean;
    title?: string;
    description?: string;
    side?: "bottom" | "right";
    onClose: () => void;
    children?: Snippet;
    footer?: Snippet;
  }

  let {
    isOpen = false,
    title,
    description,
    side = "bottom",
    onClose,
    children,
    footer,
  }: Props = $props();

  function handleKeyDown(e: KeyboardEvent) {
    if (!isOpen) return;
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if isOpen}
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby={title ? "sheet-title" : undefined}
    aria-describedby={description ? "sheet-desc" : undefined}
    class="fixed inset-0 z-50 flex bg-black/80 backdrop-blur-md transition-opacity duration-200 animate-in fade-in {side === 'bottom' ? 'items-end sm:items-center justify-center' : 'items-stretch justify-end'}"
  >
    <!-- Backdrop Click -->
    <div
      class="fixed inset-0 -z-10"
      onclick={onClose}
      aria-hidden="true"
    ></div>

    <!-- Sheet Panel -->
    <div
      class="w-full bg-[var(--ink-soft)] text-white shadow-2xl border border-white/15 backdrop-blur-2xl overflow-y-auto max-h-[90vh] sm:max-h-[85vh] transition-transform duration-300 ease-out {side === 'bottom' ? 'rounded-t-3xl sm:rounded-3xl max-w-lg p-6 sm:p-8 animate-in slide-in-from-bottom' : 'max-w-md h-full p-6 sm:p-8 animate-in slide-in-from-right'}"
    >
      <!-- Mobile Drag Handle -->
      {#if side === "bottom"}
        <div class="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 sm:hidden" aria-hidden="true"></div>
      {/if}

      <div class="flex items-start justify-between gap-4 mb-4">
        <div class="flex flex-col gap-1">
          {#if title}
            <h2 id="sheet-title" class="text-lg sm:text-xl font-bold font-sans tracking-tight text-white leading-snug">
              {title}
            </h2>
          {/if}
          {#if description}
            <p id="sheet-desc" class="text-xs sm:text-sm text-white/70 leading-relaxed font-sans">
              {description}
            </p>
          {/if}
        </div>

        <button
          type="button"
          onclick={onClose}
          aria-label="Fechar painel"
          class="min-h-[48px] min-w-[48px] rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center text-sm transition cursor-pointer shrink-0"
        >
          <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {#if children}
        <div class="py-2">
          {@render children()}
        </div>
      {/if}

      {#if footer}
        <div class="pt-4 mt-6 border-t border-white/10 flex items-center justify-end gap-3">
          {@render footer()}
        </div>
      {/if}
    </div>
  </div>
{/if}
