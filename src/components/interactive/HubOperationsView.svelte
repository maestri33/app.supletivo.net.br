<script lang="ts">
  import { onMount } from "svelte";
  import { openPrivateMedia } from "@/lib/private-media";
  import { requestAuth, getErrorMessage } from "@/lib/api";
  import { ENROLLMENT_STATUS_LABELS, amountInCents, centsLabel, type HubRow, type HubStudentsPage, type HubEnrollment, type HubStudent, type HubCandidate, type HubMedia } from "@/lib/hub";
  import { STUDENT_STATUS_LABELS, safeMediaUrl, safePartnerUrl, dateLabel, imageError } from "./student/workflow";
  import "./student/workflow.css";

  type Exam = { external_id: string; subject: string; scheduled_at: string; result: string; notes?: string | null; attempt_number: number };
  type StudentDetail = Omit<HubStudent, "diploma"> & { exams?: Exam[]; diploma?: HubStudent["diploma"] & { diploma_file?: string | null; transcript_file?: string | null } };
  type Section = "enrollment" | "student" | "candidate";
  const base = "/api/v1/leadership";
  let section = $state<Section>("enrollment");
  let rows = $state<HubRow[]>([]);
  let offset = $state(0);
  let total = $state(0);
  let loading = $state(true);
  let busy = $state(false);
  let error = $state("");
  let message = $state("");
  let selectedId = $state("");
  let enrollment = $state<HubEnrollment | null>(null);
  let student = $state<StudentDetail | null>(null);
  let candidate = $state<HubCandidate | null>(null);
  let qrCode = $state("");
  let feeAmount = $state("");
  let platformLogin = $state("");
  let platformPassword = $state("");
  let platformUrl = $state("");
  let platformNotes = $state("");
  let examResult = $state("");
  let examNotes = $state("");
  let pendencyKind = $state("document");
  let pendencyDescription = $state("");
  let pendencyAmount = $state("");
  let decisionReason = $state("");
  let diplomaFiles = $state<FileList>();
  let transcriptFiles = $state<FileList>();
  let pickupFiles = $state<FileList>();
  const status = $derived(enrollment?.status ?? student?.status ?? candidate?.status ?? "");
  const openPendencies = $derived(student?.pendencies.filter(p => !p.resolved) ?? []);
  const canProcessDocuments = $derived(student && ["awaiting_documentation_dispatch", "pending"].includes(student.status));
  const canConclude = $derived(enrollment && ["awaiting_release", "fee_paid", "fee_scheduled"].includes(enrollment.status) && enrollment.fees.first_paid && enrollment.fees.second_scheduled);
  const media = $derived.by((): HubMedia[] => {
    if (enrollment) return [
      { label: "Identidade — frente", path: enrollment.rg?.front_photo }, { label: "Identidade — verso", path: enrollment.rg?.back_photo },
      { label: "Identidade — arquivo completo", path: enrollment.rg?.full_photo }, { label: "Selfie de assinatura", path: enrollment.selfie?.photo },
      { label: "Comprovante de endereço", path: enrollment.address_proof?.photo },
    ];
    if (candidate) return [
      { label: "Identidade — frente", path: candidate.document?.front_photo }, { label: "Identidade — verso", path: candidate.document?.back_photo },
      { label: "Identidade — arquivo completo", path: candidate.document?.full_photo }, { label: "Selfie de assinatura", path: candidate.selfie_image },
    ];
    return [];
  });
  function label(value: string) { return STUDENT_STATUS_LABELS[value] ?? ENROLLMENT_STATUS_LABELS[value] ?? value; }
  function failure(cause: unknown) { return cause instanceof Error ? cause.message : getErrorMessage(cause); }
  function collection() { return section === "enrollment" ? "enrollments" : section === "student" ? "students" : "candidates"; }

  async function openFile(path: string | null | undefined) { if (!path) return; error = ""; try { await openPrivateMedia(path); } catch (cause) { error = failure(cause); } }
  async function loadRows() {
    if (section === "student") {
      const result = await requestAuth<HubStudentsPage>(`${base}/students?limit=50&offset=${offset}`);
      rows = result.items; total = result.total;
    } else {
      rows = await requestAuth<HubRow[]>(`${base}/${collection()}`); total = rows.length;
    }
  }
  async function loadDetail() {
    if (!selectedId) return;
    const path = `${base}/${collection()}/${encodeURIComponent(selectedId)}`;
    if (section === "enrollment") enrollment = await requestAuth<HubEnrollment>(path);
    else if (section === "student") student = await requestAuth<StudentDetail>(path);
    else candidate = await requestAuth<HubCandidate>(path);
  }
  async function refresh() {
    if (busy) return;
    loading = true; error = "";
    try { await loadRows(); await loadDetail(); }
    catch (cause) { error = failure(cause); }
    finally { loading = false; }
  }
  async function choose(next: Section, id = "") {
    if (busy || loading) return;
    section = next; offset = 0; selectedId = id;
    enrollment = null; student = null; candidate = null; message = "";
    qrCode = ""; feeAmount = ""; platformLogin = ""; platformPassword = ""; platformUrl = ""; platformNotes = "";
    examResult = ""; examNotes = ""; pendencyDescription = ""; pendencyAmount = ""; decisionReason = "";
    diplomaFiles = undefined; transcriptFiles = undefined; pickupFiles = undefined;
    await refresh();
    const url = new URL(window.location.href);
    url.search = id ? `${next}=${encodeURIComponent(id)}` : "";
    window.history.replaceState(null, "", url);
  }
  async function act(path: string, options: { json?: unknown; file?: File; formData?: FormData } = {}) {
    if (busy || loading) return;
    busy = true; error = ""; message = "";
    let registered = false;
    try {
      await requestAuth(`${base}/${path}`, { method: "POST", ...options });
      registered = true;
      await loadDetail(); await loadRows();
      message = "Ação registrada. Situação consultada no servidor.";
    } catch (cause) {
      error = registered ? `A ação foi registrada, mas a consulta falhou: ${failure(cause)}. Atualize a situação antes de continuar.`
        : `${failure(cause)}. Consulte a situação antes de repetir a ação.`;
      try { await loadDetail(); } catch { enrollment = null; student = null; candidate = null; }
    } finally { busy = false; }
  }
  async function fee(action: "pay" | "schedule") {
    if (!enrollment || !qrCode.trim()) return;
    try {
      const cents = amountInCents(feeAmount);
      await act(`enrollments/${encodeURIComponent(enrollment.external_id)}/fee/${action}`, { json: {
        qr_code: qrCode.trim(), amount: cents === null ? null : (cents / 100).toFixed(2),
      } });
    } catch (cause) { error = failure(cause); }
  }
  async function conclude() {
    if (!enrollment || !canConclude || !platformLogin.trim() || !platformPassword || !safePartnerUrl(platformUrl)) return;
    await act(`enrollments/${encodeURIComponent(enrollment.external_id)}/conclude`, { json: {
      platform_login: platformLogin.trim(), platform_password: platformPassword, platform_url: safePartnerUrl(platformUrl), platform_notes: platformNotes.trim() || null,
    } });
    if (enrollment?.status === "completed") platformPassword = "";
  }
  async function openPendency() {
    if (!student || !pendencyDescription.trim()) return;
    try {
      await act(`students/${encodeURIComponent(student.external_id)}/pendencies`, { json: {
        kind: pendencyKind, description: pendencyDescription.trim(), amount_cents: pendencyKind === "fee" ? amountInCents(pendencyAmount) : null,
      } });
    } catch (cause) { error = failure(cause); }
  }
  async function issueDiploma() {
    if (!student || !diplomaFiles?.[0] || !transcriptFiles?.[0]) { error = "Anexe o diploma e o histórico escolar emitidos pelo parceiro."; return; }
    for (const file of [diplomaFiles[0], transcriptFiles[0]]) {
      if (!file.size || file.size > 20 * 1024 * 1024 || !["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type)) { error = "Envie PDF, JPG, PNG ou WebP não vazio de até 20 MB."; return; }
    }
    const formData = new FormData(); formData.append("diploma", diplomaFiles[0]);
    if (transcriptFiles?.[0]) formData.append("transcript", transcriptFiles[0]);
    await act(`students/${encodeURIComponent(student.external_id)}/diploma/issue`, { formData });
  }
  async function pickup() {
    if (!student || !pickupFiles?.[0]) return;
    const invalid = imageError(pickupFiles[0]); if (invalid) { error = invalid; return; }
    await act(`students/${encodeURIComponent(student.external_id)}/diploma/pickup`, { file: pickupFiles[0] });
  }
  async function decide(path: string, approve: boolean) {
    if (!approve && !decisionReason.trim()) { error = "Informe o motivo da correção."; return; }
    await act(path, { json: { approve, reason: approve ? null : decisionReason.trim() } });
  }
  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    for (const type of ["enrollment", "student", "candidate"] as const) {
      if (params.get(type)) { section = type; selectedId = params.get(type)!; break; }
    }
    void refresh();
  });
