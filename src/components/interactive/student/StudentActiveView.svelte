<script lang="ts">
  import { onMount } from "svelte";
  import {
    fetchContact,
    getErrorMessage,
    getStudentDocuments,
    getStudentExams,
    getStudentMe,
    postStudentBloodType,
    postStudentDocument,
    postStudentExamSchedule,
    type AcademicChecklistItem,
    type BloodType,
    type PostSigaDocType,
    type StudentDocumentItemV2,
    type StudentDocumentsList,
    type StudentExamsResponse,
    type StudentMeV2,
  } from "@/lib/api";
  import { resolveSupportHref, type InstitutionalContact } from "@/lib/config";
  import { compressImage } from "@/lib/image-compression";
  import { openAuthenticatedApiFile, openPrivateMedia } from "@/lib/private-media";
  import { saveSession } from "@/lib/session";
  import {
    dateLabel,
    dateTimeLabel,
    documentFileError,
    safePartnerUrl,
    STUDENT_STATUS_LABELS,
  } from "@/components/interactive/student/workflow";
  import { Alert, Badge, Card } from "@/components/ui";

  interface Props {
    view?: "dashboard" | "access" | "documents" | "assessments";
  }

  let { view = "dashboard" }: Props = $props();

  const BLOOD_TYPES: BloodType[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const EXAM_SUBJECTS = [
    "Prova Geral EJA",
    "Linguagens e Códigos",
    "Matemática",
    "Ciências Humanas",
    "Ciências da Natureza",
    "Redação",
  ];

  let loading = $state(true);
  let busy = $state(false);
  let error = $state("");
  let notice = $state("");

  let me = $state<StudentMeV2 | null>(null);
  let docsList = $state<StudentDocumentsList | null>(null);
  let examsData = $state<StudentExamsResponse | null>(null);
  let contact = $state<InstitutionalContact | null>(null);

  let selectedBloodType = $state<BloodType>("O+");
  let showPassword = $state(false);
  let examSubject = $state<string>("Prova Geral EJA");
  let examDateTime = $state<string>("");

  const supportHref = $derived(resolveSupportHref(contact));
  const sigaSafeUrl = $derived(safePartnerUrl(me?.siga_credentials?.url));
  const canUploadPostSiga = $derived(
    me?.role?.status === "enrolled" || me?.role?.status === "under_review"
  );

  function findDoc(type: PostSigaDocType): StudentDocumentItemV2 | undefined {
    return docsList?.documents?.find((d) => d.document_type === type);
  }

  function checklistFor(type: PostSigaDocType): AcademicChecklistItem | undefined {
    if (!me?.document_progress?.checklist) return undefined;
    const c = me.document_progress.checklist;
    return type === "school_records"
      ? c.school_records ?? c.transcript
      : c.military_certificate ?? c.military_service;
  }

  function docStatusBadge(status: string | null | undefined, exempt = false): {
    label: string;
    variant: "success" | "warning" | "error" | "info" | "default";
  } {
    if (exempt) return { label: "Dispensado", variant: "default" };
    if (status === "approved") return { label: "Aprovado", variant: "success" };
    if (status === "rejected") return { label: "Reprovado", variant: "error" };
    if (status === "pending" || status === "review") return { label: "Em análise", variant: "info" };
    return { label: "Pendente", variant: "warning" };
  }

  async function loadAll() {
    const [meRes, docsRes, examsRes, contactRes] = await Promise.all([
      getStudentMe(),
      getStudentDocuments().catch(() => null),
      getStudentExams().catch(() => null),
      fetchContact().catch(() => null),
    ]);
    me = meRes;
    docsList = docsRes;
    examsData = examsRes;
    contact = contactRes;
    if (meRes.user.blood_type) {
      selectedBloodType = meRes.user.blood_type;
    }
    saveSession({
      role: meRes.role.role,
      status: meRes.role.status,
      substatus: meRes.role.substatus ?? null,
    });
  }

  onMount(async () => {
    try {
      await loadAll();
    } catch (err) {
      error = getErrorMessage(err);
    } finally {
      loading = false;
    }
  });

  async function handleSaveBloodType(event: Event) {
    event.preventDefault();
    busy = true;
    error = "";
    notice = "";
    try {
      await postStudentBloodType(selectedBloodType);
      notice = `Tipo sanguíneo ${selectedBloodType} salvo com sucesso.`;
      await loadAll();
    } catch (err) {
      error = getErrorMessage(err);
    } finally {
      busy = false;
    }
  }

  async function handleUploadAcademicDoc(type: PostSigaDocType, event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const rawFile = input.files?.[0];
    input.value = "";
    if (!rawFile) return;

    const validationError = documentFileError(rawFile);
    if (validationError) {
      error = validationError;
      return;
    }

    busy = true;
    error = "";
    notice = "";
    try {
      const isPdf = rawFile.type === "application/pdf" || rawFile.name.toLowerCase().endsWith(".pdf");
      const fileToSend = isPdf ? rawFile : await compressImage(rawFile, { maxSizeMB: 2 });
      const postCompressErr = documentFileError(fileToSend);
      if (postCompressErr) throw new Error(postCompressErr);

      await postStudentDocument(type, fileToSend);
      notice =
        type === "school_records"
          ? "Histórico escolar enviado para conferência da secretaria."
          : "Comprovante militar enviado para conferência da secretaria.";
      await loadAll();
    } catch (err) {
      error = getErrorMessage(err);
    } finally {
      busy = false;
    }
  }

  async function handleScheduleExam(event: Event) {
    event.preventDefault();
    if (!examSubject.trim() || !examDateTime) {
      error = "Escolha a matéria e a data/hora desejada para a prova.";
      return;
    }
    busy = true;
    error = "";
    notice = "";
    try {
      const iso = new Date(examDateTime).toISOString();
      await postStudentExamSchedule({
        subject: examSubject.trim(),
        scheduled_at: iso,
      });
      notice = "Agendamento registrado! Você pode acompanhar o resultado abaixo.";
      examDateTime = "";
      await loadAll();
    } catch (err) {
      error = getErrorMessage(err);
    } finally {
      busy = false;
    }
  }

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      notice = `${label} copiado para a área de transferência.`;
    } catch {
      error = `Não foi possível copiar o ${label.toLowerCase()}.`;
    }
  }

  async function openProtectedResource(opener: () => Promise<void>) {
    error = "";
    try {
      await opener();
    } catch (err) {
      error = getErrorMessage(err);
    }
  }

  function handleDownloadExamPdf(examId: string, attempt: number) {
    return openProtectedResource(() =>
      openAuthenticatedApiFile(
        `/api/v1/student/exams/corrected-pdf?exam_id=${encodeURIComponent(examId)}`,
        `prova-corrigida-${attempt}.pdf`
      )
    );
  }

  function handleOpenDocFile(fileKey: string) {
    return openProtectedResource(() => openPrivateMedia(fileKey));
  }
