<script lang="ts">
  import { onMount } from "svelte";
  import { whoami } from "@/lib/api";

  let promoterName = $state<string>("Promotor");
  let activeModule = $state<number>(1);
  let answer = $state<string>("");
  let busy = $state<boolean>(false);
  let submitted = $state<boolean>(false);

  onMount(async () => {
    try {
      const who = await whoami();
      if (who?.name) promoterName = who.name;
    } catch (e) {}
  });

  function handleSubmitAnswer(e: Event) {
    e.preventDefault();
    busy = true;
    setTimeout(() => {
      busy = false;
      submitted = true;
    }, 700);
  }
</script>

<div class="w-full max-w-3xl mx-auto p-4 sm:p-6 text-white space-y-6">
  <!-- Card de Atenção / Trava de Treinamento -->
  <div class="rounded-3xl p-6 sm:p-8 glass-panel border border-amber-500/40 bg-gradient-to-br from-amber-950/60 to-[#002776]/90 shadow-2xl">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-xs font-semibold text-amber-300 mb-3">
      <span class="size-2 rounded-full bg-amber-400 animate-ping"></span>
      Status de Atenção: Treinamento (training)
    </div>
    <h1 class="text-2xl sm:text-3xl font-display text-white">Treinamento Obrigatório Pendente</h1>
    <p class="text-xs sm:text-sm text-amber-100/80 mt-1.5 leading-relaxed">
      Enquanto houver matéria obrigatória pendente, a role de bloqueio <strong>training</strong> permanece ativa e seu link de indicação fica restrito.
      Conclua os módulos abaixo para liberação imediata.
    </p>

    <div class="mt-6 flex flex-wrap items-center gap-3 text-xs">
      <button
        type="button"
        onclick={() => (activeModule = 1)}
        class="px-4 py-2 rounded-xl border transition-all cursor-pointer {activeModule === 1 ? 'border-[var(--yellow)] bg-[var(--yellow)]/20 text-[var(--yellow)] font-bold' : 'border-white/20 bg-white/5 text-white/70'}"
      >
        Módulo 1: Apresentação da Plataforma EJA
      </button>
      <button
        type="button"
        onclick={() => (activeModule = 2)}
        class="px-4 py-2 rounded-xl border transition-all cursor-pointer {activeModule === 2 ? 'border-[var(--yellow)] bg-[var(--yellow)]/20 text-[var(--yellow)] font-bold' : 'border-white/20 bg-white/5 text-white/70'}"
      >
        Módulo 2: Técnicas Éticas de Captação
      </button>
    </div>
  </div>

  <!-- Conteúdo do Treinamento -->
  <div class="rounded-3xl p-6 sm:p-8 bg-white/5 border border-white/10 backdrop-blur-xl space-y-6">
    {#if activeModule === 1}
      <div class="space-y-4">
        <h3 class="text-lg font-bold text-white">Módulo 1: O Modelo de Conclusão Acelerada</h3>
        <p class="text-xs sm:text-sm text-white/80 leading-relaxed">
          O Supletivo Brasil conecta alunos adultos que não concluíram a educação básica regular a polos credenciados pelo MEC e conselhos estaduais.
          Os alunos realizam aulas online e realizam o exame presencial ou banca avaliadora com total segurança jurídica.
        </p>

        <div class="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
          <strong class="text-xs font-bold text-[var(--yellow)] uppercase tracking-wider block">Questão de Verificação (Avaliada por IA)</strong>
          <p class="text-xs sm:text-sm text-white/90">
            Como você deve explicar ao futuro aluno a validade oficial do certificado de conclusão emitido pelo polo?
          </p>

          {#if !submitted}
            <form onsubmit={handleSubmitAnswer} class="space-y-3 pt-2">
              <textarea
                required
                rows={3}
                bind:value={answer}
                placeholder="Escreva sua resposta com suas palavras..."
                class="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white text-xs sm:text-sm focus:outline-none focus:border-[var(--yellow)]"
              ></textarea>
              <button
                type="submit"
                disabled={busy || !answer.trim()}
                class="btn py-2.5 px-6 rounded-xl font-bold uppercase tracking-wider text-xs text-[var(--ink)] cursor-pointer disabled:opacity-50"
              >
                {busy ? "Enviando para Correção..." : "Submeter Resposta →"}
              </button>
            </form>
          {:else}
            <div class="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs flex items-center justify-between">
              <span>✓ Resposta submetida e homologada com sucesso!</span>
              <a href="/promoter/active" class="font-bold underline text-white">Ir para Painel Ativo →</a>
            </div>
          {/if}
        </div>
      </div>
    {:else}
      <div class="space-y-4">
        <h3 class="text-lg font-bold text-white">Módulo 2: Técnicas Éticas de Captação</h3>
        <p class="text-xs sm:text-sm text-white/80 leading-relaxed">
          Nossos consultores operam sempre com transparência sobre os requisitos de idade (mínimo de 18 anos para Ensino Médio e 15 anos para Ensino Fundamental).
        </p>
      </div>
    {/if}
  </div>
</div>
