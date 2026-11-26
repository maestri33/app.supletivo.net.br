<script lang="ts">
  import type { Snippet } from "svelte";

  export interface TabItem {
    title: string;
    value: string;
    badge?: string;
    icon?: string;
    content?: any;
  }

  interface Props {
    tabs: TabItem[];
    defaultValue?: string;
    value?: string;
    onChange?: (value: string) => void;
    onTabChange?: (tab: TabItem) => void;
    containerClassName?: string;
    tablistWrapperClassName?: string;
    tablistClassName?: string;
    tabClassName?: string;
    activeTabClassName?: string;
    contentClassName?: string;
    ariaLabel?: string;
    children?: Snippet<[{ activeValue: string }]>;
  }

  let {
    tabs = [],
    defaultValue,
    value: controlledValue,
    onChange,
    onTabChange,
    containerClassName = "",
    tablistWrapperClassName = "",
    tablistClassName = "",
    tabClassName = "",
    activeTabClassName = "",
    contentClassName = "",
    ariaLabel = "Navegação por abas de conteúdo",
    children,
  }: Props = $props();

  let internalValue = $state<string>(defaultValue || tabs?.[0]?.value || "");
  let activeValue = $derived(controlledValue !== undefined ? controlledValue : internalValue);

  let tabButtons: (HTMLButtonElement | null)[] = $state([]);

  function selectTab(tab: TabItem) {
    if (tab.value === activeValue) return;
    if (controlledValue === undefined) {
      internalValue = tab.value;
    }
    onChange?.(tab.value);
    onTabChange?.(tab);
  }

  function handleKeyDown(e: KeyboardEvent, index: number) {
    let targetIndex = -1;
    if (e.key === "ArrowRight") {
      targetIndex = (index + 1) % tabs.length;
    } else if (e.key === "ArrowLeft") {
      targetIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      targetIndex = 0;
    } else if (e.key === "End") {
      targetIndex = tabs.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    const targetTab = tabs[targetIndex];
    if (targetTab) {
      selectTab(targetTab);
      tabButtons[targetIndex]?.focus();
    }
  }
</script>

{#if tabs && tabs.length > 0}
  <div class="w-full flex flex-col items-center {containerClassName}">
    <!-- Barra de Abas na Parte Superior (WAI-ARIA Tablist) -->
    <div class="w-full overflow-x-auto no-visible-scrollbar {tablistWrapperClassName}">
      <div
        role="tablist"
        aria-label={ariaLabel}
        aria-orientation="horizontal"
        class="relative mx-auto flex w-max flex-row items-center justify-center p-1.5 rounded-full bg-[var(--ink)]/80 backdrop-blur-md border border-white/10 shadow-[var(--shadow-glass)] touch-pan-x gap-1 {tablistClassName}"
        style="-webkit-tap-highlight-color: transparent;"
      >
        {#each tabs as tab, idx (tab.value)}
          {@const isActive = tab.value === activeValue}
          {@const tabId = `tab-${tab.value}`}
          {@const panelId = `panel-${tab.value}`}

          <button
            bind:this={tabButtons[idx]}
            id={tabId}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={panelId}
            tabindex={isActive ? 0 : -1}
            onclick={() => selectTab(tab)}
            onkeydown={(e) => handleKeyDown(e, idx)}
            class="relative z-10 px-4 sm:px-5 py-2.5 min-h-[48px] rounded-full inline-flex items-center justify-center gap-2 font-sans text-xs sm:text-sm font-semibold tracking-wide transition-all duration-200 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--yellow)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink)] touch-manipulation {
              isActive
                ? `text-white bg-[var(--blue)] shadow-lg shadow-[var(--blue)]/50 border border-white/20 ${activeTabClassName}`
                : 'text-[var(--muted-on-dark)] hover:text-white'
            } {tabClassName}"
          >
            <span class="relative z-10 whitespace-nowrap">{tab.title}</span>

            {#if tab.badge}
              <span
                class="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full {
                  isActive
                    ? 'bg-[var(--yellow)] text-[var(--ink)]'
                    : 'bg-white/10 text-white/80'
                }"
              >
                {tab.badge}
              </span>
            {/if}
          </button>
        {/each}
      </div>
    </div>

    <!-- Painéis com Isolamento de Foco e Acessibilidade WCAG -->
    <div class="relative w-full mt-6 {contentClassName}">
      {#if children}
        {@render children({ activeValue })}
      {:else}
        {#each tabs as tab (tab.value)}
          {@const isActive = tab.value === activeValue}
          {@const tabId = `tab-${tab.value}`}
          {@const panelId = `panel-${tab.value}`}

          <div
            id={panelId}
            role="tabpanel"
            aria-labelledby={tabId}
            tabindex="0"
            hidden={!isActive}
            class="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] rounded-3xl transition-opacity duration-200 {isActive ? 'opacity-100' : 'hidden opacity-0'}"
          >
            {#if isActive && tab.content}
              {#if typeof tab.content === "function"}
                {@render tab.content()}
              {:else}
                <!-- Static or HTML snippet -->
                {tab.content}
              {/if}
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  </div>
{/if}
