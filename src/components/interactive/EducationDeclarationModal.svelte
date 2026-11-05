<script lang="ts">
  import Dialog from "@/components/ui/Dialog.svelte";

  type Role = "student" | "promoter";
  interface Props {
    role: Role;
    open: boolean;
    onConfirm: () => void;
  }

  let { role, open = false, onConfirm }: Props = $props();
  let accepted = $state(false);

  const isStudent = $derived(role === "student");

  $effect(() => {
    if (open) {
      accepted = false;
    }
  });

  function handleConfirm() {
    if (accepted) {
      onConfirm();
    }
  }
</script>

<Dialog
  isOpen={open}
  onClose={() => {}}
  title="Confirme suas informações"
  eyebrow="Declaração obrigatória"
  eyebrowVariant="blue"
  showCloseButton={false}
  closeOnEscape={false}
  closeOnBackdrop={false}
  testId="education-declaration-dialog"
  size="md"
>
  <div class="flex flex-col gap-4 text-white">
    <div class="size-12 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center border border-blue-400/30" aria-hidden="true">
      <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3 4 7v5c0 5 3.3 8 8 9 4.7-1 8-4 8-9V7l-8-4Z" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </svg>
    </div>

    <p id="education-declaration-copy" class="text-xs sm:text-sm text-white/80 leading-relaxed">
      {#if isStudent}
        Declaro que as informações escolares são verdadeiras. Sei que a instituição parceira usará esses dados na matrícula externa e que a documentação escolar será conferida depois; sem a documentação exigida, o início dos estudos ou a prova poderá ficar impedido.
      {:else}
        Declaro que as informações escolares e cadastrais são verdadeiras. Assumo a responsabilidade por elas no meu credenciamento de promotor e estou ciente de que a análise pode pedir comprovação.
      {/if}
    </p>

    <label class="flex items-start gap-3 p-3.5 rounded-xl border border-white/15 bg-white/5 cursor-pointer font-bold text-xs sm:text-sm hover:border-white/30 transition min-h-[48px]">
      <input type="checkbox" bind:checked={accepted} class="size-5 rounded mt-0.5 accent-[var(--green)] shrink-0" />
      <span>Li, entendi e confirmo que as informações são verdadeiras.</span>
    </label>

    <button
      type="button"
      class="btn w-full min-h-[48px] rounded-full bg-yellow text-ink font-bold transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      disabled={!accepted}
      onclick={handleConfirm}
    >
      Confirmar e continuar
    </button>

    <p class="text-xs text-center text-white/50">
      Você poderá corrigir os dados antes de confirmar.
    </p>
  </div>
</Dialog>
