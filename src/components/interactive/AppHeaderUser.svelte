<script lang="ts">
  import { getAccessToken, subscribeStorage } from "@/lib/session";
  import { whoami } from "@/lib/api";
  import { onMount } from "svelte";

  let firstName = $state<string | null>(null);
  let isAdmin = $state<boolean>(false);

  onMount(() => {
    function update() {
      const token = getAccessToken();
      if (token) {
        whoami()
          .then((w) => {
            if (typeof w.name === "string" && w.name.trim()) {
              firstName = w.name.split(" ")[0] ?? null;
            }
            const roles = Array.isArray(w.roles) ? w.roles : [];
            isAdmin = roles.includes("admin") || roles.includes("staff");
          })
          .catch(() => {
            firstName = null;
            isAdmin = false;
          });
      } else {
        firstName = null;
        isAdmin = false;
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

  {#if isAdmin}
    <a
      href="https://admin.supletivo.net.br"
      target="_blank"
      rel="noopener"
      class="px-2 py-1 rounded bg-[var(--yellow)]/15 border border-[var(--yellow)]/30 text-[10px] font-bold text-[var(--yellow)] hover:bg-[var(--yellow)]/25 transition-colors uppercase tracking-wider inline-flex items-center gap-1 min-h-[32px]"
      title="Acessar Cockpit de Administração"
    >
      Admin &nearr;
    </a>
  {/if}
</div>
