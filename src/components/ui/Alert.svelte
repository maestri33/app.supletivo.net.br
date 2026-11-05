<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    title?: string;
    description?: string;
    variant?: "default" | "warning" | "success" | "danger" | "info";
    icon?: string;
    class?: string;
    children?: Snippet;
  }

  let {
    title,
    description,
    variant = "default",
    icon,
    class: className = "",
    children,
  }: Props = $props();

  const variantStyles = {
    default: "bg-white/5 border-white/15 text-white/90",
    info: "bg-blue-500/10 border-blue-500/25 text-blue-200",
    success: "bg-emerald-500/10 border-emerald-500/25 text-emerald-200",
    warning: "bg-amber-500/10 border-amber-500/30 text-amber-200",
    danger: "bg-rose-500/10 border-rose-500/30 text-rose-200",
  };

  const defaultIcons = {
    default: "ℹ️",
    info: "ℹ️",
    success: "✓",
    warning: "⚠️",
    danger: "⚠️",
  };
</script>

<div
  role="alert"
  class="flex items-start gap-3.5 p-4 rounded-xl border text-sm font-sans backdrop-blur-md transition-all duration-200 {variantStyles[variant]} {className}"
>
  <span class="size-5 shrink-0 select-none mt-0.5" aria-hidden="true">
    {#if icon}
      {icon}
    {:else if variant === "success"}
      <svg class="size-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    {:else if variant === "warning" || variant === "danger"}
      <svg class="size-5 {variant === 'danger' ? 'text-rose-400' : 'text-amber-400'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    {:else}
      <svg class="size-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    {/if}
  </span>

  <div class="flex-1 flex flex-col gap-0.5 min-w-0">
    {#if title}
      <h4 class="font-bold text-sm tracking-tight text-white leading-snug">
        {title}
      </h4>
    {/if}
    {#if description}
      <p class="text-xs sm:text-sm text-white/70 leading-relaxed">
        {description}
      </p>
    {/if}
    {#if children}
      <div class="mt-1">
        {@render children()}
      </div>
    {/if}
  </div>
</div>
