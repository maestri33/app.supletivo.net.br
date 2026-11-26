<script lang="ts">
  import { Modal } from "@/components/ui";

  interface Props {
    holderName?: string;
    isOpen?: boolean;
    busy?: boolean;
    onSelect: (relation: string, ownerName: string) => void | Promise<void>;
    onClose: () => void;
  }

  let {
    holderName = "",
    isOpen = false,
    busy = false,
    onSelect,
    onClose,
  }: Props = $props();

  const RELATION_OPTIONS = [
    { value: "mae", label: "Mãe ou Pai" },
    { value: "conjuge", label: "Cônjuge / Companheiro(a)" },
    { value: "irmao", label: "Irmão / Irmã" },
    { value: "filho", label: "Filho(a)" },
    { value: "avo", label: "Avô / Avó" },
    { value: "locador", label: "Locador(a) / Imóvel alugado" },
    { value: "outro_familiar", label: "Outro familiar ou responsável" },
  ] as const;

  let selectedRelation = $state<string>("mae");
  let ownerNameInput = $state<string>("");
  let errorMsg = $state<string>("");

  const cleanHolder = $derived(holderName.trim());
  const needsManualOwnerName = $derived(cleanHolder.length === 0);

  $effect(() => {
    if (isOpen) {
      ownerNameInput = cleanHolder;
      errorMsg = "";
    }
  });

  async function handleSubmit(event: Event) {
    event.preventDefault();
    const resolvedOwner = (needsManualOwnerName ? ownerNameInput : cleanHolder || ownerNameInput).trim();
    if (resolvedOwner.length < 2) {
      errorMsg = "Informe o nome completo do titular que aparece na conta (mínimo 2 caracteres).";
      return;
    }
    errorMsg = "";
    await onSelect(selectedRelation, resolvedOwner);
  }
</script>

<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Titular do comprovante de residência"
>
  <form class="space-y-4" onsubmit={handleSubmit}>
    <p class="text-sm text-white/85">
      {#if cleanHolder}
        O documento está em nome de <strong class="text-white">{cleanHolder}</strong>.
        Informe seu vínculo com essa pessoa para concluirmos a análise.
      {:else}
        O nome no comprovante difere do seu cadastro. Informe o nome completo do titular que consta na conta e qual é o vínculo com você.
      {/if}
    </p>

    {#if needsManualOwnerName}
      <div>
        <label for="kinship-owner-name" class="mb-1.5 block text-xs font-bold uppercase tracking-wide text-white/80">
          Nome completo do titular na conta
        </label>
        <input
          id="kinship-owner-name"
          type="text"
          bind:value={ownerNameInput}
          placeholder="Ex.: João Carlos da Silva"
          required
          minlength="2"
          disabled={busy}
          class="min-h-11 w-full rounded-xl border border-black/15 bg-white px-3.5 text-sm text-[#0b1220] focus:border-[#002776] focus:outline-none"
        />
      </div>
    {/if}

    <div>
      <label for="kinship-relation" class="mb-1.5 block text-xs font-bold uppercase tracking-wide text-white/80">
        Qual é o vínculo com o titular?
      </label>
      <select
        id="kinship-relation"
        bind:value={selectedRelation}
        disabled={busy}
        class="min-h-11 w-full rounded-xl border border-black/15 bg-white px-3.5 text-sm text-[#0b1220] focus:border-[#002776] focus:outline-none"
      >
        {#each RELATION_OPTIONS as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    </div>

    {#if errorMsg}
      <p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700" role="alert">
        {errorMsg}
      </p>
    {/if}

    <div class="flex flex-wrap justify-end gap-2 pt-2">
      <button
        type="button"
        onclick={onClose}
        disabled={busy}
        class="min-h-11 rounded-xl border border-white/20 px-4 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={busy}
        class="min-h-11 rounded-xl bg-[#00734d] px-5 text-sm font-bold text-white hover:opacity-95 disabled:opacity-50"
      >
        {busy ? "Salvando vínculo..." : "Confirmar vínculo"}
      </button>
    </div>
  </form>
</Modal>
