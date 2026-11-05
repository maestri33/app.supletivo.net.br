<script lang="ts">
  interface Props {
    value?: number; // 0 to 100
    max?: number;
    variant?: "green" | "yellow" | "blue";
    class?: string;
    showLabel?: boolean;
    label?: string;
  }

  let {
    value = 0,
    max = 100,
    variant = "green",
    class: className = "",
    showLabel = false,
    label,
  }: Props = $props();

  let percentage = $derived(Math.min(100, Math.max(0, Math.round((value / max) * 100))));

  const fillColors = {
    green: "bg-[var(--green)] shadow-green-950/40",
    yellow: "bg-[var(--yellow)] shadow-yellow-950/40",
    blue: "bg-[var(--blue)] shadow-blue-950/40",
  };
</script>

<div class="w-full flex flex-col gap-1.5 {className}">
  {#if showLabel || label}
    <div class="flex items-center justify-between text-xs font-semibold text-white/70">
      <span>{label || "Progresso"}</span>
      <span>{percentage}%</span>
    </div>
  {/if}

  <div
    role="progressbar"
    aria-valuenow={percentage}
    aria-valuemin={0}
    aria-valuemax={100}
    class="w-full h-2 sm:h-2.5 rounded-full bg-white/10 overflow-hidden backdrop-blur-sm p-0.5"
  >
    <div
      class="h-full rounded-full transition-all duration-300 ease-out {fillColors[variant]}"
      style="width: {percentage}%"
    ></div>
  </div>
</div>
