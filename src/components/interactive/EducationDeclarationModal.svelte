<script lang="ts">
  import { Modal } from "@/components/ui";

  interface Props {
    open?: boolean;
    busy?: boolean;
    summary?: string;
    onConfirm: () => void | Promise<void>;
    onClose: () => void;
  }

  let {
    open = false,
    busy = false,
    summary = "",
    onConfirm,
    onClose,
  }: Props = $props();
</script>

<Modal isOpen={open} {onClose} title="Declaração de escolaridade anterior">
  <div class="space-y-4">
    <p class="text-sm text-white/85 leading-relaxed">
      Declaro, para fins de matrícula na Educação de Jovens e Adultos (EJA), que as informações prestadas sobre minha escolaridade anterior são verdadeiras e estou ciente de que a certificação depende da apresentação do histórico escolar quando solicitado pela secretaria.
    </p>

    {#if summary}
      <div class="rounded-xl border border-white/15 bg-white/10 p-3 text-xs font-medium text-white/90">
        {summary}
      </div>
    {/if}

    <div class="flex flex-wrap justify-end gap-2 pt-2">
      <button
        type="button"
        onclick={onClose}
        disabled={busy}
        class="min-h-11 rounded-xl border border-white/20 px-4 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
      >
        Revisar dados
      </button>
      <button
        type="button"
        onclick={onConfirm}
        disabled={busy}
        class="min-h-11 rounded-xl bg-[#00734d] px-5 text-sm font-bold text-white hover:opacity-95 disabled:opacity-50"
      >
        {busy ? "Registrando..." : "Concordo e confirmo"}
      </button>
    </div>
  </div>
</Modal>
