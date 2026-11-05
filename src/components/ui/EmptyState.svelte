<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    icon?: string;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    children?: Snippet;
  }

  let {
    icon = "📭",
    title,
    description,
    actionLabel,
    onAction,
    children,
  }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
  <div class="size-16 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-white/70 mb-4 shadow-lg" aria-hidden="true">
    {#if icon && icon !== "📭"}
      <span class="text-3xl">{icon}</span>
    {:else}
      <svg class="size-8 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    {/if}
  </div>

  <h3 class="text-base sm:text-lg font-bold font-sans text-white mb-2">
    {title}
  </h3>

  <p class="text-xs sm:text-sm text-white/60 max-w-sm mb-6 leading-relaxed">
    {description}
  </p>

  {#if actionLabel && onAction}
    <button
      type="button"
      onclick={onAction}
      class="min-h-[48px] px-6 rounded-xl bg-[var(--yellow)] hover:bg-[var(--yellow-soft)] text-brand-ink font-bold text-xs sm:text-sm shadow-lg transition cursor-pointer"
    >
      {actionLabel}
    </button>
  {/if}

  {#if children}
    {@render children()}
  {/if}
</div>
