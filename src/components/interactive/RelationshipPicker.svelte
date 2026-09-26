<script lang="ts">
  import Modal from "@/components/ui/Modal.svelte";

  interface Props {
    holderName?: string;
    isOpen?: boolean;
    onSelect: (relationship: string) => void;
    onClose: () => void;
  }

  let {
    holderName = "Maria Silva",
    isOpen = false,
    onSelect,
    onClose,
  }: Props = $props();

  const RELATIONSHIPS = [
    { id: "parents", label: "Pai / Mãe", icon: "family" },
    { id: "spouse", label: "Cônjuge / Companheiro(a)", icon: "heart" },
    { id: "children", label: "Filho(a)", icon: "child" },
    { id: "landlord", label: "Proprietário do Imóvel (Aluguel)", icon: "home" },
    { id: "other", label: "Parente / Outro", icon: "user" },
  ] as const;

  function choose(label: string) {
    onSelect(label);
  }
</script>

<Modal
  {isOpen}
  {onClose}
  eyebrow="Titularidade de Terceiro"
  eyebrowVariant="blue"
  title="Declaração de Vínculo"
  description={`Conta identificada no nome de: ${holderName}`}
  testId="relationship-picker-modal"
  size="md"
>
  <div class="flex flex-col gap-4">
    <p class="text-xs text-white/80 font-semibold">
      Qual o seu grau de relacionamento com essa pessoa?
    </p>

    <!-- Lista de Opções de 1 Toque (Sem Formulário) -->
    <div class="flex flex-col gap-2.5" data-testid="relationship-options">
      {#each RELATIONSHIPS as item (item.id)}
        <button
          type="button"
          onclick={() => choose(item.label)}
          data-testid="rel-btn-{item.id}"
          class="flex items-center justify-between w-full min-h-[48px] px-4 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-brand-green hover:border-brand-green text-white font-bold text-sm transition text-left active:scale-[0.99] group shadow-sm cursor-pointer"
        >
          <span>{item.label}</span>
          <span class="text-white/40 group-hover:text-white transition">→</span>
        </button>
      {/each}
    </div>

    <p class="text-[11px] text-white/50 text-center leading-relaxed">
      Declaração simplificada aceita para fins de matrícula conforme portaria MEC/EJA.
    </p>
  </div>
</Modal>
