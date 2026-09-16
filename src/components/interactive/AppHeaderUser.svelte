<script lang="ts">
  import { getAccessToken, subscribeStorage } from "@/lib/session";
  import { whoami } from "@/lib/api";
  import { onMount } from "svelte";

  let firstName = $state<string | null>(null);

  onMount(() => {
    function update() {
      const token = getAccessToken();
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

{#if firstName}
  <span class="max-w-[130px] truncate text-xs font-semibold text-white/75 hidden sm:inline">
    Olá, <span class="font-bold text-white">{firstName}</span>
  </span>
{/if}
