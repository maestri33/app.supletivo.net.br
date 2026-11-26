<script lang="ts">
  import { onMount } from "svelte";
  import {
    getEnrollmentEducation,
    getEnrollmentStatus,
    getErrorMessage,
    postEnrollmentEducation,
    type EducationLevel,
    type EnrollmentStatusResponse,
  } from "@/lib/api";
  import { fetchCities, fetchUfs, type UfOption } from "@/lib/ibge";
  import EducationDeclarationModal from "@/components/interactive/EducationDeclarationModal.svelte";
  import { enrollmentPath } from "@/components/interactive/student/workflow";
  import { Alert, Badge, Card } from "@/components/ui";

  let loading = $state(true);
  let busy = $state(false);
  let error = $state("");
  let notice = $state("");

  let statusInfo = $state<EnrollmentStatusResponse | null>(null);
  let level = $state<EducationLevel>("medio");
  let grade = $state<number>(2);
  let completed = $state<boolean>(false);
  let lastSchool = $state("");
  let stateUf = $state("");
  let city = $state("");
  let lastYearWhen = $state("");
  let declarationAccepted = $state(false);
  let confirmOpen = $state(false);

  let ufs = $state<UfOption[]>([]);
  let cities = $state<string[]>([]);
  let loadingCities = $state(false);

  const gradeOptions = $derived(level === "fundamental" ? [5, 6, 7, 8, 9] : [1, 2, 3]);
  const summaryText = $derived(
    `${level === "fundamental" ? "Ensino Fundamental" : "Ensino Médio"} — ${grade}º ano (${
      completed ? "Concluído" : "Incompleto / em curso"
    }) — ${city || "Cidade"}/${stateUf || "UF"}${lastSchool.trim() ? ` — Escola: ${lastSchool.trim()}` : ""}`
  );

  async function loadCitiesForUf(uf: string, preserveCity = false) {
    if (!uf) {
      cities = [];
      if (!preserveCity) city = "";
      return;
    }
    loadingCities = true;
    try {
      cities = await fetchCities(uf);
      if (!preserveCity && !cities.includes(city)) {
        city = "";
      }
    } catch {
      cities = [];
    } finally {
      loadingCities = false;
    }
  }

  onMount(async () => {
    try {
      const [st, edu, ufList] = await Promise.all([
        getEnrollmentStatus().catch(() => null),
        getEnrollmentEducation().catch(() => null),
        fetchUfs().catch(() => [] as UfOption[]),
      ]);
      statusInfo = st;
      ufs = ufList;

      if (edu?.submitted && edu.data) {
        if (edu.data.level === "fundamental" || edu.data.level === "medio") {
          level = edu.data.level;
        }
        const parsedGrade = Number(edu.data.grade);
        if (Number.isFinite(parsedGrade) && parsedGrade > 0) {
          grade = parsedGrade;
        }
        completed = Boolean(edu.data.completed);
        lastSchool = typeof edu.data.last_school === "string" ? edu.data.last_school : "";
        stateUf = typeof edu.data.state === "string" ? edu.data.state : "";
        city = typeof edu.data.city === "string" ? edu.data.city : "";
        lastYearWhen = edu.data.last_year_when != null ? String(edu.data.last_year_when) : "";
        declarationAccepted = true;
        if (stateUf) {
          await loadCitiesForUf(stateUf, true);
        }
      }
    } catch (err) {
      error = getErrorMessage(err);
    } finally {
      loading = false;
    }
  });

  function handleLevelChange(next: EducationLevel) {
    level = next;
    if (next === "fundamental" && grade < 5) grade = 9;
    if (next === "medio" && grade > 3) grade = 1;
  }

  function validateForm(): string | null {
    if (!stateUf.trim()) return "Selecione o estado (UF) da última escola.";
    if (!city.trim()) return "Informe a cidade da última escola.";
    if (!declarationAccepted) return "Marque o aceite da declaração de escolaridade.";
    return null;
  }

  function handlePreSubmit(event: Event) {
    event.preventDefault();
    const errMsg = validateForm();
    if (errMsg) {
      error = errMsg;
      return;
    }
    error = "";
    confirmOpen = true;
  }

  async function submitConfirmed() {
    busy = true;
    error = "";
    try {
      const cleanSchool = lastSchool.trim();
      const cleanYear = lastYearWhen.trim();
      await postEnrollmentEducation({
        level,
        grade: Number(grade),
        completed,
        ...(cleanSchool ? { last_school: cleanSchool } : {}),
        city: city.trim(),
        state: stateUf.trim().toUpperCase(),
        ...(cleanYear ? { last_year_when: cleanYear } : {}),
        declaration_accepted: true,
      });

      confirmOpen = false;
      notice = "Escolaridade registrada! Avançando para contrato e selfie...";
      const st = await getEnrollmentStatus().catch(() => null);
      const nextUrl = enrollmentPath(st?.substatus ?? st?.step) ?? "/student/enrollment/selfie";
      window.location.href =
        nextUrl === "/student/enrollment/education" ? "/student/enrollment/selfie" : nextUrl;
    } catch (err) {
      error = getErrorMessage(err);
      confirmOpen = false;
    } finally {
      busy = false;
    }
  }
</script>

