<script lang="ts">
  import { onDestroy } from "svelte";
  import { getErrorMessage } from "@/lib/api";
  import { fetchPrivateMedia, openPrivateMedia } from "@/lib/private-media";

  interface Props {
    path: string | null | undefined;
    alt?: string;
    compact?: boolean;
  }

  let { path, alt = "Documento privado", compact = false }: Props = $props();

  let objectUrl = $state<string | null>(null);
  let mimeType = $state<string>("");
  let loading = $state(false);
  let errMsg = $state("");

  // Non-reactive handle prevents $effect from re-running when objectUrl updates.
  let activeUrl: string | null = null;

  function revokeActive() {
    if (activeUrl) {
      URL.revokeObjectURL(activeUrl);
      activeUrl = null;
    }
    objectUrl = null;
  }

  onDestroy(() => {
    revokeActive();
  });

  $effect(() => {
    const target = path?.trim();
    revokeActive();
    mimeType = "";
    errMsg = "";
    if (!target) return;

    let cancelled = false;
    loading = true;

    void fetchPrivateMedia(target)
      .then((blob) => {
        if (cancelled) return;
        const created = URL.createObjectURL(blob);
        activeUrl = created;
        mimeType = blob.type || "";
        objectUrl = created;
      })
      .catch((err) => {
        if (cancelled) return;
        errMsg = getErrorMessage(err);
      })
      .finally(() => {
        if (!cancelled) loading = false;
      });

    return () => {
      cancelled = true;
      revokeActive();
    };
  });

  async function handleOpen() {
    if (!path) return;
    errMsg = "";
    try {
      await openPrivateMedia(path);
    } catch (err) {
      errMsg = getErrorMessage(err);
    }
  }
</script>

{#if !path}
  <p class="text-xs text-white/60">Sem arquivo anexado</p>
{:else}
  <div class="space-y-2">
    {#if loading}
      <div class="flex h-28 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-xs text-white/60">
        Carregando mídia protegida...
      </div>
    {:else if errMsg}
      <p class="rounded-lg border border-rose-500/30 bg-rose-500/15 px-2.5 py-1.5 text-xs text-rose-200">{errMsg}</p>
    {:else if objectUrl && (!mimeType || mimeType.startsWith("image/"))}
      <img
        src={objectUrl}
        {alt}
        class={`w-full rounded-xl border border-white/15 bg-white/5 object-contain ${compact ? "max-h-36" : "max-h-72"}`}
      />
    {:else if objectUrl && mimeType === "application/pdf"}
      <div class="rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-xs font-semibold text-white">
        Documento em PDF pronto para visualização.
      </div>
    {/if}

    <button
      type="button"
      onclick={handleOpen}
      class="min-h-9 rounded-lg border border-white/20 bg-white/5 px-3 text-xs font-bold text-sky-300 hover:bg-white/10"
    >
      Abrir arquivo em nova aba
    </button>
  </div>
{/if}
