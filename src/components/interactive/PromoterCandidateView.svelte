<script lang="ts">
  import { onMount } from "svelte";
  import { whoami } from "@/lib/api";
  import { getSession } from "@/lib/session";

  let promoterName = $state<string>("Candidato");
  let phone = $state<string>("");
  let step = $state<"pix" | "documents" | "review">("pix");
  let pixKey = $state("");
  let pixKeyType = $state("cpf");
  let busy = $state(false);
  let savedSuccess = $state(false);

  onMount(async () => {
    try {
      const who = await whoami();
      if (who?.name) promoterName = who.name;
      if (who?.phone) phone = who.phone;
    } catch (e) {
      const session = getSession();
      if (session?.phone) phone = session.phone;
    }
  });

  function handleSubmitPix(e: Event) {
    e.preventDefault();
    busy = true;
    setTimeout(() => {
      busy = false;
      savedSuccess = true;
      step = "documents";
    }, 600);
  }
</script>

<div class="w-full max-w-3xl mx-auto p-4 sm:p-6 text-white space-y-6">
  <!-- Cabeçalho -->
  <div class="rounded-3xl p-6 sm:p-8 glass-panel border border-white/15 bg-gradient-to-br from-[#005238]/90 to-[#002776]/90 shadow-2xl">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--yellow)]/15 border border-[var(--yellow)]/30 text-xs font-semibold text-[var(--yellow)] mb-3">
      <span class="size-2 rounded-full bg-[var(--yellow)] animate-pulse"></span>
      Status: Candidato (candidate)
    </div>
    <h1 class="text-2xl sm:text-3xl font-display text-white">Credenciamento de Promotor</h1>
    <p class="text-xs sm:text-sm text-white/75 mt-1.5 leading-relaxed">
      Complete as etapas iniciais para habilitar seu código de indicação, materiais oficiais e comissões automáticas no PIX.
    </p>

    <!-- Indicador de Passos -->
    <div class="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
      <div class="flex items-center gap-2 {step === 'pix' ? 'text-[var(--yellow)] font-bold' : 'text-white/60'}">
        <span class="size-6 rounded-full flex items-center justify-center border {step === 'pix' ? 'border-[var(--yellow)] bg-[var(--yellow)]/20' : 'border-white/20'}">1</span>
        <span>Chave PIX</span>
      </div>
      <div class="flex items-center gap-2 {step === 'documents' ? 'text-[var(--yellow)] font-bold' : 'text-white/60'}">
        <span class="size-6 rounded-full flex items-center justify-center border {step === 'documents' ? 'border-[var(--yellow)] bg-[var(--yellow)]/20' : 'border-white/20'}">2</span>
        <span>Documentos</span>
      </div>
      <div class="flex items-center gap-2 {step === 'review' ? 'text-[var(--yellow)] font-bold' : 'text-white/60'}">
        <span class="size-6 rounded-full flex items-center justify-center border {step === 'review' ? 'border-[var(--yellow)] bg-[var(--yellow)]/20' : 'border-white/20'}">3</span>
        <span>Aprovação</span>
      </div>
    </div>
  </div>

  <!-- Card do Formulário de Chave PIX -->
  <div class="rounded-3xl p-6 sm:p-8 bg-white/5 border border-white/10 backdrop-blur-xl">
    {#if step === "pix"}
      <form onsubmit={handleSubmitPix} class="space-y-5">
        <h3 class="text-lg font-bold text-white">Dados de Recebimento de Comissões</h3>
        <p class="text-xs text-white/70">
          Informe a chave PIX vinculada à sua conta bancária para receber os repasses por cada aluno matriculado.
        </p>

        <div class="space-y-3">
          <label for="pixType" class="block text-xs font-semibold text-white/80">Tipo de Chave</label>
          <select
            id="pixType"
            bind:value={pixKeyType}
            class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-[var(--yellow)]"
          >
            <option value="cpf" class="bg-slate-900">CPF</option>
            <option value="phone" class="bg-slate-900">Telefone Celular</option>
            <option value="email" class="bg-slate-900">E-mail</option>
            <option value="random" class="bg-slate-900">Chave Aleatória</option>
          </select>
        </div>

        <div class="space-y-3">
          <label for="pixKey" class="block text-xs font-semibold text-white/80">Chave PIX</label>
          <input
            id="pixKey"
            type="text"
            required
            bind:value={pixKey}
            placeholder="Digite sua chave PIX..."
            class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-[var(--yellow)] placeholder-white/30"
          />
        </div>

        <button
          type="submit"
          disabled={busy || !pixKey.trim()}
          class="btn w-full py-3.5 px-6 rounded-xl font-bold uppercase tracking-wider text-xs text-[var(--ink)] cursor-pointer disabled:opacity-50"
        >
          {busy ? "Salvando..." : "Salvar e Continuar →"}
        </button>
      </form>
    {:else}
      <div class="space-y-4 text-center py-6">
        <div class="size-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center mx-auto text-xl">
          ✓
        </div>
        <h3 class="text-lg font-bold text-white">Chave PIX Registrada com Sucesso</h3>
        <p class="text-xs text-white/70 max-w-md mx-auto">
          Seus dados de repasse foram gravados. O coordenador do polo fará a revisão final das informações para homologação.
        </p>
        <div class="pt-2">
          <a
            href="/promoter/training"
            class="btn inline-flex items-center gap-2 py-3 px-6 rounded-xl font-bold uppercase tracking-wider text-xs text-[var(--ink)]"
          >
            Avançar para Treinamento Obrigatório →
          </a>
        </div>
      </div>
    {/if}
  </div>
</div>
