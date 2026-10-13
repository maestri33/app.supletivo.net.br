<script lang="ts">
  import { onMount } from "svelte";
  import { requestAuth, getEnrollmentMe, getStudentPendencies, postStudentBloodType, postStudentDocument, postStudentExamSchedule, getErrorMessage, type StudentMe, type StudentDocument, type EnrollmentMe, type DocumentType, type BloodType } from "@/lib/api";
  import { openPrivateMedia } from "@/lib/private-media";
  import { safePartnerUrl, STUDENT_STATUS_LABELS, dateLabel, imageError } from "./workflow";
  import "./workflow.css";
  type Exam = { external_id: string; subject: string; scheduled_at: string; result: string; notes?: string | null; attempt_number: number };
  type State = Omit<StudentMe, "documents"> & { documents?: (StudentDocument & { photo?: string | null })[]; exam_available_at?: string | null; exam_can_schedule?: boolean; exams?: Exam[] };
  let { view = "dashboard" }: { view?: "dashboard" | "documents" | "access" | "subjects" | "assessments" } = $props();
  let me = $state<State | null>(null), enrollment = $state<EnrollmentMe | null>(null), loading = $state(true), busy = $state(false), error = $state(""), actionError = $state(""), message = $state("");
  let pendencies = $state<Awaited<ReturnType<typeof getStudentPendencies>>>([]);
  let subject = $state(""), scheduledAt = $state(""), bloodType = $state<BloodType | "">("");
  let showPassword = $state(false), active = true;
  const feeLabels: Record<string, string> = { queued: "Na fila de pagamento", submitted: "Enviado ao provedor", paid: "Pago", failed: "Falha no pagamento", cancelled: "Cancelado", canceled: "Cancelado", pending: "Pendente" };
  function feeAmount(value: string) { const amount = Number(value); return Number.isFinite(amount) ? amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "Valor não informado"; }
  const statusLabel = $derived(STUDENT_STATUS_LABELS[me?.status ?? ""] ?? "Status não informado");
  const partnerUrl = $derived(safePartnerUrl(me?.platform?.url));
  const enrollmentFiles = $derived([
    { label: "RG — frente", path: enrollment?.rg?.front_photo }, { label: "RG — verso", path: enrollment?.rg?.back_photo },
    { label: "RG — arquivo completo", path: enrollment?.rg?.full_photo }, { label: "Comprovante de endereço", path: enrollment?.address_proof?.photo },
    { label: "Foto de assinatura", path: enrollment?.selfie?.photo },
  ].filter(item => item.path));
  const documentTypes: DocumentType[] = ["certificate", "transcript", "address_proof", "id_card", "birth_certificate", "military_service", "blood_type"];
  const documentLabels: Record<DocumentType, string> = { certificate: "certificado de conclusão", transcript: "histórico escolar", address_proof: "comprovante de endereço", id_card: "documento de identidade", birth_certificate: "certidão", military_service: "documento militar", blood_type: "tipo sanguíneo" };
  const validationLabels: Record<string, string> = { pending: "Em análise", approved: "Aprovado", rejected: "Correção solicitada", review: "Aguardando revisão do polo" };
  function failure(cause: unknown) { return cause instanceof Error ? cause.message : getErrorMessage(cause); }
  function documentFor(type: DocumentType) { return me?.documents?.find(doc => doc.doc_type === type); }
  async function load() {
    loading = true; error = "";
    try {
      const data = await requestAuth<State>("/api/v1/clients/student/me"); if (!active) return;
      me = data; bloodType = data.blood_type ?? ""; pendencies = (data.pendencies ?? await getStudentPendencies()).filter(item => item.resolved !== true);
      if (view === "documents") { try { enrollment = await getEnrollmentMe(); } catch (cause) { actionError = `Não foi possível consultar os documentos da matrícula: ${failure(cause)}`; } }
    } catch (cause) { error = failure(cause); } finally { loading = false; }
  }
  async function openFile(path: string | null | undefined) { if (!path) return; actionError = ""; try { await openPrivateMedia(path); } catch (cause) { actionError = failure(cause); } }
  async function upload(type: DocumentType, event: Event) {
    const input = event.currentTarget as HTMLInputElement, file = input.files?.[0]; input.value = "";
    if (!file || busy) return; busy = true; actionError = ""; message = ""; let received = false;
    try {
      const invalid = imageError(file); if (invalid) throw new Error(invalid);
      if (!file.size || file.size > 15 * 1024 * 1024) throw new Error("Envie uma foto legível de até 15 MB.");
      const bitmap = await createImageBitmap(file); bitmap.close();
      await postStudentDocument(type, file); received = true;
      const deadline = Date.now() + 60_000;
      do {
        const data = await requestAuth<State>("/api/v1/clients/student/me"); if (!active) return; me = data;
        const verdict = documentFor(type)?.validation_status;
        if (["approved", "rejected", "review"].includes(verdict ?? "")) break;
        await new Promise(resolve => window.setTimeout(resolve, 2500));
      } while (active && Date.now() < deadline);
      message = documentFor(type)?.validation_status === "pending" ? "Arquivo recebido. A análise continua no servidor; atualize a situação em alguns instantes." : "Arquivo recebido. Confira abaixo o resultado da análise.";
    } catch (cause) { actionError = received ? `Arquivo recebido. A consulta da análise falhou: ${failure(cause)}. Consulte a situação antes de reenviar.` : `Não foi possível enviar o arquivo: ${failure(cause)}`; }
    finally { busy = false; }
  }
  async function saveBloodType() { if (!bloodType || busy) return; busy = true; actionError = ""; try { await postStudentBloodType(bloodType); me = await requestAuth<State>("/api/v1/clients/student/me"); } catch (cause) { actionError = failure(cause); } finally { busy = false; } }
  async function schedule(event: SubmitEvent) { event.preventDefault(); if (!subject.trim() || !scheduledAt || busy || me?.exam_can_schedule !== true) return; busy = true; actionError = ""; try { await postStudentExamSchedule({ subject: subject.trim(), scheduled_at: new Date(scheduledAt).toISOString() }); me = await requestAuth<State>("/api/v1/clients/student/me"); } catch (cause) { actionError = failure(cause); } finally { busy = false; } }
  onMount(() => { void load(); return () => { active = false; }; });
