<script lang="ts">
  import { onMount } from "svelte";
  import { getEnrollmentMe, postEnrollmentEducation, getErrorMessage, type EducationLevel } from "@/lib/api";
  import { expectedStatus, followEnrollmentStatus } from "./workflow";
  import { fetchCities, fetchUfs, type UfOption } from "@/lib/ibge";
  import EducationDeclarationModal from "../EducationDeclarationModal.svelte";
  import Alert from "@/components/ui/Alert.svelte";
  import Card from "@/components/ui/Card.svelte";
  import Skeleton from "@/components/ui/Skeleton.svelte";

  let loading = $state(true), busy = $state(false), error = $state("");
  let level = $state<EducationLevel | null>(null), grade = $state<number | null>(null), completed = $state<boolean | null>(null);
  let state = $state(""), city = $state(""), lastSchool = $state("");
  let ufs = $state<UfOption[]>([]), cities = $state<string[]>([]), locationLoading = $state(false), locationError = $state("");
  let showDeclaration = $state(false);
  let invalidCompletedMax = $derived(level === "medio" && grade === 3 && completed === true);
  let cityValid = $derived(cities.includes(city.trim()));

  async function loadCities(nextState: string, keepCity = false) {
    state = nextState; if (!keepCity) city = ""; cities = []; locationError = "";
    if (!nextState) return;
    locationLoading = true;
    try { cities = await fetchCities(nextState); }
    catch (cause) { locationError = cause instanceof Error ? "Não foi possível carregar as cidades agora." : "Não foi possível carregar as cidades."; }
    finally { locationLoading = false; }
  }

  async function load() {
    loading = true; error = "";
    try {
      const me = await getEnrollmentMe();
      try { ufs = await fetchUfs(); } catch { locationError = "Não foi possível carregar os estados agora."; }
      if (followEnrollmentStatus(me.status)) return;
      if (me.status !== "education") { error = "A escolaridade não está disponível nesta etapa da matrícula."; return; }
      level = me.education?.level ?? null; grade = me.education?.grade ?? null; completed = me.education?.completed ?? null;
      state = me.education?.state ?? ""; city = me.education?.city ?? ""; lastSchool = me.education?.last_school ?? "";
      if (state) await loadCities(state, true);
    } catch (cause) { error = getErrorMessage(cause); } finally { loading = false; }
  }

  async function save(event: SubmitEvent) {
    event.preventDefault(); if (!level || grade === null || completed === null || !state || !cityValid || busy || invalidCompletedMax) return;
    showDeclaration = true;
  }

  async function confirmDeclaration() {
    busy = true; error = "";
    showDeclaration = false;
    try {
      const me = await postEnrollmentEducation({
        level: level!,
        grade: grade!,
        completed: completed!,
        state,
        city: city.trim(),
        last_school: lastSchool.trim(),
        declaration_accepted: true,
      });
      followEnrollmentStatus(me.status);
    } catch (cause) {
      error = getErrorMessage(cause);
      const status = expectedStatus(cause);
      if (status) followEnrollmentStatus(status);
    } finally {
      busy = false;
    }
  }

  onMount(() => { void load(); });
</script>

