<script lang="ts">
  import { getAccessToken, subscribeStorage, clearSession } from "@/lib/session";
  import { whoami } from "@/lib/api";
  import { onMount } from "svelte";

  let firstName = $state<string | null>(null);
  let authenticated = $state(false);
  let { showLogout = true }: { showLogout?: boolean } = $props();
  function logout() { clearSession(); window.location.assign("/"); }

  onMount(() => {
    function update() {
      const token = getAccessToken();
      authenticated = Boolean(token);
      if (token) {
        whoami()
          .then((w) => {
            if (typeof w.name === "string" && w.name.trim()) {
              firstName = w.name.split(" ")[0] ?? null;
            }
          })
          .catch(() => {
            firstName = null;
          });
      } else {
        firstName = null;
      }
    }

    update();
    const unsubStorage = subscribeStorage(update);

    return () => {
      unsubStorage();
    };
  });
</script>

<div class="flex items-center gap-2">
  {#if firstName}
    <span class="max-w-[130px] truncate text-xs font-semibold text-white/75 hidden sm:inline">
      Olá, <span class="font-bold text-white">{firstName}</span>
    </span>
  {/if}
  {#if authenticated && showLogout}
    <button type="button" class="logout-button" onclick={logout} aria-label="Sair">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H4V3h5M14 8l4 4-4 4M8 12h10" /></svg>
      <span>Sair</span>
    </button>
  {/if}
</div>
<style>
  .logout-button { min-width: var(--input-height); min-height: var(--input-height); display: inline-flex; align-items: center; justify-content: center; gap: .4rem; padding: .5rem; color: var(--paper); background: transparent; border: 1px solid var(--glass-border-dark); border-radius: var(--input-radius); cursor: pointer; font: 700 .8rem var(--font-sans); }
  .logout-button svg { width: 1.25rem; height: 1.25rem; }
  .logout-button:focus-visible { outline: 2px solid var(--yellow); outline-offset: 3px; }
</style>
