<script lang="ts">
  import { onMount } from "svelte";

  interface Props {
    assignmentTitle?: string;
    assignmentTheme?: string;
    minWords?: number;
    initialText?: string;
    onSubmit?: (result: { text: string; authenticityScore: number; isAiGenerated: boolean }) => void;
  }

  let {
    assignmentTitle = "Redação Dissertativa — EJA Ensino Médio",
    assignmentTheme = "A importância da educação e do trabalho na realização dos meus objetivos de vida",
    minWords = 30,
    initialText = "",
    onSubmit,
  }: Props = $props();

  let essayText = $state(initialText);
  let isEvaluating = $state(false);
  let evaluationResult = $state<{
    isAiGenerated: boolean;
    aiProbability: number;
    authenticityScore: number;
    onTopic: boolean;
    feedback: string;
    source: string;
    latencyMs: number;
  } | null>(null);
  let errorMessage = $state<string | null>(null);
  let submitted = $state(false);

  // Contagem de palavras e caracteres
  let wordCount = $derived.by(() => {
    const trimmed = essayText.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  });
  let meetsMinWords = $derived(wordCount >= minWords);

  async function handleEvaluateAndSubmit() {
    if (!meetsMinWords) {
      errorMessage = `Sua redação precisa ter no mínimo ${minWords} palavras (atualmente tem ${wordCount}).`;
      return;
    }

    isEvaluating = true;
    errorMessage = null;

    try {
      const res = await fetch("/api/v1/academic/essay/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: essayText,
          themePrompt: assignmentTheme,
        }),
      });

      if (!res.ok) {
        throw new Error("Falha na comunicação com o avaliador cognitivo.");
      }

      const data = await res.json();
      evaluationResult = data;

      if (!data.isAiGenerated && data.onTopic) {
        submitted = true;
        onSubmit?.({
          text: essayText,
          authenticityScore: data.authenticityScore,
          isAiGenerated: data.isAiGenerated,
        });
      }
    } catch (err: any) {
      errorMessage = err?.message || "Não foi possível avaliar o texto. Tente novamente.";
    } finally {
      isEvaluating = false;
    }
  }

  function handleReset() {
    submitted = false;
    evaluationResult = null;
    errorMessage = null;
  }
</script>

<div class="w-full max-w-3xl mx-auto rounded-3xl p-6 sm:p-8 bg-[#0b1220] border border-white/15 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] text-white font-sans transition-all">
  <!-- Header do Exercício -->
  <div class="border-b border-white/10 pb-5 mb-6">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00734d]/20 border border-[#00734d]/40 text-[#4ade80] text-xs font-bold uppercase tracking-wider mb-2">
      <span class="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse"></span>
      Avaliação Acadêmica com Integridade Jev
    </div>
    <h2 class="text-xl sm:text-2xl font-['Archivo_Black',sans-serif] text-white leading-tight">
      {assignmentTitle}
    </h2>
    <p class="text-sm text-[#b9c3db] mt-1.5">
      <strong class="text-white">Tema Proposto:</strong> "{assignmentTheme}"
    </p>
  </div>

  {#if submitted && evaluationResult}
    <!-- Estado de Sucesso / Entrega Concluída -->
    <div class="rounded-2xl p-6 bg-[#00734d]/15 border border-[#00734d]/40 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
      <div class="w-14 h-14 rounded-full bg-[#00734d] text-white flex items-center justify-center mx-auto text-2xl font-bold shadow-lg shadow-[#00734d]/50">
        ✓
      </div>
      <div>
        <h3 class="text-lg font-bold text-white">Redação Entregue com Sucesso!</h3>
        <p class="text-xs text-[#b9c3db] mt-1">
          {evaluationResult.feedback}
        </p>
      </div>

      <div class="grid grid-cols-2 gap-3 max-w-sm mx-auto text-left pt-2">
        <div class="bg-white/5 rounded-xl p-3 border border-white/10">
          <span class="text-[10px] text-white/60 uppercase font-semibold block">Voz Autêntica EJA</span>
          <span class="text-sm font-bold text-[#ffd75e]">Nota {evaluationResult.authenticityScore.toFixed(1)} / 3.0</span>
        </div>
        <div class="bg-white/5 rounded-xl p-3 border border-white/10">
          <span class="text-[10px] text-white/60 uppercase font-semibold block">Autoria Humana</span>
          <span class="text-sm font-bold text-[#4ade80]">100% Confirmada</span>
        </div>
      </div>

      <button
        type="button"
        onclick={handleReset}
        class="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-white/80 bg-white/10 hover:bg-white/15 border border-white/20 transition cursor-pointer"
      >
        Editar ou Submeter Nova Versão
      </button>
    </div>
  {:else}
    <!-- Formulário de Redação -->
    <div class="space-y-4">
      <div>
        <label for="essay-input" class="block text-xs font-bold text-[#b9c3db] uppercase tracking-wider mb-2">
          Sua Redação:
        </label>
        <textarea
          id="essay-input"
          bind:value={essayText}
          disabled={isEvaluating}
          rows={8}
          placeholder="Escreva sua dissertação aqui com suas próprias palavras e experiências..."
          class="w-full rounded-2xl p-4 bg-[#121d33] border border-white/15 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#ffc400] focus:border-transparent text-sm leading-relaxed resize-y transition"
        ></textarea>
      </div>

      <!-- Barra de Status de Palavras -->
      <div class="flex items-center justify-between text-xs">
        <div class="flex items-center gap-2">
          <span class="font-medium {meetsMinWords ? 'text-[#4ade80]' : 'text-amber-400'}">
            {wordCount} palavras
          </span>
          <span class="text-white/40">/ mínimo de {minWords}</span>
        </div>
        {#if wordCount > 0 && !meetsMinWords}
          <span class="text-amber-400 text-[11px]">
            Faltam {minWords - wordCount} palavras
          </span>
        {/if}
      </div>

      <!-- Alertas de Erro ou Detecção de IA -->
      {#if errorMessage}
        <div class="rounded-xl p-3 bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      {/if}

      {#if evaluationResult && evaluationResult.isAiGenerated}
        <div class="rounded-xl p-4 bg-amber-500/15 border border-amber-500/50 text-xs text-amber-200 space-y-2">
          <div class="flex items-center gap-2 font-bold text-amber-300">
            <span>🛡️</span>
            <span>Atenção: Indícios de Texto Gerado por Inteligência Artificial</span>
          </div>
          <p class="text-white/80 leading-relaxed">
            {evaluationResult.feedback}
          </p>
          <p class="text-[11px] text-white/60">
            A EJA valoriza a sua trajetória real e voz única. Por favor, reescreva expressando suas opiniões e vivências com suas próprias palavras.
          </p>
        </div>
      {/if}

      <!-- Ações -->
      <div class="pt-2 flex items-center justify-end gap-3">
        <button
          type="button"
          disabled={isEvaluating || !meetsMinWords}
          onclick={handleEvaluateAndSubmit}
          class="min-h-[48px] px-6 py-3 rounded-2xl font-bold text-sm bg-[#ffc400] text-[#0b1220] hover:bg-[#ffd75e] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition shadow-[0_12px_24px_-8px_rgba(255,196,0,0.4)] cursor-pointer flex items-center gap-2"
        >
          {#if isEvaluating}
            <span class="w-4 h-4 border-2 border-[#0b1220] border-t-transparent rounded-full animate-spin"></span>
            <span>Analisando Integridade Jev…</span>
          {:else}
            <span>Entregar Redação →</span>
          {/if}
        </button>
      </div>
    </div>
  {/if}
</div>
