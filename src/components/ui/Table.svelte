<script lang="ts">
  import type { Snippet } from "svelte";
  import { clsx } from "clsx";
  import { twMerge } from "tailwind-merge";

  interface Props {
    class?: string;
    children?: Snippet;
  }

  let { class: className = "", children }: Props = $props();

  let containerClass = $derived(
    twMerge(
      clsx(
        "w-full overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md shadow-sm",
        className
      )
    )
  );
</script>

<div class={containerClass}>
  <table class="w-full text-left text-xs text-white/80 border-collapse">
    {#if children}
      {@render children()}
    {/if}
  </table>
</div>
