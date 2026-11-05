<script lang="ts">
  interface Props {
    src?: string | null;
    alt?: string;
    fallback?: string;
    size?: "sm" | "md" | "lg" | "xl";
    class?: string;
  }

  let {
    src = null,
    alt = "Avatar",
    fallback = "SB",
    size = "md",
    class: className = "",
  }: Props = $props();

  let hasError = $state(false);

  const sizeClasses = {
    sm: "size-8 text-xs",
    md: "size-10 text-sm",
    lg: "size-14 text-lg",
    xl: "size-20 text-2xl",
  };
</script>

<div
  class="relative inline-flex items-center justify-center rounded-full overflow-hidden bg-white/10 border border-white/15 select-none shrink-0 font-bold font-mono text-white/80 shadow-inner {sizeClasses[size]} {className}"
>
  {#if src && !hasError}
    <img
      {src}
      {alt}
      onerror={() => {
        hasError = true;
      }}
      class="h-full w-full object-cover"
      loading="lazy"
    />
  {:else}
    <span class="uppercase tracking-wider">
      {fallback.slice(0, 2)}
    </span>
  {/if}
</div>
