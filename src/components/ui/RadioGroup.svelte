<script lang="ts">
  import type { Snippet } from "svelte";

  export interface RadioOption {
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
    badge?: string;
  }

  interface Props {
    options: RadioOption[];
    value?: string;
    name?: string;
    disabled?: boolean;
    onchange?: (val: string) => void;
    class?: string;
    children?: Snippet<[RadioOption, boolean]>;
  }

  let {
    options = [],
    value = $bindable(""),
    name = "radio-group",
    disabled = false,
    onchange,
    class: className = "",
    children,
  }: Props = $props();

  function selectOption(val: string) {
    if (disabled) return;
    value = val;
    onchange?.(val);
  }
</script>

<div role="radiogroup" class="flex flex-col gap-2.5 {className}">
  {#each options as opt (opt.value)}
    {@const isSelected = value === opt.value}
    {@const isDisabled = disabled || opt.disabled}
    <label
      class="group relative flex items-start gap-3.5 p-4 rounded-2xl border transition-all duration-200 cursor-pointer min-h-[48px] {isDisabled ? 'opacity-40 cursor-not-allowed border-white/5 bg-white/[0.02]' : isSelected ? 'border-[var(--yellow)] bg-[var(--yellow)]/10 text-white shadow-lg' : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08] text-white/80'}"
    >
      <input
        type="radio"
        {name}
        value={opt.value}
        checked={isSelected}
        disabled={isDisabled}
        onchange={() => selectOption(opt.value)}
        class="sr-only"
      />
      <div
        class="size-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors duration-200 {isSelected ? 'border-[var(--yellow)] bg-[var(--yellow)]' : 'border-white/30 bg-white/5 group-hover:border-white/50'}"
        aria-hidden="true"
      >
        {#if isSelected}
          <div class="size-2 rounded-full bg-brand-ink"></div>
        {/if}
      </div>

      <div class="flex-1 flex flex-col gap-0.5">
        <div class="flex items-center justify-between gap-2">
          <span class="text-sm font-semibold text-white leading-snug">
            {opt.label}
          </span>
          {#if opt.badge}
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border border-white/20 bg-white/10 text-white/90">
              {opt.badge}
            </span>
          {/if}
        </div>
        {#if opt.description}
          <p class="text-xs text-white/60 leading-relaxed font-sans">
            {opt.description}
          </p>
        {/if}
      </div>

      {#if children}
        {@render children(opt, isSelected)}
      {/if}
    </label>
  {/each}
</div>