</script>

<section class="mx-auto max-w-3xl px-4 pb-28 pt-6 space-y-5">
  <header class="space-y-2">
    <div class="flex flex-wrap items-center gap-2">
      <Badge variant="success">
        {STUDENT_STATUS_LABELS[me?.role?.status ?? "enrolled"] ?? "Aluno matriculado"}
      </Badge>
      {#if me?.role?.substatus}
        <Badge variant="info">{STUDENT_STATUS_LABELS[me.role.substatus] ?? me.role.substatus}</Badge>
      {/if}
    </div>
    <h1 class="text-2xl font-extrabold tracking-tight text-[#0b1220]">
      {#if view === "access"}
        Acesso ao portal SIGA
      {:else if view === "documents"}
        Documentos acadêmicos e tipo sanguíneo
      {:else if view === "assessments"}
        Provas e avaliações
      {:else}
        Painel do aluno — {me?.user?.name || "Supletivo Brasil"}
      {/if}
    </h1>

    <nav class="flex flex-wrap gap-2 pt-1 text-xs font-bold">
      <a href="/student/active/dashboard" class={`rounded-lg px-3 py-1.5 ${view === "dashboard" ? "bg-[#0b1220] text-white" : "bg-black/5 text-slate-700"}`}>Resumo</a>
      <a href="/student/active/access" class={`rounded-lg px-3 py-1.5 ${view === "access" ? "bg-[#0b1220] text-white" : "bg-black/5 text-slate-700"}`}>Acesso SIGA</a>
      <a href="/student/active/documents" class={`rounded-lg px-3 py-1.5 ${view === "documents" ? "bg-[#0b1220] text-white" : "bg-black/5 text-slate-700"}`}>Documentos</a>
      <a href="/student/active/assessments" class={`rounded-lg px-3 py-1.5 ${view === "assessments" ? "bg-[#0b1220] text-white" : "bg-black/5 text-slate-700"}`}>Provas</a>
      <a href="/student/active/finance" class="rounded-lg bg-black/5 px-3 py-1.5 text-slate-700">Financeiro</a>
    </nav>
  </header>

  {#if loading}
    <Card class="p-6"><p class="text-sm text-slate-500">Carregando dados do aluno...</p></Card>
  {:else}
    {#if error}
      <Alert variant="error" title="Atenção">{error}</Alert>
    {/if}
    {#if notice}
      <Alert variant="success">{notice}</Alert>
    {/if}

    {#if view === "dashboard"}
      <div class="grid gap-4 sm:grid-cols-2">
        <Card class="p-5 space-y-2">
          <p class="text-xs font-bold uppercase text-slate-500">Portal de estudos (SIGA)</p>
          <p class="text-base font-bold text-[#0b1220]">
            {me?.siga_credentials ? `Usuário: ${me.siga_credentials.username}` : "Credenciais em emissão"}
          </p>
          <a href="/student/active/access" class="inline-block text-xs font-bold text-[#002776] underline">
            Ver acesso ao portal
          </a>
        </Card>

        <Card class="p-5 space-y-2">
          <p class="text-xs font-bold uppercase text-slate-500">Documentos pós-SIGA</p>
          <p class="text-base font-bold text-[#0b1220]">
            {me?.document_progress?.academic_documents_ready
              ? "Documentação completa"
              : "Envios pendentes"}
          </p>
          <a href="/student/active/documents" class="inline-block text-xs font-bold text-[#002776] underline">
            Gerenciar documentos
          </a>
        </Card>

        <Card class="p-5 space-y-2">
          <p class="text-xs font-bold uppercase text-slate-500">Avaliações</p>
          <p class="text-base font-bold text-[#0b1220]">
            {examsData?.eligibility?.exam_can_schedule
              ? "Liberado para agendar prova"
              : `Previsão: ${examsData?.eligibility?.exam_available_at ? dateLabel(examsData.eligibility.exam_available_at) : "Em breve"}`}
          </p>
          <a href="/student/active/assessments" class="inline-block text-xs font-bold text-[#002776] underline">
            Ir para provas
          </a>
        </Card>

        <Card class="p-5 space-y-2">
          <p class="text-xs font-bold uppercase text-slate-500">Tipo sanguíneo</p>
          <p class="text-base font-bold text-[#0b1220]">
            {me?.user?.blood_type ? me.user.blood_type : "Ainda não informado"}
          </p>
          <a href="/student/active/documents" class="inline-block text-xs font-bold text-[#002776] underline">
            Atualizar no perfil
          </a>
        </Card>
      </div>
    {:else if view === "access"}
      <Card class="p-5 sm:p-6 space-y-4">
        {#if me?.siga_credentials}
          <div class="space-y-3">
            <div class="rounded-xl border border-black/10 bg-[#f6f6f2] p-3.5 flex items-center justify-between gap-2">
              <div>
                <p class="text-xs font-bold uppercase text-slate-500">Login SIGA</p>
                <p class="font-mono text-sm font-bold text-[#0b1220]">{me.siga_credentials.username}</p>
              </div>
              <button
                type="button"
                onclick={() => me?.siga_credentials && copyText(me.siga_credentials.username, "Login")}
                class="min-h-9 rounded-lg border border-black/15 px-3 text-xs font-bold text-[#0b1220]"
              >
                Copiar
              </button>
            </div>

            {#if me.siga_credentials.password}
              <div class="rounded-xl border border-black/10 bg-[#f6f6f2] p-3.5 flex items-center justify-between gap-2">
                <div>
                  <p class="text-xs font-bold uppercase text-slate-500">Senha inicial</p>
                  <p class="font-mono text-sm font-bold text-[#0b1220]">
                    {showPassword ? me.siga_credentials.password : "••••••••"}
                  </p>
                </div>
                <div class="flex gap-2">
                  <button
                    type="button"
                    onclick={() => { showPassword = !showPassword; }}
                    class="min-h-9 rounded-lg border border-black/15 px-3 text-xs font-bold text-[#0b1220]"
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                  <button
                    type="button"
                    onclick={() => me?.siga_credentials?.password && copyText(me.siga_credentials.password, "Senha")}
                    class="min-h-9 rounded-lg border border-black/15 px-3 text-xs font-bold text-[#0b1220]"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            {/if}

            {#if sigaSafeUrl}
              <a
                href={sigaSafeUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="min-h-12 inline-flex w-full items-center justify-center rounded-xl bg-[#00734d] px-5 text-sm font-extrabold text-white hover:opacity-95"
              >
                Acessar portal de estudos (SIGA)
              </a>
            {/if}
          </div>
        {:else}
          <Alert variant="info" title="Credenciais em preparação">
            Assim que a secretaria emitir seu login do SIGA, ele aparecerá automaticamente aqui.
          </Alert>
        {/if}
      </Card>
    {:else if view === "documents"}
      <Card class="p-5 sm:p-6 space-y-4">
        <h2 class="text-base font-bold text-[#0b1220]">Tipo sanguíneo (obrigatório para histórico/diploma)</h2>
        <form onsubmit={handleSaveBloodType} class="flex flex-wrap items-center gap-3">
          <select
            bind:value={selectedBloodType}
            disabled={busy}
            class="min-h-11 rounded-xl border border-black/15 bg-white px-3.5 text-sm font-bold text-[#0b1220]"
          >
            {#each BLOOD_TYPES as bt}
              <option value={bt}>{bt}</option>
            {/each}
          </select>
          <button
            type="submit"
            disabled={busy}
            class="min-h-11 rounded-xl bg-[#0b1220] px-4 text-sm font-bold text-white hover:opacity-95 disabled:opacity-50"
          >
            {busy ? "Salvando..." : "Salvar tipo sanguíneo"}
          </button>
        </form>
      </Card>

      {@const schoolDoc = findDoc("school_records")}
      {@const schoolCk = checklistFor("school_records")}
      {@const schoolStatus = schoolDoc?.status ?? schoolCk?.status}
      {@const schoolBadge = docStatusBadge(schoolStatus, false)}
      <Card class="p-5 sm:p-6 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 class="text-base font-bold text-[#0b1220]">Histórico escolar anterior</h2>
            <p class="text-xs text-slate-600">Aceita foto legível ou PDF de até 10 MB.</p>
          </div>
          <Badge variant={schoolBadge.variant}>{schoolBadge.label}</Badge>
        </div>

        {#if schoolDoc?.rejection_reason ?? schoolCk?.rejection_reason}
          <Alert variant="warning" title="Ajuste solicitado">
            {schoolDoc?.rejection_reason ?? schoolCk?.rejection_reason}
          </Alert>
        {/if}

        <div class="flex flex-wrap items-center gap-2">
          {#if canUploadPostSiga && schoolStatus !== "approved"}
            <label class="min-h-11 inline-flex cursor-pointer items-center rounded-xl bg-[#ffc400] px-4 text-xs font-extrabold text-[#0b1220] hover:brightness-95">
              <span>{schoolDoc ? "Reenviar histórico escolar" : "Enviar histórico escolar"}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onchange={(e) => handleUploadAcademicDoc("school_records", e)}
                disabled={busy}
                class="sr-only"
              />
            </label>
          {/if}
          {#if schoolDoc?.file_key}
            <button
              type="button"
              onclick={() => schoolDoc.file_key && handleOpenDocFile(schoolDoc.file_key)}
              class="min-h-11 rounded-xl border border-black/15 px-3.5 text-xs font-bold text-[#002776]"
            >
              Visualizar arquivo enviado
            </button>
          {/if}
        </div>
      </Card>

      {@const milDoc = findDoc("military_certificate")}
      {@const milCk = checklistFor("military_certificate")}
      {@const milExempt = Boolean(me?.document_progress?.military_exempt || milCk?.exempt)}
      {@const milStatus = milDoc?.status ?? milCk?.status}
      {@const milBadge = docStatusBadge(milStatus, milExempt)}
      <Card class="p-5 sm:p-6 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 class="text-base font-bold text-[#0b1220]">Certificado militar / Reservista</h2>
            <p class="text-xs text-slate-600">
              {milExempt
                ? "Dispensado para o seu perfil."
                : "Obrigatório para estudantes do sexo masculino maiores de 18 anos (foto ou PDF até 10 MB)."}
            </p>
          </div>
          <Badge variant={milBadge.variant}>{milBadge.label}</Badge>
        </div>

        {#if !milExempt}
          {#if milDoc?.rejection_reason ?? milCk?.rejection_reason}
            <Alert variant="warning" title="Ajuste solicitado">
              {milDoc?.rejection_reason ?? milCk?.rejection_reason}
            </Alert>
          {/if}

          <div class="flex flex-wrap items-center gap-2">
            {#if canUploadPostSiga && milStatus !== "approved"}
              <label class="min-h-11 inline-flex cursor-pointer items-center rounded-xl bg-[#ffc400] px-4 text-xs font-extrabold text-[#0b1220] hover:brightness-95">
                <span>{milDoc ? "Reenviar reservista" : "Enviar reservista"}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onchange={(e) => handleUploadAcademicDoc("military_certificate", e)}
                  disabled={busy}
                  class="sr-only"
                />
              </label>
            {/if}
            {#if milDoc?.file_key}
              <button
                type="button"
                onclick={() => milDoc.file_key && handleOpenDocFile(milDoc.file_key)}
                class="min-h-11 rounded-xl border border-black/15 px-3.5 text-xs font-bold text-[#002776]"
              >
                Visualizar arquivo enviado
              </button>
            {/if}
          </div>
        {/if}
      </Card>
    {:else if view === "assessments"}
      <Card class="p-5 sm:p-6 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 class="text-base font-bold text-[#0b1220]">Agendamento de prova presencial</h2>
          <Badge variant={examsData?.eligibility?.exam_can_schedule ? "success" : "warning"}>
            {examsData?.eligibility?.exam_can_schedule ? "Elegível" : "Aguardando liberação"}
          </Badge>
        </div>

        {#if examsData?.eligibility?.exam_can_schedule}
          <form onsubmit={handleScheduleExam} class="grid gap-3 sm:grid-cols-3 items-end">
            <div>
              <label for="exam-subject" class="mb-1 block text-xs font-bold text-slate-600">Matéria</label>
              <select
                id="exam-subject"
                bind:value={examSubject}
                class="min-h-11 w-full rounded-xl border border-black/15 bg-white px-3 text-sm"
              >
                {#each EXAM_SUBJECTS as subj}
                  <option value={subj}>{subj}</option>
                {/each}
              </select>
            </div>
            <div>
              <label for="exam-dt" class="mb-1 block text-xs font-bold text-slate-600">Data e hora</label>
              <input
                id="exam-dt"
                type="datetime-local"
                bind:value={examDateTime}
                required
                class="min-h-11 w-full rounded-xl border border-black/15 bg-white px-3 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              class="min-h-11 rounded-xl bg-[#00734d] px-4 text-sm font-bold text-white hover:opacity-95 disabled:opacity-50"
            >
              {busy ? "Agendando..." : "Agendar prova"}
            </button>
          </form>
        {:else}
          <p class="text-sm text-slate-600">
            {examsData?.eligibility?.exam_block_reason ||
              `Agendamento previsto a partir de ${
                examsData?.eligibility?.exam_available_at
                  ? dateLabel(examsData.eligibility.exam_available_at)
                  : "liberação acadêmica"
              }.`}
          </p>
        {/if}
      </Card>

      <Card class="p-5 sm:p-6 space-y-3">
        <h2 class="text-base font-bold text-[#0b1220]">Histórico de tentativas e correções</h2>
        {#if !examsData?.exams?.length}
          <p class="text-sm text-slate-500">Nenhuma prova agendada até o momento.</p>
        {:else}
          <div class="space-y-3">
            {#each examsData.exams as exam}
              <div class="rounded-xl border border-black/10 p-4 flex flex-wrap items-center justify-between gap-3">
                <div class="space-y-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="text-sm font-bold text-[#0b1220]">{exam.subject}</span>
                    <Badge variant="default">Tentativa #{exam.attempt_number}</Badge>
                    <Badge variant={exam.result === "passed" ? "success" : exam.result === "failed" ? "error" : "info"}>
                      {exam.result === "passed" ? "Aprovado" : exam.result === "failed" ? "Reprovado" : "Agendada"}
                    </Badge>
                  </div>
                  <p class="text-xs text-slate-600">Data: {dateTimeLabel(exam.scheduled_at)}</p>
                  {#if exam.notes}
                    <p class="text-xs text-slate-700">Observações: {exam.notes}</p>
                  {/if}
                </div>

                {#if exam.corrected_exam_file_key}
                  <button
                    type="button"
                    onclick={() => handleDownloadExamPdf(exam.id, exam.attempt_number)}
                    class="min-h-10 rounded-xl bg-[#002776] px-3.5 text-xs font-bold text-white hover:opacity-95"
                  >
                    Baixar prova corrigida (PDF)
                  </button>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </Card>
    {/if}

    <div class="text-center text-xs text-slate-500">
      Precisa de atendimento da secretaria?
      <a href={supportHref} class="font-semibold text-[#002776] underline">Falar por e-mail</a>
    </div>
  {/if}
</section>
