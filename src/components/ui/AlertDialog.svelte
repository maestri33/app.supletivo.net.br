<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    isOpen?: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string | null;
    variant?: "danger" | "warning" | "info" | "conversion" | "success";
    loading?: boolean;
    onConfirm: () => void;
    onCancel?: () => void;
    children?: Snippet;
  }

  let {
    isOpen = false,
    title,
    description,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    variant = "danger",
    loading = false,
    onConfirm,
    onCancel,
    children,
  }: Props = $props();

  function handleKeyDown(e: KeyboardEvent) {
    if (!isOpen || loading) return;
    if (e.key === "Escape") {
      e.preventDefault();
      if (onCancel) {
        onCancel();
      } else {
        onConfirm();
      }
    }
  }

  const iconVariants = {
    danger: {
      icon: "⚠️",
      bg: "bg-rose-500/20 text-rose-300 border border-rose-500/30",
    },
    warning: {
      icon: "⚠️",
      bg: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    },
    info: {
      icon: "ℹ️",
      bg: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
    },
    conversion: {
      icon: "✨",
      bg: "bg-brand-yellow/20 text-brand-yellow border border-brand-yellow/30",
    },
    success: {
      icon: "✓",
      bg: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
    },
  };

  const confirmColors = {
    danger: "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40",
    warning: "bg-amber-500 hover:bg-amber-400 text-brand-ink font-bold shadow-amber-950/40",
    info: "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-950/40",
    conversion: "bg-[var(--yellow)] hover:bg-[var(--yellow-soft)] text-brand-ink font-extrabold shadow-yellow-900/30",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40",
  };
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if isOpen}
  <div
    role="alertdialog"
    aria-modal="true"
    aria-labelledby="alert-dialog-title"
    aria-describedby="alert-dialog-desc"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150"
  >
    <div
      class="w-full max-w-md rounded-2xl border border-white/20 bg-[var(--ink-soft)] text-white shadow-2xl p-6 sm:p-7 flex flex-col gap-5 backdrop-blur-2xl animate-in zoom-in-95 duration-150"
    >
      <div class="flex items-start gap-4">
        <div
          class="size-11 rounded-xl flex items-center justify-center shrink-0 {iconVariants[variant].bg}"
          aria-hidden="true"
        >
          {#if variant === "danger" || variant === "warning"}
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          {:else if variant === "success"}
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          {:else if variant === "conversion"}
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          {:else}
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          {/if}
        </div>

        <div class="flex flex-col gap-1.5 flex-1">
          <h2 id="alert-dialog-title" class="text-base sm:text-lg font-bold font-sans text-white leading-snug">
            {title}
          </h2>
          <p id="alert-dialog-desc" class="text-xs sm:text-sm text-white/70 leading-relaxed font-sans">
            {description}
          </p>
        </div>
      </div>

      {#if children}
        <div class="pt-1">
          {@render children()}
        </div>
      {/if}

      <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
        {#if cancelLabel}
          <button
            type="button"
            disabled={loading}
            onclick={onCancel}
            class="min-h-[48px] px-4 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-xs sm:text-sm font-semibold text-white/80 transition cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
        {/if}

        <button
          type="button"
          disabled={loading}
          onclick={onConfirm}
          class="min-h-[48px] px-5 rounded-xl text-xs sm:text-sm font-bold shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 {confirmColors[variant]}"
        >
          {#if loading}
            <span class="inline-block size-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
            <span>Processando…</span>
          {:else}
            <span>{confirmLabel}</span>
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
