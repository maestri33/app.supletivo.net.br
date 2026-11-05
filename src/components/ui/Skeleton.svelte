<script lang="ts">
  interface Props {
    class?: string;
    rounded?: string;
  }

  let {
    class: className = "h-4 w-full",
    rounded = "rounded-lg",
  }: Props = $props();
</script>

<div
  class="relative overflow-hidden bg-white/10 {rounded} {className} before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent"
  aria-hidden="true"
></div>