<section class="w-full max-w-2xl mx-auto p-4 sm:p-6 space-y-6 text-white" aria-busy={loading || busy}>
  <div class="space-y-2">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--green)]/15 border border-[var(--green)]/30 text-xs font-semibold text-emerald-300">
      <span class="size-2 rounded-full bg-[var(--green)] animate-pulse"></span>
      Etapa da Matrícula
    </div>
    <h1 class="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
      Onde você parou de estudar?
    </h1>
    <p class="text-xs sm:text-sm text-white/70">
      Escolha o último ano que frequentou. O polo usará essa informação na matrícula.
    </p>
  </div>

  {#if loading}
    <div class="space-y-4">
      <Skeleton class="h-12 w-full rounded-2xl" />
      <Skeleton class="h-48 w-full rounded-3xl" />
    </div>
  {:else}
    <form class="space-y-6" onsubmit={save}>
      <!-- Nível de ensino -->
      <Card title="Nível de Ensino" description="Selecione o grau de escolaridade anterior" class="border-white/15 bg-white/5 backdrop-blur-2xl">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            class="min-h-[48px] px-5 py-3 rounded-2xl border text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center justify-between {level === 'fundamental' ? 'border-[var(--yellow)] bg-[var(--yellow)]/15 text-white shadow-lg' : 'border-white/10 bg-white/5 hover:border-white/20 text-white/80'}"
            aria-pressed={level === "fundamental"}
            disabled={busy}
            onclick={() => { level = "fundamental"; grade = null; completed = null; }}
          >
            <span>Ensino Fundamental</span>
            {#if level === "fundamental"}
              <span class="size-2 rounded-full bg-[var(--yellow)]"></span>
            {/if}
          </button>
          <button
            type="button"
            class="min-h-[48px] px-5 py-3 rounded-2xl border text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center justify-between {level === 'medio' ? 'border-[var(--yellow)] bg-[var(--yellow)]/15 text-white shadow-lg' : 'border-white/10 bg-white/5 hover:border-white/20 text-white/80'}"
            aria-pressed={level === "medio"}
            disabled={busy}
            onclick={() => { level = "medio"; grade = null; completed = null; }}
          >
            <span>Ensino Médio</span>
            {#if level === "medio"}
              <span class="size-2 rounded-full bg-[var(--yellow)]"></span>
            {/if}
          </button>
        </div>
      </Card>

      <!-- Último ano frequentado -->
      {#if level}
        <Card title="Último ano frequentado" description={`Selecione a série que você cursou no ${level === 'fundamental' ? 'Ensino Fundamental' : 'Ensino Médio'}`} class="border-white/15 bg-white/5 backdrop-blur-2xl">
          <div class="grid grid-cols-3 sm:grid-cols-5 gap-2.5 pt-2">
            {#each Array.from({ length: level === "fundamental" ? 9 : 3 }, (_, index) => index + 1) as year}
              <button
                type="button"
                class="min-h-[48px] px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer {grade === year ? 'border-[var(--yellow)] bg-[var(--yellow)]/20 text-white shadow-md' : 'border-white/10 bg-white/5 hover:border-white/20 text-white/70'}"
                aria-pressed={grade === year}
                disabled={busy}
                onclick={() => { grade = year; completed = null; }}
              >
                {year}º ano
              </button>
            {/each}
          </div>
        </Card>
      {/if}

      <!-- Conclusão do ano -->
      {#if grade !== null}
        <Card title="Você terminou esse ano?" description="Indique se você concluiu ou parou no decorrer do ano letivo" class="border-white/15 bg-white/5 backdrop-blur-2xl">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              class="min-h-[48px] px-5 py-3 rounded-2xl border text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center justify-between {completed === true ? 'border-emerald-400 bg-emerald-500/20 text-white shadow-lg' : 'border-white/10 bg-white/5 hover:border-white/20 text-white/80'}"
              aria-pressed={completed === true}
              disabled={busy}
              onclick={() => { completed = true; }}
            >
              <span>Terminei o ano</span>
              {#if completed === true}
                <span class="size-2 rounded-full bg-emerald-400"></span>
              {/if}
            </button>
            <button
              type="button"
              class="min-h-[48px] px-5 py-3 rounded-2xl border text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center justify-between {completed === false ? 'border-amber-400 bg-amber-500/20 text-white shadow-lg' : 'border-white/10 bg-white/5 hover:border-white/20 text-white/80'}"
              aria-pressed={completed === false}
              disabled={busy}
              onclick={() => { completed = false; }}
            >
              <span>Não terminei o ano</span>
              {#if completed === false}
                <span class="size-2 rounded-full bg-amber-400"></span>
              {/if}
            </button>
          </div>
        </Card>
      {/if}

      <!-- Dados da Escola -->
      {#if completed !== null}
        <Card title="Dados da Escola" description="Localização da última instituição que frequentou" class="border-white/15 bg-white/5 backdrop-blur-2xl space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div class="space-y-1.5">
              <label for="education-state" class="block text-xs font-bold text-white/80">
                Estado da escola *
              </label>
              <select
                id="education-state"
                value={state}
                onchange={(event) => void loadCities((event.currentTarget as HTMLSelectElement).value)}
                required
                disabled={busy || !ufs.length}
                class="w-full h-12 rounded-xl bg-white/10 border border-white/20 px-3 text-sm text-white focus:outline-none focus:border-[var(--yellow)] transition cursor-pointer"
              >
                <option value="" class="bg-[var(--ink)] text-white">Selecione o estado</option>
                {#each ufs as uf}
                  <option value={uf.sigla} class="bg-[var(--ink)] text-white">{uf.nome} ({uf.sigla})</option>
                {/each}
              </select>
            </div>

            <div class="space-y-1.5">
              <label for="education-cities-input" class="block text-xs font-bold text-white/80">
                Cidade da escola *
              </label>
              <input
                id="education-cities-input"
                list="education-cities"
                bind:value={city}
                required
                maxlength="120"
                autocomplete="off"
                disabled={busy || !state || locationLoading}
                placeholder={locationLoading ? "Carregando cidades…" : "Digite para buscar"}
                class="w-full h-12 rounded-xl bg-white/10 border border-white/20 px-4 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[var(--yellow)] transition"
              />
              <datalist id="education-cities">
                {#each cities as municipality}
                  <option value={municipality}></option>
                {/each}
              </datalist>
            </div>
          </div>

          {#if locationError}
            <Alert variant="danger" title="Erro no carregamento" description={locationError} />
          {/if}

          {#if city && !cityValid}
            <Alert variant="warning" title="Cidade não localizada" description="Escolha uma cidade da lista oficial do IBGE para prosseguir." />
          {/if}

          <div class="space-y-1.5">
            <label for="education-school-name" class="block text-xs font-bold text-white/80">
              Nome da escola (opcional)
            </label>
            <input
              id="education-school-name"
              bind:value={lastSchool}
              maxlength="200"
              autocomplete="off"
              disabled={busy}
              placeholder="Ex: Escola Estadual Machado de Assis"
              class="w-full h-12 rounded-xl bg-white/10 border border-white/20 px-4 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[var(--yellow)] transition"
            />
          </div>

          {#if invalidCompletedMax}
            <Alert variant="warning" title="Ensino Médio Concluído" description="Você informou o 3º ano do Ensino Médio concluído. Esta matrícula não é o fluxo correto para quem já concluiu o Ensino Médio. Fale com a secretaria do polo." />
          {/if}

          <div class="pt-2">
            <button
              type="submit"
              disabled={busy || !state || !cityValid || invalidCompletedMax}
              class="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-2xl bg-[var(--yellow)] hover:bg-[var(--yellow-soft)] text-brand-ink font-bold text-sm shadow-xl transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {busy ? "Salvando…" : "Salvar escolaridade →"}
            </button>
          </div>
        </Card>
      {/if}
    </form>
  {/if}

  {#if error}
    <div class="space-y-3">
      <Alert variant="danger" title="Erro na etapa" description={error} />
      <button
        type="button"
        onclick={load}
        disabled={busy}
        class="min-h-[48px] px-6 py-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition cursor-pointer"
      >
        Consultar etapa novamente
      </button>
    </div>
  {/if}
</section>

<EducationDeclarationModal role="student" open={showDeclaration} onConfirm={confirmDeclaration} />
