<script lang="ts">
  import type { Snippet } from "svelte";
  import { clsx } from "clsx";
  import { twMerge } from "tailwind-merge";

  type BadgeVariant =
    | "neutral"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "conversion";
  type BadgeSize = "sm" | "md" | "lg";

  interface Props {
    variant?: BadgeVariant;
    size?: BadgeSize;
    pulse?: boolean;
    class?: string;
    children?: Snippet;
  }

  let {
    variant = "neutral",
    size = "md",
    pulse = false,
    class: className = "",
    children,
  }: Props = $props();

  const variantStyles: Record<BadgeVariant, { badge: string; dot: string }> = {
    neutral: {
      badge: "bg-white/10 text-white/80 border-white/15",
      dot: "bg-white/60",
    },
    success: {
      badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      dot: "bg-emerald-400",
    },
    warning: {
      badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      dot: "bg-amber-400",
    },
    danger: {
      badge: "bg-red-500/15 text-red-200 border-red-500/30",
      dot: "bg-red-400",
    },
    info: {
      badge: "bg-blue-500/15 text-blue-300 border-blue-400/30",
      dot: "bg-blue-400",
    },
    conversion: {
      badge: "bg-[var(--yellow)]/20 text-[var(--yellow)] border-[var(--yellow)]/40",
      dot: "bg-[var(--yellow)]",
    },
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3.5 py-1.5 text-sm",
  };

  let activeVariant = $derived(variantStyles[variant] || variantStyles.neutral);
  let resolvedClass = $derived(
    twMerge(
      clsx(
        "inline-flex items-center gap-1.5 rounded-full border font-bold font-sans tracking-wide uppercase transition-all select-none",
        activeVariant.badge,
        sizeStyles[size],
        className
      )
    )
  );
</script>

<span class={resolvedClass}>
  {#if pulse}
    <span class="relative flex size-2 shrink-0">
      <span class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 {activeVariant.dot}"></span>
      <span class="relative inline-flex size-2 rounded-full {activeVariant.dot}"></span>
    </span>
  {/if}
  {#if children}
    {@render children()}
  {/if}
</span>
