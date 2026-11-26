<script lang="ts">
  import { onMount } from "svelte";
  import {
    getAdminScheduledExams,
    getErrorMessage,
    gradeAdminExam,
    uploadAdminCorrectedExamPdf,
    type AdminScheduledExamItem,
  } from "@/lib/api";
  import { dateTimeLabel, documentFileError } from "@/components/interactive/student/workflow";
  import AdminNav from "@/components/interactive/admin/AdminNav.svelte";
  import PrivateMediaPreview from "@/components/interactive/admin/PrivateMediaPreview.svelte";
  import { Alert, Badge, Card } from "@/components/ui";

  let loading = $state(true);
  let busy = $state(false);
  let error = $state("");
  let notice = $state("");

  let statusFilter = $state("");
  let dateFilter = $state("");
  let exams = $state<AdminScheduledExamItem[]>([]);
  let notesByExam = $state<Record<string, string>>({});

  async function loadExams() {
    const res = await getAdminScheduledExams({
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(dateFilter ? { date: dateFilter } : {}),
    });
    exams = res.exams ?? [];
  }

  onMount(async () => {
    try {
      await loadExams();
    } catch (err) {
      error = getErrorMessage(err);
    } finally {
      loading = false;
    }
  });

  async function runBusy(work: () => Promise<void>) {
    busy = true;
    error = "";
    notice = "";
    try {
      await work();
    } catch (err) {
      error = getErrorMessage(err);
    } finally {
      busy = false;
    }
  }

  function handleGrade(examId: string, passed: boolean) {
    return runBusy(async () => {
      const notes = notesByExam[examId]?.trim();
      const res = await gradeAdminExam(examId, {
        passed,
        ...(notes ? { notes } : {}),
      });
      notice = res.message || `Resultado lançado: ${passed ? "Aprovado" : "Reprovado"}.`;
      await loadExams();
    });
  }

  function handleUploadCorrectedPdf(examId: string, event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    const validationError = documentFileError(file);
    if (validationError) {
      error = validationError;
      return;
    }

    return runBusy(async () => {
      const res = await uploadAdminCorrectedExamPdf(examId, file);
      notice = res.message || "PDF da prova corrigida enviado com sucesso.";
      await loadExams();
    });
  }
</script>

<section class="mx-auto max-w-5xl px-4 pb-28 pt-6 space-y-5">
  <header class="space-y-2">
    <Badge variant="info">Avaliações Presenciais</Badge>
    <h1 class="text-2xl font-extrabold tracking-tight text-[#0b1220]">
      Provas e Lançamento de Correções
    </h1>
    <AdminNav active="provas" />
  </header>

  {#if error}
    <Alert variant="error" title="Erro">{error}</Alert>
  {/if}
  {#if notice}
    <Alert variant="success">{notice}</Alert>
  {/if}

  <Card class="p-4">
    <form
      onsubmit={async (e) => {
        e.preventDefault();
        busy = true;
        try { await loadExams(); } catch (err) { error = getErrorMessage(err); } finally { busy = false; }
      }}
      class="flex flex-wrap items-end gap-3"
    >
      <div>
        <label for="exam-status-filter" class="mb-1 block text-xs font-bold text-slate-600">Status</label>
        <select id="exam-status-filter" bind:value={statusFilter} class="min-h-10 rounded-xl border border-black/15 px-3 text-xs">
          <option value="">Todos</option>
          <option value="pending">Pendentes</option>
          <option value="passed">Aprovados</option>
          <option value="failed">Reprovados</option>
        </select>
      </div>
      <div>
        <label for="exam-date-filter" class="mb-1 block text-xs font-bold text-slate-600">Data</label>
        <input id="exam-date-filter" type="date" bind:value={dateFilter} class="min-h-10 rounded-xl border border-black/15 px-3 text-xs" />
      </div>
      <button type="submit" disabled={busy} class="min-h-10 rounded-xl bg-[#0b1220] px-4 text-xs font-bold text-white">
        Filtrar
      </button>
    </form>
  </Card>

  {#if loading}
    <Card class="p-6"><p class="text-sm text-slate-500">Carregando agenda de provas...</p></Card>
  {:else if !exams.length}
    <Card class="p-6"><p class="text-sm text-slate-500">Nenhuma prova encontrada para os filtros.</p></Card>
  {:else}
    <div class="space-y-4">
      {#each exams as exam}
        <Card class="p-4 sm:p-5 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 class="text-sm font-bold text-[#0b1220]">
                {exam.student_name} — {exam.subject} (Tentativa #{exam.attempt_number})
              </h2>
              <p class="text-xs text-slate-600">
                CPF {exam.cpf} • {exam.phone} • Agendada para {dateTimeLabel(exam.scheduled_at)}
              </p>
            </div>
            <Badge variant={exam.result === "passed" ? "success" : exam.result === "failed" ? "error" : "warning"}>
              {exam.result === "passed" ? "Aprovado" : exam.result === "failed" ? "Reprovado" : "Aguardando nota"}
            </Badge>
          </div>

          <div class="grid gap-3 md:grid-cols-2">
            <div class="space-y-2">
              <input
                type="text"
                placeholder="Observações da correção (opcional)"
                value={notesByExam[exam.id] ?? exam.notes ?? ""}
                oninput={(e) => { notesByExam[exam.id] = (e.currentTarget as HTMLInputElement).value; }}
                class="min-h-10 w-full rounded-xl border border-black/15 px-3 text-xs"
              />
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  onclick={() => handleGrade(exam.id, true)}
                  disabled={busy}
                  class="min-h-9 rounded-lg bg-[#00734d] px-3 text-xs font-bold text-white disabled:opacity-50"
                >
                  Aprovar aluno
                </button>
                <button
                  type="button"
                  onclick={() => handleGrade(exam.id, false)}
                  disabled={busy}
                  class="min-h-9 rounded-lg border border-red-300 px-3 text-xs font-bold text-red-700 disabled:opacity-50"
                >
                  Reprovar tentativa
                </button>
                <label class="min-h-9 inline-flex cursor-pointer items-center rounded-lg border border-[#002776] px-3 text-xs font-bold text-[#002776]">
                  <span>Anexar PDF corrigido</span>
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    onchange={(e) => handleUploadCorrectedPdf(exam.id, e)}
                    disabled={busy}
                    class="sr-only"
                  />
                </label>
              </div>
            </div>

            <div>
              {#if exam.corrected_exam_file_key}
                <PrivateMediaPreview path={exam.corrected_exam_file_key} alt={`Prova corrigida ${exam.student_name}`} compact />
              {:else}
                <p class="text-xs text-slate-400">PDF corrigido ainda não anexado.</p>
              {/if}
            </div>
          </div>
        </Card>
      {/each}
    </div>
  {/if}
</section>
