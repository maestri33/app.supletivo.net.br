<script lang="ts">
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

{#if isOpen}
  <div
    role="dialog"
    aria-modal="true"
    data-testid="relationship-picker-modal"
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 transition-opacity"
  >
    <div class="w-full max-w-md bg-brand-surface sm:rounded-3xl rounded-t-3xl border border-white/15 p-6 shadow-2xl flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-6">
      
      <!-- Cabeçalho -->
      <div class="flex items-start justify-between border-b border-white/10 pb-4">
        <div class="flex flex-col gap-1">
          <span class="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[10px] font-extrabold text-blue-300 uppercase tracking-wide w-fit border border-blue-400/30">
            Titularidade de Terceiro
          </span>
          <h3 class="text-lg font-black text-white mt-1">Declaração de Vínculo</h3>
          <p class="text-xs text-white/70">
            Conta identificada no nome de: <strong class="text-white underline">{holderName}</strong>
          </p>
        </div>
        <button
          type="button"
          onclick={onClose}
          class="size-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold"
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>

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
            class="flex items-center justify-between w-full min-h-[48px] px-4 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-brand-green hover:border-brand-green text-white font-bold text-sm transition text-left active:scale-[0.99] group shadow-sm"
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
  </div>
{/if}