<section class="mx-auto max-w-2xl px-4 pb-28 pt-6 space-y-5">
  <header class="space-y-2">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <Badge variant="info">Documento 3 de 5 — Escolaridade</Badge>
      <a href="/student/enrollment" class="text-xs font-bold text-[#002776] underline">
        Voltar ao checklist
      </a>
    </div>
    <h1 class="text-2xl font-extrabold tracking-tight text-[#0b1220]">
      Escolaridade anterior
    </h1>
    <p class="text-sm text-slate-600">
      Informe qual foi o último nível e série cursados para prepararmos seu plano de estudos.
    </p>
  </header>

  {#if loading}
    <Card class="p-6"><p class="text-sm text-slate-500">Carregando formulário...</p></Card>
  {:else}
    {#if error}
      <Alert variant="error" title="Corrija antes de continuar">{error}</Alert>
    {/if}
    {#if notice}
      <Alert variant="success">{notice}</Alert>
    {/if}
    {#if statusInfo?.checklist?.education_level?.rejection_reason}
      <Alert variant="warning" title="Observação da secretaria">
        {statusInfo.checklist.education_level.rejection_reason}
      </Alert>
    {/if}

    <Card class="p-5 sm:p-6">
      <form class="space-y-4" onsubmit={handlePreSubmit}>
        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <label for="edu-level" class="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">
              Último nível cursado
            </label>
            <select
              id="edu-level"
              value={level}
              onchange={(e) => handleLevelChange((e.currentTarget as HTMLSelectElement).value as EducationLevel)}
              class="min-h-11 w-full rounded-xl border border-black/15 bg-white px-3.5 text-sm text-[#0b1220]"
            >
              <option value="fundamental">Ensino Fundamental</option>
              <option value="medio">Ensino Médio</option>
            </select>
          </div>

          <div>
            <label for="edu-grade" class="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">
              Última série / ano
            </label>
            <select
              id="edu-grade"
              bind:value={grade}
              class="min-h-11 w-full rounded-xl border border-black/15 bg-white px-3.5 text-sm text-[#0b1220]"
            >
              {#each gradeOptions as g}
                <option value={g}>{g}º ano</option>
              {/each}
            </select>
          </div>
        </div>

        <label class="flex items-center gap-3 rounded-xl border border-black/10 bg-[#f6f6f2] p-3 text-sm text-[#0b1220]">
          <input type="checkbox" bind:checked={completed} class="h-4 w-4 accent-[#00734d]" />
          <span>Concluí integralmente essa série/etapa acima</span>
        </label>

        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <label for="edu-uf" class="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">
              Estado (UF) da escola
            </label>
            {#if ufs.length > 0}
              <select
                id="edu-uf"
                value={stateUf}
                onchange={(e) => {
                  stateUf = (e.currentTarget as HTMLSelectElement).value;
                  void loadCitiesForUf(stateUf, false);
                }}
                required
                class="min-h-11 w-full rounded-xl border border-black/15 bg-white px-3.5 text-sm text-[#0b1220]"
              >
                <option value="">Selecione...</option>
                {#each ufs as uf}
                  <option value={uf.sigla}>{uf.sigla} — {uf.nome}</option>
                {/each}
              </select>
            {:else}
              <input
                id="edu-uf"
                type="text"
                maxlength="2"
                bind:value={stateUf}
                placeholder="PR"
                required
                class="min-h-11 w-full rounded-xl border border-black/15 bg-white px-3.5 text-sm uppercase text-[#0b1220]"
              />
            {/if}
          </div>

          <div>
            <label for="edu-city" class="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">
              Cidade da escola
            </label>
            {#if cities.length > 0}
              <select
                id="edu-city"
                bind:value={city}
                disabled={loadingCities}
                required
                class="min-h-11 w-full rounded-xl border border-black/15 bg-white px-3.5 text-sm text-[#0b1220]"
              >
                <option value="">Selecione a cidade...</option>
                {#each cities as c}
                  <option value={c}>{c}</option>
                {/each}
              </select>
            {:else}
              <input
                id="edu-city"
                type="text"
                bind:value={city}
                placeholder={loadingCities ? "Carregando cidades..." : "Nome da cidade"}
                required
                class="min-h-11 w-full rounded-xl border border-black/15 bg-white px-3.5 text-sm text-[#0b1220]"
              />
            {/if}
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <label for="edu-school" class="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">
              Nome da última escola <span class="font-normal text-slate-400">(opcional)</span>
            </label>
            <input
              id="edu-school"
              type="text"
              bind:value={lastSchool}
              placeholder="Opcional"
              class="min-h-11 w-full rounded-xl border border-black/15 bg-white px-3.5 text-sm text-[#0b1220]"
            />
          </div>

          <div>
            <label for="edu-year" class="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">
              Ano em que estudou <span class="font-normal text-slate-400">(opcional)</span>
            </label>
            <input
              id="edu-year"
              type="text"
              inputmode="numeric"
              maxlength="4"
              bind:value={lastYearWhen}
              placeholder="Ex.: 2018"
              class="min-h-11 w-full rounded-xl border border-black/15 bg-white px-3.5 text-sm text-[#0b1220]"
            />
          </div>
        </div>

        <label class="flex items-start gap-3 rounded-xl border border-[#002776]/15 bg-[#002776]/5 p-3.5 text-xs text-slate-700">
          <input type="checkbox" bind:checked={declarationAccepted} class="mt-0.5 h-4 w-4 accent-[#00734d]" />
          <span>
            Declaro que as informações sobre minha escolaridade anterior são verdadeiras para fins de matrícula na EJA.
          </span>
        </label>

        <button
          type="submit"
          disabled={busy}
          class="min-h-12 w-full rounded-xl bg-[#ffc400] px-5 text-sm font-extrabold text-[#0b1220] hover:brightness-95 disabled:opacity-50"
        >
          {busy ? "Salvando..." : "Salvar escolaridade e continuar"}
        </button>
      </form>
    </Card>
  {/if}

  <EducationDeclarationModal
    open={confirmOpen}
    {busy}
    summary={summaryText}
    onConfirm={submitConfirmed}
    onClose={() => { confirmOpen = false; }}
  />
</section>