</script>
<section class="student-workflow" aria-busy={loading || busy}>
  {#if loading}<h1>Consultando seu ambiente</h1><p role="status">Buscando os dados do servidor…</p>
  {:else if error}<h1>Não foi possível consultar seu ambiente</h1><p class="error" role="alert">{error}</p><button type="button" class="secondary" onclick={load}>Tentar novamente</button>
  {:else if me}
    {#if actionError}<p class="error" role="alert">{actionError}</p>{/if}
    {#if message}<p role="status">{message}</p>{/if}
    <button class="secondary" disabled={busy || loading} onclick={load}>Atualizar situação</button>
    <div class="stack"><p class="muted">Status da matrícula</p><h1 data-testid="student-status">{statusLabel}</h1></div>
    {#if view === "dashboard"}
      <div class="panel"><h2>Acesso ao parceiro educacional</h2>{#if partnerUrl}<a class="btn" href={partnerUrl} target="_blank" rel="noopener noreferrer" aria-label="Acessar ambiente do parceiro">Acessar ambiente do parceiro</a>{:else}<p class="muted">O polo ainda não informou o ambiente educacional externo.</p>{/if}
        {#if me.platform?.login}<dl><div><dt>Login do parceiro</dt><dd>{me.platform.login}</dd></div>{#if me.platform.notes}<div><dt>Orientações</dt><dd>{me.platform.notes}</dd></div>{/if}</dl><button type="button" class="secondary" aria-label="Mostrar senha" onclick={() => { showPassword = !showPassword; }}>{showPassword ? "Ocultar senha" : "Mostrar senha"}</button>{#if showPassword}<p>{me.platform.password ?? "Senha ainda não informada pelo polo."}</p>{/if}{/if}</div>
      {#if pendencies.length}<div class="panel"><h2>Pendências do polo</h2>{#each pendencies as item}<p class="warning">{item.description ?? "Pendência sem descrição."}{#if item.amount_cents} <strong>R$ {(item.amount_cents / 100).toFixed(2).replace(".", ",")}</strong>{/if}</p>{/each}</div>{/if}
      <div class="panel"><h2>Documentos complementares</h2><p class="muted">O andamento dos documentos aparece conforme a análise do servidor.</p><a class="secondary" href="/student/active/documents">Ver documentação</a></div>
    {:else if view === "documents"}
      <div class="panel"><h2>Documentos da matrícula</h2>
        {#each enrollmentFiles as item}<button class="secondary" onclick={() => openFile(item.path)}>Abrir {item.label}</button>{/each}
        {#if !enrollmentFiles.length}<p class="muted">Nenhum arquivo disponível nesta consulta.</p>{/if}
      </div>
      <div class="panel"><h2>Documentos complementares</h2>
        <p class="muted">O histórico escolar anterior é obrigatório para liberar a prova. Envie certificados se tiver; os demais comprovantes abaixo são opcionais. Seu RG e endereço já conferidos na matrícula continuam disponíveis acima.</p>
        {#each documentTypes as type}
          {@const doc = documentFor(type)}
          <div class="stack"><strong>{documentLabels[type]} — {type === "transcript" ? "obrigatório" : "opcional"}</strong>
            {#if type === "military_service"}<p class="muted">Envie quando exigido pelo polo para sua matrícula.</p>{/if}
            <span class="muted">{validationLabels[doc?.validation_status ?? ""] ?? "Não enviado"}</span>
            {#if doc?.analysis_reason}<p>{doc.analysis_reason}</p>{/if}
            {#if doc?.photo}<button class="secondary" onclick={() => openFile(doc.photo)}>Abrir arquivo enviado</button>{/if}
            <label>Enviar {documentLabels[type]}<input aria-label={`Enviar comprovante de ${documentLabels[type]}`} type="file" accept="image/jpeg,image/png,image/webp" onchange={(event) => upload(type, event)} disabled={busy || doc?.validation_status === "approved" || !["awaiting_documents", "documents_under_review"].includes(me.status ?? "")} /></label>
          </div>
        {/each}
        <label>Tipo sanguíneo (opcional)<select bind:value={bloodType}><option value="">Selecione</option>{#each ["A+","A-","B+","B-","AB+","AB-","O+","O-"] as option}<option value={option}>{option}</option>{/each}</select></label>
        <button type="button" class="btn" onclick={saveBloodType} disabled={!bloodType || busy}>Salvar tipo sanguíneo</button>
      </div>
    {:else if view === "access" || view === "subjects"}
      <div class="panel"><h2>Acesso à plataforma parceira</h2><p>As disciplinas, aulas e conteúdos ficam exclusivamente no ambiente externo da instituição parceira.</p>{#if partnerUrl}<a class="btn" href={partnerUrl} target="_blank" rel="noopener noreferrer">Abrir plataforma parceira</a>{:else}<p class="warning">O polo ainda não informou o endereço da plataforma.</p>{/if}
        {#if me.platform?.login}<dl><div><dt>Login</dt><dd>{me.platform.login}</dd></div>{#if me.platform.password}<div><dt>Senha</dt><dd>{showPassword ? me.platform.password : "••••••••"}</dd></div>{/if}{#if me.platform.notes}<div><dt>Orientações do polo</dt><dd>{me.platform.notes}</dd></div>{/if}</dl><button type="button" class="secondary" onclick={() => { showPassword = !showPassword; }}>{showPassword ? "Ocultar senha" : "Mostrar senha"}</button>{:else}<p class="muted">O polo ainda não cadastrou o login da plataforma parceira.</p>{/if}
      </div>
      <div class="panel"><h2>Taxas da instituição parceira</h2>
        <p class="muted">O polo paga a primeira taxa e agenda o pagamento da segunda.</p>
        {#if me.partner_fees}
          {#each [{ label: "Primeira taxa", fee: me.partner_fees.first }, { label: "Segunda taxa", fee: me.partner_fees.second }] as item}
            <div class="stack"><h3>{item.label}</h3>
              {#if item.fee}<dl><div><dt>Situação</dt><dd>{item.fee.paid ? "Pago" : feeLabels[item.fee.status] ?? "Situação em conferência"}</dd></div><div><dt>Valor</dt><dd>{feeAmount(item.fee.amount)}</dd></div>{#if item.fee.scheduled_for}<div><dt>Pagamento programado para</dt><dd>{dateLabel(item.fee.scheduled_for)}</dd></div>{/if}</dl>
              {:else}<p class="muted">Pagamento ainda não registrado pelo polo.</p>{/if}
            </div>
          {/each}
        {:else}<p class="muted">A situação das taxas não foi disponibilizada nesta consulta.</p>{/if}
      </div>
    {:else}
      {#if me.exams?.length}<div class="panel"><h2>Suas provas</h2>{#each me.exams as exam (exam.external_id)}<div class="stack"><strong>{exam.subject}</strong><p>{dateLabel(exam.scheduled_at)} — tentativa {exam.attempt_number}</p><p>Resultado: {exam.result === "passed" ? "Aprovado" : exam.result === "failed" ? "Reprovado" : "Aguardando resultado"}</p>{#if exam.notes}<p>{exam.notes}</p>{/if}</div>{/each}</div>{/if}
      <div class="panel"><h2>Agendamento de prova</h2>{#if me.exam_can_schedule === true}<form class="stack" onsubmit={schedule}><label>Matéria da prova<input aria-label="Matéria da prova" bind:value={subject} required maxlength="120" /></label><label>Data e hora combinadas com o polo<input aria-label="Data e hora combinadas com o polo" type="datetime-local" bind:value={scheduledAt} required /></label><button type="submit" class="btn" disabled={busy}>Confirmar agendamento</button></form>{:else}<p class="muted">O agendamento exige documentos aprovados e dois meses completos desde a confirmação do pagamento.</p>{#if me.exam_available_at}<p>Prazo mínimo: {dateLabel(me.exam_available_at)}.</p>{/if}{/if}</div>
    {/if}
  {/if}
</section>
