<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    isOpen?: boolean;
    onClose: () => void;
    title?: string;
    eyebrow?: string;
    eyebrowVariant?: "blue" | "green" | "amber" | "yellow" | "purple";
    description?: string;
    size?: "sm" | "md" | "lg" | "xl";
    showCloseButton?: boolean;
    closeOnBackdrop?: boolean;
    closeOnEscape?: boolean;
    testId?: string;
    children?: Snippet;
    header?: Snippet;
    footer?: Snippet;
  }

  let {
    isOpen = false,
    onClose,
    title = "",
    eyebrow = "",
    eyebrowVariant = "blue",
    description = "",
    size = "md",
    showCloseButton = true,
    closeOnBackdrop = true,
    closeOnEscape = true,
    testId = "modal-dialog",
    children,
    header,
    footer,
  }: Props = $props();

  // Bloqueio de rolagem do body enquanto aberto
  $effect(() => {
    if (typeof document === "undefined") return;
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  });

  // Listener global de teclado (Escape)
  function handleKeyDown(e: KeyboardEvent) {
    if (!isOpen) return;
    if (closeOnEscape && e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  }

  // Fechamento ao clicar no backdrop (overlay)
  function handleBackdropClick(e: MouseEvent) {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  }

  // Mapeamento de largura máxima por tamanho
  const sizeClasses: Record<string, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  // Mapeamento de variantes de badge (eyebrow)
  const eyebrowStyles: Record<string, string> = {
    blue: "bg-blue-500/20 text-blue-300 border-blue-400/30",
    green: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
    amber: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    yellow: "bg-[var(--yellow)]/20 text-[var(--yellow)] border-[var(--yellow)]/30",
    purple: "bg-purple-500/20 text-purple-300 border-purple-400/30",
  };
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if isOpen}
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby={title ? "canonical-modal-title" : undefined}
    aria-describedby={description ? "canonical-modal-desc" : undefined}
    data-testid={testId}
    onclick={handleBackdropClick}
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 transition-opacity animate-in fade-in duration-200"
  >
    <div
      class="w-full {sizeClasses[size] || 'max-w-md'} bg-[var(--ink-soft)]/95 text-white sm:rounded-3xl rounded-t-3xl border border-white/15 p-6 sm:p-8 shadow-2xl flex flex-col gap-6 backdrop-blur-2xl relative overflow-hidden animate-in slide-in-from-bottom-6 duration-200 max-h-[92dvh] overflow-y-auto"
    >
      <!-- Indicador tátil / Drag Handle para Mobile -->
      <div class="w-12 h-1 bg-white/25 rounded-full mx-auto sm:hidden -mt-2 -mb-2" aria-hidden="true"></div>

      <!-- Cabeçalho Customizado ou Padrão -->
      {#if header}
        {@render header()}
      {:else if title || eyebrow || description || showCloseButton}
        <div class="flex items-start justify-between border-b border-white/10 pb-4">
          <div class="flex flex-col gap-1 pr-4">
            {#if eyebrow}
              <span
                class="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide w-fit border {eyebrowStyles[eyebrowVariant] || eyebrowStyles.blue}"
              >
                {eyebrow}
              </span>
            {/if}

            {#if title}
              <h3 id="canonical-modal-title" class="text-xl font-black text-white font-display tracking-tight mt-0.5">
                {title}
              </h3>
            {/if}

            {#if description}
              <p id="canonical-modal-desc" class="text-xs text-white/70 leading-relaxed mt-0.5">
                {description}
              </p>
            {/if}
          </div>

          {#if showCloseButton}
            <button
              type="button"
              onclick={onClose}
              class="min-w-[48px] min-h-[48px] w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-base font-bold transition-all duration-200 hover:rotate-90 shrink-0 cursor-pointer"
              aria-label="Fechar janela"
              data-testid="modal-close-btn"
            >
              ✕
            </button>
          {/if}
        </div>
      {/if}

      <!-- Conteúdo Principal -->
      {#if children}
        <div class="flex-1">
          {@render children()}
        </div>
      {/if}

      <!-- Rodapé / Ações Opcionais -->
      {#if footer}
        <div class="border-t border-white/10 pt-4 mt-auto">
          {@render footer()}
        </div>
      {/if}
    </div>
  </div>
{/if}
