<script lang="ts">
  import Dialog from "@/components/ui/Dialog.svelte";

  interface Props {
    isOpen?: boolean;
    title?: string;
    mediaUrl: string | null;
    isPdf?: boolean;
    onClose: () => void;
  }

  let {
    isOpen = false,
    title = "Visualização do Documento",
    mediaUrl,
    isPdf = false,
    onClose,
  }: Props = $props();
</script>

<Dialog
  {isOpen}
  {onClose}
  {title}
  size="xl"
  eyebrow="Conferência de Documento"
  eyebrowVariant="blue"
  testId="document-preview-dialog"
>
  <div class="flex flex-col items-center justify-center p-2 min-h-[300px]">
    {#if !mediaUrl}
      <div class="flex flex-col items-center justify-center py-12 text-white/50 gap-2">
        <span class="text-3xl">📄</span>
        <p class="text-xs">Nenhum arquivo para exibir.</p>
      </div>
    {:else if isPdf}
      <iframe
        src={mediaUrl}
        title={title}
        class="w-full h-[60dvh] rounded-xl border border-white/10 bg-white"
      ></iframe>
    {:else}
      <div class="relative max-h-[65dvh] overflow-hidden rounded-xl border border-white/15 bg-black/40 flex items-center justify-center">
        <img
          src={mediaUrl}
          alt={title}
          class="max-h-[65dvh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
        />
      </div>
    {/if}

    <div class="mt-4 flex w-full justify-end">
      <button
        type="button"
        onclick={onClose}
        class="min-h-[44px] px-5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer"
      >
        Fechar Visualização
      </button>
    </div>
  </div>
</Dialog>