</script>

<div class="student-workflow" aria-busy={loading || busy}>
  <header class="stack"><h1>Alunos do polo</h1><p class="muted">Matrículas, documentação, provas e entrega de diploma.</p></header>
  <div class="choices" aria-label="Tipo de processo">
    <button class="choice" aria-pressed={section === "enrollment"} disabled={busy || loading} onclick={() => choose("enrollment")}>Matrículas</button>
    <button class="choice" aria-pressed={section === "student"} disabled={busy || loading} onclick={() => choose("student")}>Alunos</button>
    <button class="choice" aria-pressed={section === "candidate"} disabled={busy || loading} onclick={() => choose("candidate")}>Candidatos</button>
  </div>
  {#if error}<p role="alert" class="error">{error}</p>{/if}
  {#if message}<p role="status" class="success">{message}</p>{/if}
  <button class="secondary" disabled={busy || loading} onclick={refresh}>Atualizar situação</button>
  <a class="secondary" href="/hub/review">Fila de revisões</a>
  {#if loading}<p role="status">Consultando alunos...</p>{/if}
  <section class="panel" aria-label="Lista de alunos">
    <h2>{section === "enrollment" ? "Matrículas" : section === "student" ? "Alunos" : "Candidatos aguardando decisão"}</h2>
    {#if !loading && !error && rows.length === 0}<p>Nenhum processo nesta lista.</p>{/if}
    {#each rows as row (row.external_id)}
      <button class="secondary process-row" disabled={busy || loading} aria-pressed={selectedId === row.external_id} onclick={() => choose(section, row.external_id)}>
        <span>{row.name || "Nome não informado"}<small>{row.phone || row.external_id}</small></span><span>{label(row.status)}</span>
      </button>
    {/each}
    {#if section === "student" && total > 50}
      <p class="muted">{offset + 1}–{Math.min(offset + rows.length, total)} de {total} alunos</p>
      <div class="choices">
        <button class="secondary" disabled={busy || loading || offset === 0} onclick={() => { offset -= 50; void refresh(); }}>Anterior</button>
        <button class="secondary" disabled={busy || loading || offset + rows.length >= total} onclick={() => { offset += 50; void refresh(); }}>Próxima</button>
      </div>
    {/if}
  </section>
  {#if selectedId && (enrollment || student || candidate)}
    <section class="panel" aria-label="Detalhe do processo">
      <h2>{student?.user.name || candidate?.user.name || rows.find(r => r.external_id === selectedId)?.name || "Processo selecionado"}</h2>
      <p>Etapa atual: <strong>{label(status)}</strong></p><p class="muted">Identificador: {selectedId}</p>
      {#each media.filter(item => safeMediaUrl(item.path)) as item}
        <button class="secondary" onclick={() => openFile(item.path)}>Abrir {item.label}</button>
      {/each}
      {#if enrollment}
        {#if enrollment.rg?.analysis_reason}<p>Identidade: {enrollment.rg.analysis_reason}</p>{/if}
        {#if enrollment.selfie?.analysis_reason}<p>Selfie: {enrollment.selfie.analysis_reason}</p>{/if}
        {#if enrollment.address_proof?.analysis_reason}<p>Comprovante: {enrollment.address_proof.analysis_reason}</p>{/if}
        {#if enrollment.address_proof?.kinship_description}<p>Parentesco informado: {enrollment.address_proof.kinship_description}</p>{/if}
        {#if enrollment.address}<p>Endereço: {Object.values(enrollment.address).filter(v => typeof v === "string" && v).join(", ")}</p>{/if}
        {#if enrollment.education}<p>Escolaridade: {enrollment.education.level || "Não informada"}, série {enrollment.education.grade ?? "não informada"}; {enrollment.education.last_school || "escola não informada"}</p>{/if}
        <label>Motivo da correção<input bind:value={decisionReason} maxlength="500" disabled={busy || loading} /></label>
        {#each [{ kind: "rg", title: "identidade", state: enrollment.rg?.validation_status, photo: enrollment.rg?.front_photo || enrollment.rg?.full_photo }, { kind: "selfie", title: "selfie", state: enrollment.selfie?.status, photo: enrollment.selfie?.photo }, { kind: "address-proof", title: "comprovante", state: enrollment.address_proof?.validation_status, photo: enrollment.address_proof?.photo }] as review}
          {#if ["review", "needs_kinship"].includes(review.state || "")}
            <div class="choices"><button class="secondary" disabled={busy || loading || !safeMediaUrl(review.photo)} onclick={() => decide(`enrollments/${encodeURIComponent(selectedId)}/${review.kind}/decide`, true)}>Aprovar {review.title}</button>
            <button class="secondary" disabled={busy || loading || !decisionReason.trim()} onclick={() => decide(`enrollments/${encodeURIComponent(selectedId)}/${review.kind}/decide`, false)}>Solicitar correção de {review.title}</button></div>
          {/if}
        {/each}
      {/if}
      {#if candidate}
        <p>Documento: {candidate.document?.analysis_status || "Não informado"}. {candidate.document?.analysis_reason || ""}</p>
        <p>Selfie: {candidate.selfie_status}. {candidate.selfie_description || ""}</p><p>Chave Pix: {candidate.pix_key || "Não informada"} — {candidate.pix_validated ? "conferida" : "pendente"}</p>
        <label>Motivo da correção ou rejeição<input bind:value={decisionReason} maxlength="500" disabled={busy || loading} /></label>
        {#each [{ kind: "document", title: "documento", state: candidate.document?.analysis_status, photo: candidate.document?.front_photo || candidate.document?.full_photo }, { kind: "selfie", title: "selfie", state: candidate.selfie_status, photo: candidate.selfie_image }] as review}
          {#if review.state === "review"}<div class="choices">
            <button class="secondary" disabled={busy || loading || !safeMediaUrl(review.photo)} onclick={() => decide(`candidates/${encodeURIComponent(selectedId)}/${review.kind}/decide`, true)}>Aprovar {review.title}</button>
            <button class="secondary" disabled={busy || loading || !decisionReason.trim()} onclick={() => decide(`candidates/${encodeURIComponent(selectedId)}/${review.kind}/decide`, false)}>Solicitar correção de {review.title}</button>
          </div>{/if}
        {/each}
        {#if candidate.status === "completed"}<div class="choices">
          <button class="btn" disabled={busy || loading} onclick={() => act(`candidates/${encodeURIComponent(selectedId)}/approve`)}>Aprovar candidatura</button>
          <button class="secondary" disabled={busy || loading || !decisionReason.trim()} onclick={() => act(`candidates/${encodeURIComponent(selectedId)}/reject`, { json: { reason: decisionReason.trim() } })}>Rejeitar candidatura</button>
        </div>{/if}
      {/if}
      {#if student}
        <p>Tipo sanguíneo: {student.blood_type || "Não informado"}</p>
        {#if safePartnerUrl(student.platform.url)}<a class="secondary" href={safePartnerUrl(student.platform.url)!} target="_blank" rel="noopener noreferrer">Plataforma da instituição</a>{/if}
        <p>Login da instituição: {student.platform.login || "Não informado"}</p>
        <label>Motivo da correção<input bind:value={decisionReason} maxlength="500" disabled={busy || loading} /></label>
        {#each student.documents as doc (doc.external_id)}
          <div class="stack"><h3>{doc.doc_type}</h3><p>{doc.validation_status}. {doc.analysis_reason || ""}</p>
            {#if safeMediaUrl(doc.photo)}<button class="secondary" onclick={() => openFile(doc.photo)}>Abrir documento {doc.doc_type}</button>{:else}<p class="muted">Arquivo não disponível.</p>{/if}
            {#if doc.validation_status === "review"}<div class="choices">
              <button class="secondary" disabled={busy || loading || !safeMediaUrl(doc.photo)} onclick={() => decide(`students/${encodeURIComponent(selectedId)}/documents/${encodeURIComponent(doc.external_id)}/decide`, true)}>Aprovar {doc.doc_type}</button>
              <button class="secondary" disabled={busy || loading || !decisionReason.trim()} onclick={() => decide(`students/${encodeURIComponent(selectedId)}/documents/${encodeURIComponent(doc.external_id)}/decide`, false)}>Solicitar correção de {doc.doc_type}</button>
            </div>{/if}
          </div>
        {/each}
        {#if student.exams?.length}<h3>Provas do aluno</h3>{#each student.exams as exam (exam.external_id)}<div class="stack"><strong>{exam.subject}</strong><p>{dateLabel(exam.scheduled_at)} — tentativa {exam.attempt_number}</p><p>Resultado: {exam.result === "passed" ? "Aprovado" : exam.result === "failed" ? "Reprovado" : "Aguardando resultado"}</p>{#if exam.notes}<p>{exam.notes}</p>{/if}</div>{/each}{/if}
        {#if student.diploma?.diploma_file}<button class="secondary" onclick={() => openFile(student?.diploma?.diploma_file)}>Abrir diploma emitido</button>{/if}
        {#if student.diploma?.transcript_file}<button class="secondary" onclick={() => openFile(student?.diploma?.transcript_file)}>Abrir histórico emitido</button>{/if}
        {#if student.diploma}<p>Diploma emitido em {dateLabel(student.diploma.issued_at)}. {student.diploma.picked_up ? "Retirada registrada." : "Retirada pendente."}</p>{/if}
      {/if}
    </section>
  {/if}
  {#if enrollment && ["awaiting_release", "fee_paid", "fee_scheduled"].includes(enrollment.status)}
    <section class="panel"><h2>Taxas da matrícula</h2>
      <p>Primeira taxa: {enrollment.fees.first_paid ? "paga" : enrollment.fees.first?.status || "não solicitada"}. {enrollment.fees.first ? `Valor: R$ ${enrollment.fees.first.amount}` : ""}</p>
      <p>Segunda taxa: {enrollment.fees.second_scheduled ? "programada" : "não programada"}. {enrollment.fees.second ? `Situação: ${enrollment.fees.second.status}. Valor: R$ ${enrollment.fees.second.amount}. Vencimento: ${dateLabel(enrollment.fees.second.scheduled_for)}` : ""}</p>
      {#if enrollment.fees.first?.last_error || enrollment.fees.second?.last_error}<p class="error">{enrollment.fees.first?.last_error || enrollment.fees.second?.last_error}</p>{/if}
      <p class="notice">Estas ações enviam solicitações financeiras reais. A primeira taxa precisa ter pagamento confirmado para concluir. O vencimento da segunda vem do QR da cobrança.</p>
      <label>Pix copia e cola da taxa<input bind:value={qrCode} disabled={busy || loading} autocomplete="off" /></label>
      <label>Valor em reais, se o QR não informar<input bind:value={feeAmount} disabled={busy || loading} inputmode="decimal" placeholder="125,50" /></label>
      <div class="choices"><button class="btn" disabled={busy || loading || !qrCode.trim() || Boolean(enrollment.fees.first && enrollment.fees.first.status !== "failed") || !["awaiting_release", "fee_scheduled"].includes(enrollment.status)} onclick={() => fee("pay")}>Pagar primeira taxa</button>
        <button class="secondary" disabled={busy || loading || !qrCode.trim() || enrollment.fees.second_scheduled || (enrollment.fees.second && enrollment.fees.second.status !== "failed") || !["awaiting_release", "fee_paid", "fee_scheduled"].includes(enrollment.status)} onclick={() => fee("schedule")}>Programar segunda taxa</button></div>
    </section>
    <section class="panel"><h2>Concluir matrícula</h2>
      {#if !canConclude}<p class="warning">A conclusão exige primeira taxa paga e segunda taxa programada.</p>{/if}
      <label>URL da plataforma da instituição<input type="url" bind:value={platformUrl} disabled={busy || loading || !canConclude} placeholder="https://" /></label>
      <label>Login da instituição<input bind:value={platformLogin} disabled={busy || loading || !canConclude} autocomplete="off" /></label>
      <label>Senha da instituição<input type="password" bind:value={platformPassword} disabled={busy || loading || !canConclude} autocomplete="new-password" /></label>
      <label>Orientações para o aluno<input bind:value={platformNotes} disabled={busy || loading || !canConclude} /></label>
      <button class="btn" disabled={busy || loading || !canConclude || !platformLogin.trim() || !platformPassword || !safePartnerUrl(platformUrl)} onclick={conclude}>Concluir com credenciais</button>
    </section>
  {/if}
  {#if student?.status === "exam_scheduled"}
    <section class="panel"><h2>Resultado da prova</h2>
      <label>Resultado<select bind:value={examResult} disabled={busy || loading}><option value="">Selecione o resultado</option><option value="passed">Aprovado</option><option value="failed">Reprovado</option></select></label>
      <label>Observações da avaliação<input bind:value={examNotes} maxlength="500" disabled={busy || loading} /></label>
      <button class="btn" disabled={busy || loading || !examResult} onclick={() => act(`students/${encodeURIComponent(selectedId)}/exam/grade`, { json: { passed: examResult === "passed", notes: examNotes.trim() || null } })}>Registrar resultado</button>
    </section>
  {/if}
  {#if student && canProcessDocuments}
    <section class="panel"><h2>Pendências e documentação</h2>
      {#each student.pendencies as pendency (pendency.external_id)}<div class="stack"><p>{pendency.description} {pendency.amount_cents !== null && pendency.amount_cents !== undefined ? `— ${centsLabel(pendency.amount_cents)}` : ""} — {pendency.resolved ? "Resolvida" : "Em aberto"}</p>
        {#if !pendency.resolved}<button class="secondary" disabled={busy || loading} onclick={() => act(`pendencies/${encodeURIComponent(pendency.external_id)}/resolve`)}>Resolver pendência</button>{/if}
      </div>{/each}
      <label>Tipo de pendência<select bind:value={pendencyKind} disabled={busy || loading}><option value="document">Documento</option><option value="fee">Taxa</option></select></label>
      <label>Descrição da pendência<input bind:value={pendencyDescription} maxlength="500" disabled={busy || loading} /></label>
      {#if pendencyKind === "fee"}<label>Valor da pendência em reais<input bind:value={pendencyAmount} disabled={busy || loading} inputmode="decimal" placeholder="125,50" /></label><p class="muted">Registrar uma pendência de taxa não cobra nem transfere dinheiro.</p>{/if}
      <button class="secondary" disabled={busy || loading || !pendencyDescription.trim()} onclick={openPendency}>Abrir pendência</button>
      {#if openPendencies.length}<p class="warning">Resolva as pendências antes de liberar a emissão.</p>{/if}
      <button class="btn" disabled={busy || loading || openPendencies.length > 0} onclick={() => act(`students/${encodeURIComponent(selectedId)}/documentation/clear`)}>Liberar emissão do diploma</button>
    </section>
  {/if}
  {#if student?.status === "awaiting_diploma_issuance" || (student?.status === "awaiting_pickup" && !student?.diploma?.transcript_file)}
    <section class="panel"><h2>Anexar diploma emitido</h2>
      <label>Arquivo do diploma<input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" bind:files={diplomaFiles} disabled={busy || loading} /></label>
      <label>Histórico escolar emitido pelo parceiro (obrigatório)<input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" bind:files={transcriptFiles} disabled={busy || loading} /></label>
      <button class="btn" disabled={busy || loading || !diplomaFiles?.[0] || !transcriptFiles?.[0]} onclick={issueDiploma}>Registrar emissão</button>
    </section>
  {/if}
  {#if student?.status === "awaiting_pickup"}
    <section class="panel"><h2>Registrar retirada do diploma</h2>{#if !student.diploma?.diploma_file || !student.diploma?.transcript_file}<p class="warning">Anexe o diploma e o histórico escolar antes de registrar a entrega.</p>{/if}<p>Registre a entrega presencial com a foto do concluinte.</p>
      <label>Foto da entrega<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" bind:files={pickupFiles} disabled={busy || loading} /></label>
      <button class="btn" disabled={busy || loading || !pickupFiles?.[0] || !student.diploma?.diploma_file || !student.diploma?.transcript_file} onclick={pickup}>Registrar retirada</button>
    </section>
  {/if}
</div>
<style>
  .process-row { justify-content: space-between; text-align: left; flex-wrap: wrap; }
  .process-row small { display: block; color: var(--muted-on-dark); }
</style>
