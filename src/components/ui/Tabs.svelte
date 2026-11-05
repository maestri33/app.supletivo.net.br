<script lang="ts">
  import type { Snippet } from "svelte";

  export interface TabItem {
    id: string;
    label: string;
    badge?: string;
    disabled?: boolean;
  }

  interface Props {
    items: TabItem[];
    value?: string;
    onchange?: (id: string) => void;
    class?: string;
    children?: Snippet<[string]>;
  }

  let {
    items = [],
    value = $bindable(items[0]?.id || ""),
    onchange,
    class: className = "",
    children,
  }: Props = $props();

  function selectTab(id: string) {
    value = id;
    onchange?.(id);
  }

  function handleKeydown(e: KeyboardEvent, index: number) {
    const enabledTabs = items.filter((t) => !t.disabled);
    const currentIndex = enabledTabs.findIndex((t) => t.id === items[index]?.id);
    if (currentIndex === -1) return;

    let nextIndex = -1;
    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % enabledTabs.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = enabledTabs.length - 1;
    }

    if (nextIndex !== -1) {
      e.preventDefault();
      const targetId = enabledTabs[nextIndex].id;
      selectTab(targetId);
      const btn = document.getElementById(`tab-${targetId}`);
      btn?.focus();
    }
  }
</script>

<div class="w-full {className}">
  <div
    role="tablist"
    class="flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl overflow-x-auto no-scrollbar"
  >
    {#each items as tab, index (tab.id)}
      {@const isSelected = value === tab.id}
      <button
        id={`tab-${tab.id}`}
        type="button"
        role="tab"
        aria-selected={isSelected}
        aria-controls={`panel-${tab.id}`}
        tabindex={isSelected ? 0 : -1}
        disabled={tab.disabled}
        onclick={() => selectTab(tab.id)}
        onkeydown={(e) => handleKeydown(e, index)}
        class="min-h-[48px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--yellow)]/60 {isSelected ? 'bg-white/15 text-white shadow-md border border-white/20' : 'text-white/60 hover:text-white hover:bg-white/5'}"
      >
        <span>{tab.label}</span>
        {#if tab.badge}
          <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold {isSelected ? 'bg-[var(--yellow)] text-brand-ink' : 'bg-white/10 text-white/70'}">
            {tab.badge}
          </span>
        {/if}
      </button>
    {/each}
  </div>

  <div
    id={`panel-${value}`}
    role="tabpanel"
    aria-labelledby={`tab-${value}`}
    tabindex="0"
    class="mt-4 focus-visible:outline-none"
  >
    {#if children}
      {@render children(value)}
    {/if}
  </div>
</div>
