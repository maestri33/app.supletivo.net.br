<script lang="ts">
  import { clsx } from "clsx";
  import { twMerge } from "tailwind-merge";

  interface Props {
    orientation?: "horizontal" | "vertical";
    class?: string;
    decorative?: boolean;
  }

  let {
    orientation = "horizontal",
    class: className = "",
    decorative = true,
  }: Props = $props();

  let resolvedClass = $derived(
    twMerge(
      clsx(
        "shrink-0 bg-white/10 transition-colors",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )
    )
  );
</script>

<div
  role={decorative ? "none" : "separator"}
  aria-orientation={decorative ? undefined : orientation}
  class={resolvedClass}
></div>
