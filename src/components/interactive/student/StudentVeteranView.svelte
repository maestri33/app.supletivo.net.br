<script lang="ts">
  import { onMount } from "svelte";
  import {
    fetchContact,
    getErrorMessage,
    getStudentDiploma,
    getStudentExams,
    getStudentMe,
    type StudentDiplomaResponse,
    type StudentExamsResponse,
    type StudentMeV2,
  } from "@/lib/api";
  import { resolveSupportHref, type InstitutionalContact } from "@/lib/config";
  import { openAuthenticatedApiFile } from "@/lib/private-media";
  import { dateLabel, dateTimeLabel, STUDENT_STATUS_LABELS } from "@/components/interactive/student/workflow";
  import { Alert, Badge, Card } from "@/components/ui";

  interface Props {
    view?: "dashboard" | "records" | "assessments" | "diploma";
  }

  let { view = "dashboard" }: Props = $props();

  let loading = $state(true);
  let error = $state("");

  let me = $state<StudentMeV2 | null>(null);
  let diploma = $state<StudentDiplomaResponse | null>(null);
  let examsData = $state<StudentExamsResponse | null>(null);
  let contact = $state<InstitutionalContact | null>(null);

  const supportHref = $derived(resolveSupportHref(contact));

  onMount(async () => {
    try {
      const [meRes, diplomaRes, examsRes, contactRes] = await Promise.all([
        getStudentMe().catch(() => null),
        getStudentDiploma().catch(() => null),
        getStudentExams().catch(() => null),
        fetchContact().catch(() => null),
      ]);
      me = meRes;
      diploma = diplomaRes;
      examsData = examsRes;
      contact = contactRes;
    } catch (err) {
      error = getErrorMessage(err);
    } finally {
      loading = false;
    }
  });

  async function openProtectedPdf(apiPath: string, filename: string) {
    error = "";
    try {
      await openAuthenticatedApiFile(apiPath, filename);
    } catch (err) {
      error = getErrorMessage(err);
    }
  }

  function downloadDiplomaAsset(type: "diploma" | "transcript") {
    return openProtectedPdf(
      `/api/v1/student/diploma/file?type=${type}`,
      type === "diploma" ? "diploma.pdf" : "historico-escolar.pdf"
    );
  }

  function downloadExamPdf(examId: string, attempt: number) {
    return openProtectedPdf(
      `/api/v1/student/exams/corrected-pdf?exam_id=${encodeURIComponent(examId)}`,
      `prova-corrigida-${attempt}.pdf`
    );
  }
</script>

