<script lang="ts">
  import type { Snippet } from "svelte";
  import { clsx } from "clsx";
  import { twMerge } from "tailwind-merge";

  interface Props {
    class?: string;
    children?: Snippet;
  }

  let { class: className = "", children }: Props = $props();

  let resolvedClass = $derived(
    twMerge(clsx("flex flex-col gap-2.5 sm:gap-3 w-full", className))
  );
</script>

<div class={resolvedClass}>
  {#if children}
    {@render children()}
  {/if}
</div>
