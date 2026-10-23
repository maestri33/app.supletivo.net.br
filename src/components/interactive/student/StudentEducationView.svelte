<script lang="ts">
  import { onMount } from "svelte";
  import { getEnrollmentMe, postEnrollmentEducation, getErrorMessage, type EducationLevel } from "@/lib/api";
  import { expectedStatus, followEnrollmentStatus } from "./workflow";
  import { fetchCities, fetchUfs, type UfOption } from "@/lib/ibge";
  import EducationDeclarationModal from "../EducationDeclarationModal.svelte";
  import "./workflow.css";
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
    try { const me = await postEnrollmentEducation({ level: level!, grade: grade!, completed: completed!, state, city: city.trim(), last_school: lastSchool.trim(), declaration_accepted: true }); followEnrollmentStatus(me.status); }
    catch (cause) { error = getErrorMessage(cause); const status = expectedStatus(cause); if (status) followEnrollmentStatus(status); }
    finally { busy = false; }
  }
  onMount(() => { void load(); });
</script>

<section class="student-workflow" aria-busy={loading || busy}>
  <h1>Onde você parou de estudar?</h1>
  <p class="muted">Escolha o último ano que frequentou. O polo usará essa informação na matrícula.</p>
  {#if loading}<p role="status">Consultando escolaridade…</p>
  {:else}
    <form class="panel" onsubmit={save}>
      <fieldset class="stack" disabled={busy}><legend>Nível de ensino</legend><div class="choices">
        <button type="button" class="choice" aria-pressed={level === "fundamental"} onclick={() => { level = "fundamental"; grade = null; completed = null; }}>Ensino Fundamental</button>
        <button type="button" class="choice" aria-pressed={level === "medio"} onclick={() => { level = "medio"; grade = null; completed = null; }}>Ensino Médio</button>
      </div></fieldset>
      {#if level}<fieldset class="stack" disabled={busy}><legend>Qual foi o último ano que frequentou?</legend><div class="choices">
        {#each Array.from({ length: level === "fundamental" ? 9 : 3 }, (_, index) => index + 1) as year}<button type="button" class="choice" aria-pressed={grade === year} onclick={() => { grade = year; completed = null; }}>{year}º ano</button>{/each}
      </div></fieldset>{/if}
      {#if grade !== null}<fieldset class="stack" disabled={busy}><legend>Você terminou esse ano?</legend><div class="choices">
        <button type="button" class="choice" aria-pressed={completed === true} onclick={() => { completed = true; }}>Terminei o ano</button>
        <button type="button" class="choice" aria-pressed={completed === false} onclick={() => { completed = false; }}>Não terminei o ano</button>
      </div></fieldset>{/if}
      {#if completed !== null}
        <label>Estado da escola<select value={state} onchange={(event) => void loadCities((event.currentTarget as HTMLSelectElement).value)} required disabled={busy || !ufs.length}><option value="">Selecione o estado</option>{#each ufs as uf}<option value={uf.sigla}>{uf.nome} ({uf.sigla})</option>{/each}</select></label>
        <label>Cidade da escola<input list="education-cities" bind:value={city} required maxlength="120" autocomplete="off" disabled={busy || !state || locationLoading} placeholder={locationLoading ? "Carregando cidades…" : "Digite para buscar"} /><datalist id="education-cities">{#each cities as municipality}<option value={municipality}></option>{/each}</datalist></label>
        {#if locationError}<p class="error" role="alert">{locationError}</p>{/if}
        {#if city && !cityValid}<p class="warning" role="status">Escolha uma cidade da lista do IBGE.</p>{/if}
        <label>Nome da escola (opcional)<input bind:value={lastSchool} maxlength="200" autocomplete="off" disabled={busy} /></label>
        {#if invalidCompletedMax}<p class="warning" role="alert">Você informou o 3º ano do Ensino Médio concluído. Esta matrícula não é o fluxo correto para quem já concluiu o Ensino Médio. Fale com o polo.</p>{/if}
        <button type="submit" class="btn" disabled={busy || !state || !cityValid || invalidCompletedMax}>{busy ? "Salvando…" : "Salvar escolaridade"}</button>
      {/if}
    </form>
  {/if}
  {#if error}<p class="error" role="alert">{error}</p><button type="button" class="secondary" onclick={load} disabled={busy}>Consultar etapa novamente</button>{/if}
</section>
<EducationDeclarationModal role="student" open={showDeclaration} onConfirm={confirmDeclaration} />
