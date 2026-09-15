<script lang="ts">
  import { getLeadSession, subscribeLeadSession } from "@/lib/funnel/lead-session";
  import { getAccessToken, subscribeStorage } from "@/lib/session";
  import { whoami } from "@/lib/api";
  import { onMount } from "svelte";

  let firstName = $state<string | null>(null);

  onMount(() => {
    function update() {
      const lead = getLeadSession();
      const token = getAccessToken();
      if (lead.loggedIn && lead.name) {
        firstName = lead.name.split(" ")[0] ?? null;
        return;
      }
      if (token) {
        whoami()
          .then((w) => {
            if (typeof w.name === "string" && w.name.trim()) {
              firstName = w.name.split(" ")[0] ?? null;
            }
          })
          .catch(() => {});
      } else {
        firstName = null;
      }
    }

    update();
    const unsubLead = subscribeLeadSession(update);
    const unsubStorage = subscribeStorage(update);

    return () => {
      unsubLead();
      unsubStorage();
    };
  });
</script>

{#if firstName}
  <span class="max-w-[130px] truncate text-xs font-semibold text-white/75 hidden sm:inline">
    Olá, <span class="font-bold text-white">{firstName}</span>
  </span>
{/if}
