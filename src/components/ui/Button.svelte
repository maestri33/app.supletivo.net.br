<script lang="ts">
  import type { Snippet } from "svelte";
  import { clsx } from "clsx";
  import { twMerge } from "tailwind-merge";

  type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
  type ButtonSize = "sm" | "md" | "lg" | "xl";

  interface Props {
    variant?: ButtonVariant;
    size?: ButtonSize;
    type?: "button" | "submit" | "reset";
    href?: string;
    target?: string;
    rel?: string;
    disabled?: boolean;
    loading?: boolean;
    shine?: boolean;
    class?: string;
    onclick?: (e: MouseEvent) => void;
    children?: Snippet;
    icon?: Snippet;
  }

  let {
    variant = "primary",
    size = "md",
    type = "button",
    href,
    target,
    rel,
    disabled = false,
    loading = false,
    shine = false,
    class: className = "",
    onclick,
    children,
    icon,
  }: Props = $props();

  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      "bg-[var(--yellow)] hover:bg-[var(--yellow-soft)] text-[var(--ink)] font-extrabold shadow-lg shadow-yellow-950/20 active:scale-[0.985]",
    secondary:
      "bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold active:scale-[0.985]",
    outline:
      "bg-transparent hover:bg-white/10 text-white border border-white/25 font-bold active:scale-[0.985]",
    ghost:
      "bg-transparent hover:bg-white/10 text-white/80 hover:text-white font-medium",
    danger:
      "bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg shadow-rose-950/30 active:scale-[0.985]",
  };

  const sizeClasses: Record<ButtonSize, string> = {
    sm: "min-h-[40px] px-3.5 py-1.5 text-xs rounded-full",
    md: "min-h-[48px] px-5 py-2.5 text-xs sm:text-sm rounded-full",
    lg: "min-h-[52px] px-6 py-3 text-sm sm:text-base rounded-full",
    xl: "min-h-[56px] px-8 py-3.5 text-base sm:text-lg rounded-full",
  };

  let resolvedClass = $derived(
    twMerge(
      clsx(
        "inline-flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer select-none text-center whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none uppercase tracking-wider relative overflow-hidden",
        variantClasses[variant],
        sizeClasses[size],
        shine && variant === "primary" ? "btn-shine" : "",
        className
      )
    )
  );
</script>

{#if href}
  <a
    {href}
    {target}
    rel={target === "_blank" ? (rel || "noopener noreferrer") : rel}
    class={resolvedClass}
    aria-disabled={disabled || loading}
  >
    {#if loading}
      <span class="inline-block size-3.5 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0"></span>
    {:else if icon}
      {@render icon()}
    {/if}
    {#if children}
      {@render children()}
    {/if}
  </a>
{:else}
  <button
    {type}
    {disabled}
    {onclick}
    class={resolvedClass}
  >
    {#if loading}
      <span class="inline-block size-3.5 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0"></span>
    {:else if icon}
      {@render icon()}
    {/if}
    {#if children}
      {@render children()}
    {/if}
  </button>
{/if}
