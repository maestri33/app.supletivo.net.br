<script lang="ts">
  import type { Snippet } from "svelte";
  import { clsx } from "clsx";
  import { twMerge } from "tailwind-merge";

  interface Props {
    title: string;
    description?: string;
    open?: boolean;
    class?: string;
    children?: Snippet;
  }

  let {
    title,
    description,
    open = false,
    class: className = "",
    children,
  }: Props = $props();

  let isOpen = $state(open);

  $effect(() => {
    isOpen = open;
  });

  function toggle() {
    isOpen = !isOpen;
  }
</script>

<div
  class={twMerge(
    clsx(
      "rounded-2xl border border-white/10 bg-white/[0.04] transition-all duration-200 overflow-hidden",
      isOpen ? "border-white/25 bg-white/[0.07] shadow-lg" : "hover:border-white/15 hover:bg-white/[0.05]",
      className
    )
  )}
>
  <button
    type="button"
    onclick={toggle}
    aria-expanded={isOpen}
    class="flex items-center justify-between gap-4 w-full p-4 sm:p-5 text-left cursor-pointer transition select-none min-h-[48px]"
  >
    <div class="flex flex-col gap-0.5 min-w-0">
      <span class="text-xs sm:text-sm font-bold font-sans text-white leading-snug">
        {title}
      </span>
      {#if description}
        <span class="text-[11px] sm:text-xs text-white/60 font-sans leading-relaxed">
          {description}
        </span>
      {/if}
    </div>

    <svg
      class="size-4 text-white/70 shrink-0 transition-transform duration-200 {isOpen ? 'rotate-180 text-[var(--yellow)]' : ''}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  </button>

  {#if isOpen}
    <div class="px-4 sm:px-5 pb-5 pt-1 border-t border-white/10 text-xs sm:text-sm text-white/80 leading-relaxed font-sans">
      {#if children}
        {@render children()}
      {/if}
    </div>
  {/if}
</div>
