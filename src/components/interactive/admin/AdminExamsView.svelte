<script lang="ts">
  import { onMount } from "svelte";
  import {
    getAdminScheduledExams,
    getErrorMessage,
    gradeAdminExam,
    uploadAdminCorrectedExamPdf,
    type AdminScheduledExamItem,
  } from "@/lib/api";
  import { ADMIN_PDF_MAX_UPLOAD_BYTES, dateTimeLabel, documentFileError } from "@/components/interactive/student/workflow";
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

    const validationError = documentFileError(file, ADMIN_PDF_MAX_UPLOAD_BYTES);
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
    <h1 class="text-2xl font-extrabold tracking-tight text-white">
      Provas e Lançamento de Correções
    </h1>
    <AdminNav active="provas" />
  </header>

  {#if error}
    <Alert variant="danger" title="Erro">{error}</Alert>
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
        <label for="exam-status-filter" class="mb-1 block text-xs font-bold text-white/75">Status</label>
        <select id="exam-status-filter" bind:value={statusFilter} class="min-h-10 rounded-xl border border-white/20 bg-[#121d33] px-3 text-xs text-white [color-scheme:dark] focus:border-[var(--yellow)] focus:outline-none">
          <option value="" class="bg-[#121d33] text-white">Todos</option>
          <option value="pending" class="bg-[#121d33] text-white">Pendentes</option>
          <option value="passed" class="bg-[#121d33] text-white">Aprovados</option>
          <option value="failed" class="bg-[#121d33] text-white">Reprovados</option>
        </select>
      </div>
      <div>
        <label for="exam-date-filter" class="mb-1 block text-xs font-bold text-white/75">Data</label>
        <input id="exam-date-filter" type="date" bind:value={dateFilter} class="min-h-10 rounded-xl border border-white/20 bg-white/5 px-3 text-xs text-white [color-scheme:dark] focus:border-[var(--yellow)] focus:outline-none" />
      </div>
      <button type="submit" disabled={busy} class="min-h-10 rounded-xl bg-[#ffc400] px-4 text-xs font-extrabold text-[#0b1220] hover:brightness-95 disabled:opacity-50">
        Filtrar
      </button>
    </form>
  </Card>

  {#if loading}
    <Card class="p-6"><p class="text-sm text-white/75">Carregando agenda de provas...</p></Card>
  {:else if !exams.length}
    <Card class="p-6"><p class="text-sm text-white/60">Nenhuma prova encontrada para os filtros.</p></Card>
  {:else}
    <div class="space-y-4">
      {#each exams as exam}
        <Card class="p-4 sm:p-5 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 class="text-sm font-bold text-white">
                {exam.student_name} — {exam.subject} (Tentativa #{exam.attempt_number})
              </h2>
              <p class="text-xs text-white/75">
                CPF {exam.cpf} • {exam.phone} • Agendada para {dateTimeLabel(exam.scheduled_at)}
              </p>
            </div>
            <Badge variant={exam.result === "passed" ? "success" : exam.result === "failed" ? "danger" : "warning"}>
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
                class="min-h-10 w-full rounded-xl border border-white/20 bg-white/5 px-3 text-xs text-white placeholder-white/40 focus:border-[var(--yellow)] focus:outline-none"
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
                  class="min-h-9 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 text-xs font-bold text-rose-300 hover:bg-rose-500/20 disabled:opacity-50"
                >
                  Reprovar tentativa
                </button>
                <label class="min-h-9 inline-flex cursor-pointer items-center rounded-lg border border-sky-400/40 bg-sky-500/10 px-3 text-xs font-bold text-sky-200 hover:bg-sky-500/20">
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
                <p class="text-xs text-white/50">PDF corrigido ainda não anexado.</p>
              {/if}
            </div>
          </div>
        </Card>
      {/each}
    </div>
  {/if}
</section>
