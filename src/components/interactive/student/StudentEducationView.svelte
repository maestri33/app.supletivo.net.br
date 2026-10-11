<script lang="ts">
  import { onMount } from "svelte";
  import { getEnrollmentMe, postEnrollmentEducation, getErrorMessage, type EducationLevel } from "@/lib/api";
  import { expectedStatus, followEnrollmentStatus } from "./workflow";
  import "./workflow.css";
  const states = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
  let loading = $state(true), busy = $state(false), error = $state("");
  let level = $state<EducationLevel | null>(null), grade = $state<number | null>(null), completed = $state<boolean | null>(null);
  let state = $state(""), city = $state(""), lastSchool = $state("");
  async function load() {
    loading = true; error = "";
    try {
      const me = await getEnrollmentMe();
      if (followEnrollmentStatus(me.status)) return;
      if (me.status !== "education") { error = "A escolaridade não está disponível nesta etapa da matrícula."; return; }
      level = me.education?.level ?? null; grade = me.education?.grade ?? null; completed = me.education?.completed ?? null;
      state = me.education?.state ?? ""; city = me.education?.city ?? ""; lastSchool = me.education?.last_school ?? "";
    } catch (cause) { error = getErrorMessage(cause); } finally { loading = false; }
  }
  async function save(event: SubmitEvent) {
    event.preventDefault(); if (!level || grade === null || completed === null || !state || !city.trim() || busy) return;
    busy = true; error = "";
    try { const me = await postEnrollmentEducation({ level, grade, completed, state, city: city.trim(), last_school: lastSchool.trim() }); followEnrollmentStatus(me.status); }
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
        <label>Estado da escola<select bind:value={state} required disabled={busy}><option value="">Selecione o estado</option>{#each states as uf}<option value={uf}>{uf}</option>{/each}</select></label>
        <label>Cidade da escola<input bind:value={city} required maxlength="120" autocomplete="off" disabled={busy} /></label>
        <label>Nome da escola (opcional)<input bind:value={lastSchool} maxlength="200" autocomplete="off" disabled={busy} /></label>
        <button type="submit" class="btn" disabled={busy || !state || !city.trim()}>{busy ? "Salvando…" : "Salvar escolaridade"}</button>
      {/if}
    </form>
  {/if}
  {#if error}<p class="error" role="alert">{error}</p><button type="button" class="secondary" onclick={load} disabled={busy}>Consultar etapa novamente</button>{/if}
</section>