<section class="mx-auto max-w-3xl px-4 pb-28 pt-6 space-y-5">
  <header class="space-y-2">
    <div class="flex flex-wrap items-center gap-2">
      <Badge variant="success">
        {STUDENT_STATUS_LABELS[diploma?.status ?? me?.role?.status ?? "graduated"] ?? "Concluinte"}
      </Badge>
      {#if diploma?.pickup?.picked_up}
        <Badge variant="info">Diploma retirado</Badge>
      {/if}
    </div>
    <h1 class="text-2xl font-extrabold tracking-tight text-[#0b1220]">
      {#if view === "diploma"}
        Diploma digital e retirada
      {:else if view === "records"}
        Histórico escolar de conclusão
      {:else if view === "assessments"}
        Provas realizadas
      {:else}
        Conclusão do curso — {me?.user?.name || "Aluno concluinte"}
      {/if}
    </h1>

    <nav class="flex flex-wrap gap-2 pt-1 text-xs font-bold">
      <a href="/student/veteran/dashboard" class={`rounded-lg px-3 py-1.5 ${view === "dashboard" ? "bg-[#0b1220] text-white" : "bg-black/5 text-slate-700"}`}>Resumo</a>
      <a href="/student/veteran/diploma" class={`rounded-lg px-3 py-1.5 ${view === "diploma" ? "bg-[#0b1220] text-white" : "bg-black/5 text-slate-700"}`}>Diploma</a>
      <a href="/student/veteran/records" class={`rounded-lg px-3 py-1.5 ${view === "records" ? "bg-[#0b1220] text-white" : "bg-black/5 text-slate-700"}`}>Histórico</a>
      <a href="/student/veteran/assessments" class={`rounded-lg px-3 py-1.5 ${view === "assessments" ? "bg-[#0b1220] text-white" : "bg-black/5 text-slate-700"}`}>Provas</a>
      <a href="/student/veteran/finance" class="rounded-lg bg-black/5 px-3 py-1.5 text-slate-700">Financeiro</a>
    </nav>
  </header>

  {#if loading}
    <Card class="p-6"><p class="text-sm text-slate-500">Carregando documentação de conclusão...</p></Card>
  {:else}
    {#if error}
      <Alert variant="error" title="Erro">{error}</Alert>
    {/if}

    {#if view === "assessments"}
      <Card class="p-5 sm:p-6 space-y-3">
        <h2 class="text-base font-bold text-[#0b1220]">Avaliações concluídas</h2>
        {#if !examsData?.exams?.length}
          <p class="text-sm text-slate-500">Nenhum registro de prova encontrado.</p>
        {:else}
          <div class="space-y-3">
            {#each examsData.exams as exam}
              <div class="rounded-xl border border-black/10 p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="text-sm font-bold text-[#0b1220]">{exam.subject}</span>
                    <Badge variant={exam.result === "passed" ? "success" : "error"}>
                      {exam.result === "passed" ? "Aprovado" : "Reprovado"}
                    </Badge>
                  </div>
                  <p class="text-xs text-slate-600 mt-0.5">{dateTimeLabel(exam.scheduled_at)}</p>
                </div>
                {#if exam.corrected_exam_file_key}
                  <button
                    type="button"
                    onclick={() => downloadExamPdf(exam.id, exam.attempt_number)}
                    class="min-h-10 rounded-xl bg-[#002776] px-3.5 text-xs font-bold text-white"
                  >
                    Baixar prova corrigida
                  </button>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </Card>
    {:else}
      <Card class="p-5 sm:p-6 space-y-4">
        <p class="text-sm text-slate-700">
          {diploma?.message || "Acompanhe abaixo o registro e os arquivos do seu diploma e histórico escolar."}
        </p>

        {#if diploma?.registration}
          <dl class="grid gap-3 text-sm sm:grid-cols-2 border-y border-black/10 py-4">
            <div>
              <dt class="text-xs font-bold uppercase text-slate-500">Registro</dt>
              <dd class="font-semibold text-[#0b1220]">{diploma.registration.registration_number || "Em processamento"}</dd>
            </div>
            <div>
              <dt class="text-xs font-bold uppercase text-slate-500">Processo</dt>
              <dd class="font-semibold text-[#0b1220]">{diploma.registration.process_number || "—"}</dd>
            </div>
            <div>
              <dt class="text-xs font-bold uppercase text-slate-500">Diário Oficial</dt>
              <dd class="font-medium text-slate-700">{dateLabel(diploma.registration.gazette_publication_date)}</dd>
            </div>
            <div>
              <dt class="text-xs font-bold uppercase text-slate-500">Emissão</dt>
              <dd class="font-medium text-slate-700">{dateLabel(diploma.registration.issued_at)}</dd>
            </div>
          </dl>
        {/if}

        <div class="flex flex-wrap gap-3">
          {#if diploma?.documents?.diploma_download_url}
            <button
              type="button"
              onclick={() => downloadDiplomaAsset("diploma")}
              class="min-h-11 rounded-xl bg-[#00734d] px-5 text-sm font-bold text-white hover:opacity-95"
            >
              Baixar Diploma (PDF)
            </button>
          {/if}
          {#if diploma?.documents?.transcript_download_url}
            <button
              type="button"
              onclick={() => downloadDiplomaAsset("transcript")}
              class="min-h-11 rounded-xl bg-[#002776] px-5 text-sm font-bold text-white hover:opacity-95"
            >
              Baixar Histórico Escolar (PDF)
            </button>
          {/if}
        </div>

        {#if diploma?.pickup}
          <div class="rounded-xl border border-black/10 bg-[#f6f6f2] p-4 text-xs text-slate-700 space-y-1">
            <p class="font-bold text-[#0b1220]">Entrega presencial — {diploma.pickup.hub_name}</p>
            {#if diploma.pickup.address}<p>{diploma.pickup.address}</p>{/if}
            <p>
              Status da retirada:
              <strong>
                {diploma.pickup.picked_up
                  ? `Retirado em ${dateLabel(diploma.pickup.picked_up_at)}`
                  : "Aguardando retirada ou emissão final"}
              </strong>
            </p>
          </div>
        {/if}
      </Card>
    {/if}

    <div class="text-center text-xs text-slate-500">
      Dúvidas sobre certificação ou entrega?
      <a href={supportHref} class="font-semibold text-[#002776] underline">Falar com atendimento</a>
    </div>
  {/if}
</section>
