<script lang="ts">
  import type { Snippet } from "svelte";
  import { clsx } from "clsx";
  import { twMerge } from "tailwind-merge";

  type CardVariant = "default" | "flat" | "elevated" | "accent";

  interface Props {
    title?: string;
    description?: string;
    variant?: CardVariant;
    class?: string;
    children?: Snippet;
    header?: Snippet;
    footer?: Snippet;
    actions?: Snippet;
  }

  let {
    title,
    description,
    variant = "default",
    class: className = "",
    children,
    header,
    footer,
    actions,
  }: Props = $props();

  const variantStyles: Record<CardVariant, string> = {
    default: "bg-[var(--ink-soft)]/90 border border-white/15 shadow-xl backdrop-blur-xl text-white",
    flat: "bg-white/[0.04] border border-white/10 text-white",
    elevated: "bg-[var(--ink-soft)] border border-white/20 shadow-2xl backdrop-blur-2xl text-white",
    accent: "bg-gradient-to-br from-[var(--ink-soft)] to-[var(--blue-deep)] border border-[var(--yellow)]/30 shadow-2xl text-white",
  };

  let resolvedCardClass = $derived(
    twMerge(
      clsx(
        "rounded-3xl p-5 sm:p-6 transition-all duration-200 flex flex-col gap-4 relative overflow-hidden",
        variantStyles[variant],
        className
      )
    )
  );
</script>

<div class={resolvedCardClass}>
  {#if header}
    {@render header()}
  {:else if title || description || actions}
    <div class="flex items-start justify-between gap-3 pb-2 border-b border-white/10">
      <div class="flex flex-col gap-1 min-w-0">
        {#if title}
          <h3 class="text-base sm:text-lg font-bold font-sans tracking-tight text-white leading-snug">
            {title}
          </h3>
        {/if}
        {#if description}
          <p class="text-xs sm:text-sm text-white/70 leading-relaxed font-sans">
            {description}
          </p>
        {/if}
      </div>

      {#if actions}
        <div class="flex items-center gap-2 shrink-0">
          {@render actions()}
        </div>
      {/if}
    </div>
  {/if}

  {#if children}
    <div class="flex-1">
      {@render children()}
    </div>
  {/if}

  {#if footer}
    <div class="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/70">
      {@render footer()}
    </div>
  {/if}
</div>
