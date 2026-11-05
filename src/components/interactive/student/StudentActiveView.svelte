<script lang="ts">
  import { onMount } from "svelte";
  import { requestAuth, getEnrollmentMe, getStudentPendencies, postStudentBloodType, postStudentDocument, postStudentExamSchedule, getErrorMessage, type StudentMe, type StudentDocument, type EnrollmentMe, type DocumentType, type BloodType } from "@/lib/api";
  import { openPrivateMedia } from "@/lib/private-media";
  import { safePartnerUrl, STUDENT_STATUS_LABELS, dateLabel, imageError, documentFileError } from "./workflow";
  import Card from "@/components/ui/Card.svelte";
  import Badge from "@/components/ui/Badge.svelte";
  import Alert from "@/components/ui/Alert.svelte";
  import Skeleton from "@/components/ui/Skeleton.svelte";
  import EmptyState from "@/components/ui/EmptyState.svelte";

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
      if (file.type === "application/pdf") {
        if (!file.size || file.size > 15 * 1024 * 1024) throw new Error("Envie um arquivo PDF legível de até 15 MB.");
      } else {
        const invalid = imageError(file); if (invalid) throw new Error(invalid);
        if (!file.size || file.size > 15 * 1024 * 1024) throw new Error("Envie uma foto legível de até 15 MB.");
        const bitmap = await createImageBitmap(file); bitmap.close();
      }
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

<section class="w-full max-w-3xl mx-auto p-4 sm:p-6 space-y-6 text-white" aria-busy={loading || busy}>
  {#if loading}
    <div class="space-y-4">
      <Skeleton class="h-10 w-48 rounded-xl" />
      <Skeleton class="h-40 w-full rounded-2xl" />
      <Skeleton class="h-56 w-full rounded-3xl" />
    </div>
  {:else if error}
    <div class="space-y-3">
      <Alert variant="danger" title="Não foi possível consultar seu ambiente" description={error} />
      <button
        type="button"
        onclick={load}
        class="min-h-[48px] px-6 py-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition cursor-pointer"
      >
        Tentar novamente
      </button>
    </div>
  {:else if me}
    {#if actionError}
      <Alert variant="danger" title="Atenção" description={actionError} />
    {/if}
    {#if message}
      <Alert variant="info" title="Informação" description={message} />
    {/if}

    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
      <div>
        <span class="text-xs font-semibold text-white/60 uppercase tracking-wider block">Status da Matrícula</span>
        <h1 data-testid="student-status" class="text-xl sm:text-2xl font-display font-bold text-white mt-0.5">
          {statusLabel}
        </h1>
      </div>
      <button
        type="button"
        disabled={busy || loading}
        onclick={load}
        class="min-h-[48px] px-5 py-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
      >
        Atualizar situação
      </button>
    </div>

    {#if view === "dashboard"}
      <!-- Acesso ao parceiro educacional -->
      <Card title="Acesso ao Parceiro Educacional" description="Ambiente de estudos e conteúdos didáticos">
        {#snippet actions()}
          {#if partnerUrl}
            <Badge variant="success" size="sm">Disponível</Badge>
          {:else}
            <Badge variant="warning" size="sm">Aguardando Polo</Badge>
          {/if}
        {/snippet}

        <div class="space-y-4 pt-2">
          {#if partnerUrl}
            <a
              href={partnerUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="min-h-[48px] px-6 py-3 rounded-2xl bg-[var(--yellow)] hover:bg-[var(--yellow-soft)] text-brand-ink font-bold text-sm shadow-xl transition inline-flex items-center gap-2"
              aria-label="Acessar ambiente do parceiro"
            >
              Acessar ambiente do parceiro →
            </a>
          {:else}
            <p class="text-xs text-white/60">O polo ainda não informou o ambiente educacional externo.</p>
          {/if}

          {#if me.platform?.login}
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-white/5 border border-white/10 text-xs">
              <div>
                <dt class="text-white/60">Login do parceiro</dt>
                <dd class="text-sm font-mono font-bold text-white mt-0.5">{me.platform.login}</dd>
              </div>
              <div>
                <dt class="text-white/60">Senha de acesso</dt>
                <dd class="text-sm font-mono font-bold text-white mt-0.5">
                  {showPassword ? (me.platform.password ?? "Não informada") : "••••••••"}
                </dd>
              </div>
              {#if me.platform.notes}
                <div class="sm:col-span-2 pt-1 border-t border-white/10">
                  <dt class="text-white/60">Orientações do polo</dt>
                  <dd class="text-xs text-white/90 mt-0.5 leading-relaxed">{me.platform.notes}</dd>
                </div>
              {/if}
            </dl>
            <button
              type="button"
              onclick={() => { showPassword = !showPassword; }}
              class="min-h-[44px] px-4 py-2 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition cursor-pointer"
            >
              {showPassword ? "Ocultar senha" : "Mostrar senha"}
            </button>
          {/if}
        </div>
      </Card>

      {#if pendencies.length}
        <Card title="Pendências do Polo" description="Ações requeridas pela secretaria escolar">
          <div class="space-y-2 pt-2">
            {#each pendencies as item}
              <div class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs flex items-center justify-between gap-3">
                <span>{item.description ?? "Pendência sem descrição."}</span>
                {#if item.amount_cents}
                  <strong class="font-mono text-white text-sm">R$ {(item.amount_cents / 100).toFixed(2).replace(".", ",")}</strong>
                {/if}
              </div>
            {/each}
          </div>
        </Card>
      {/if}

      <Card title="Documentação Acadêmica" description="Envio e acompanhamento de certidões e históricos">
        <p class="text-xs text-white/70 leading-relaxed">
          O andamento dos documentos aparece conforme a conferência do servidor e da secretaria credenciada.
        </p>
        {#snippet footer()}
          <a
            href="/student/active/documents"
            class="min-h-[48px] px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition inline-flex items-center gap-2"
          >
            Ver documentação completa →
          </a>
        {/snippet}
      </Card>

    {:else if view === "documents"}
      <!-- Documentos da matrícula -->
      <Card title="Documentos da Matrícula" description="Arquivos digitalizados durante a confirmação de inscrição">
        <div class="flex flex-wrap gap-2.5 pt-2">
          {#each enrollmentFiles as item}
            <button
              type="button"
              onclick={() => openFile(item.path)}
              class="min-h-[48px] px-4 py-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition cursor-pointer"
            >
              Abrir {item.label}
            </button>
          {/each}
          {#if !enrollmentFiles.length}
            <p class="text-xs text-white/60">Nenhum arquivo disponível nesta consulta.</p>
          {/if}
        </div>
      </Card>

      <!-- Documentos complementares -->
      <Card title="Documentos Complementares" description="Histórico escolar anterior obrigatório para liberação de provas e certificados opcionais">
        <p class="text-xs text-white/70 leading-relaxed pb-3">
          O histórico escolar anterior é obrigatório para liberar a prova. Envie certificados se tiver; os demais comprovantes abaixo são opcionais.
        </p>

        <div class="space-y-4">
          {#each documentTypes as type}
            {@const doc = documentFor(type)}
            <div class="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div class="flex items-center justify-between gap-3">
                <strong class="text-sm font-bold text-white capitalize">
                  {documentLabels[type]} — {type === "transcript" ? "Obrigatório" : "Opcional"}
                </strong>
                <Badge
                  variant={doc?.validation_status === "approved" ? "success" : doc?.validation_status === "rejected" ? "danger" : doc?.validation_status === "review" ? "warning" : "default"}
                  size="sm"
                >
                  {validationLabels[doc?.validation_status ?? ""] ?? "Não enviado"}
                </Badge>
              </div>

              {#if type === "military_service"}
                <p class="text-xs text-white/60">Envie quando exigido pelo polo para sua matrícula.</p>
              {/if}

              {#if doc?.analysis_reason}
                <p class="text-xs text-amber-300 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">{doc.analysis_reason}</p>
              {/if}

              <div class="flex flex-wrap items-center gap-3">
                {#if doc?.photo}
                  <button
                    type="button"
                    onclick={() => openFile(doc.photo)}
                    class="min-h-[44px] px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition cursor-pointer"
                  >
                    Abrir arquivo enviado
                  </button>
                {/if}

                <label class="min-h-[48px] px-5 py-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition cursor-pointer inline-flex items-center gap-2">
                  <span>{doc?.photo ? "Substituir arquivo" : "Enviar arquivo"}</span>
                  <input
                    aria-label={`Enviar comprovante de ${documentLabels[type]}`}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onchange={(event) => upload(type, event)}
                    disabled={busy || doc?.validation_status === "approved" || !["awaiting_documents", "documents_under_review"].includes(me.status ?? "")}
                    class="sr-only"
                  />
                </label>
              </div>
            </div>
          {/each}

          <div class="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <label for="student-blood-type" class="block text-xs font-bold text-white/80">
              Tipo sanguíneo (opcional)
            </label>
            <div class="flex flex-col sm:flex-row gap-3">
              <select
                id="student-blood-type"
                bind:value={bloodType}
                class="h-12 rounded-xl bg-white/10 border border-white/20 px-4 text-sm text-white focus:outline-none focus:border-[var(--yellow)] transition cursor-pointer flex-1"
              >
                <option value="" class="bg-[var(--ink)] text-white">Selecione seu tipo sanguíneo</option>
                {#each ["A+","A-","B+","B-","AB+","AB-","O+","O-"] as option}
                  <option value={option} class="bg-[var(--ink)] text-white">{option}</option>
                {/each}
              </select>
              <button
                type="button"
                onclick={saveBloodType}
                disabled={!bloodType || busy}
                class="min-h-[48px] px-6 py-2.5 rounded-xl bg-[var(--yellow)] hover:bg-[var(--yellow-soft)] text-brand-ink font-bold text-xs sm:text-sm shadow-md transition cursor-pointer disabled:opacity-40"
              >
                Salvar tipo sanguíneo
              </button>
            </div>
          </div>
        </div>
      </Card>

    {:else if view === "access" || view === "subjects"}
      <Card title="Acesso à Plataforma Parceira" description="As disciplinas, aulas e conteúdos ficam exclusivamente no ambiente externo da instituição credenciada">
        <div class="space-y-4 pt-2">
          {#if partnerUrl}
            <a
              href={partnerUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="min-h-[48px] px-6 py-3 rounded-2xl bg-[var(--yellow)] hover:bg-[var(--yellow-soft)] text-brand-ink font-bold text-sm shadow-xl transition inline-flex items-center gap-2"
            >
              Abrir plataforma parceira →
            </a>
          {:else}
            <Alert variant="warning" title="Endereço não informado" description="O polo ainda não cadastrou o endereço da plataforma parceira." />
          {/if}

          {#if me.platform?.login}
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-white/5 border border-white/10 text-xs">
              <div>
                <dt class="text-white/60">Login</dt>
                <dd class="text-sm font-mono font-bold text-white mt-0.5">{me.platform.login}</dd>
              </div>
              <div>
                <dt class="text-white/60">Senha</dt>
                <dd class="text-sm font-mono font-bold text-white mt-0.5">
                  {showPassword ? (me.platform.password ?? "Não informada") : "••••••••"}
                </dd>
              </div>
              {#if me.platform.notes}
                <div class="sm:col-span-2 pt-1 border-t border-white/10">
                  <dt class="text-white/60">Orientações do polo</dt>
                  <dd class="text-xs text-white/90 mt-0.5 leading-relaxed">{me.platform.notes}</dd>
                </div>
              {/if}
            </dl>
            <button
              type="button"
              onclick={() => { showPassword = !showPassword; }}
              class="min-h-[44px] px-4 py-2 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition cursor-pointer"
            >
              {showPassword ? "Ocultar senha" : "Mostrar senha"}
            </button>
          {/if}
        </div>
      </Card>

      <Card title="Taxas da Instituição Parceira" description="O polo credenciado realiza a quitação das taxas operacionais e pedagógicas">
        {#if me.partner_fees}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {#each [{ label: "Primeira taxa", fee: me.partner_fees.first }, { label: "Segunda taxa", fee: me.partner_fees.second }] as item}
              <div class="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <h3 class="text-sm font-bold text-white">{item.label}</h3>
                {#if item.fee}
                  <dl class="text-xs space-y-1">
                    <div class="flex justify-between">
                      <dt class="text-white/60">Situação:</dt>
                      <dd class="font-bold text-white">{item.fee.paid ? "Pago" : feeLabels[item.fee.status] ?? "Em conferência"}</dd>
                    </div>
                    <div class="flex justify-between">
                      <dt class="text-white/60">Valor:</dt>
                      <dd class="font-mono font-bold text-white">{feeAmount(item.fee.amount)}</dd>
                    </div>
                    {#if item.fee.scheduled_for}
                      <div class="flex justify-between">
                        <dt class="text-white/60">Programado para:</dt>
                        <dd class="text-white/80">{dateLabel(item.fee.scheduled_for)}</dd>
                      </div>
                    {/if}
                  </dl>
                {:else}
                  <p class="text-xs text-white/60">Pagamento ainda não registrado pelo polo.</p>
                {/if}
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-xs text-white/60 pt-2">A situação das taxas não foi disponibilizada nesta consulta.</p>
        {/if}
      </Card>

    {:else}
      <!-- Avaliações e Provas -->
      {#if me.exams?.length}
        <Card title="Suas Provas" description="Resultados das provas registradas no sistema acadêmico">
          <div class="space-y-3 pt-2">
            {#each me.exams as exam (exam.external_id)}
              <div class="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 class="text-sm font-bold text-white">{exam.subject}</h3>
                  <p class="text-xs text-white/60 mt-0.5">{dateLabel(exam.scheduled_at)} • Tentativa {exam.attempt_number}</p>
                  {#if exam.notes}
                    <p class="text-xs text-white/80 mt-1">{exam.notes}</p>
                  {/if}
                </div>
                <Badge variant={exam.result === "passed" ? "success" : exam.result === "failed" ? "danger" : "warning"} size="sm">
                  {exam.result === "passed" ? "✓ Aprovado" : exam.result === "failed" ? "✕ Reprovado" : "Aguardando resultado"}
                </Badge>
              </div>
            {/each}
          </div>
        </Card>
      {/if}

      <Card title="Agendamento de Prova" description="O agendamento exige documentos aprovados e 60 dias completos desde a confirmação do pagamento">
        {#if me.exam_can_schedule === true}
          <form class="space-y-4 pt-2" onsubmit={schedule}>
            <div class="space-y-1.5">
              <label for="exam-subject-input" class="block text-xs font-bold text-white/80">
                Matéria da prova *
              </label>
              <input
                id="exam-subject-input"
                aria-label="Matéria da prova"
                bind:value={subject}
                required
                maxlength="120"
                class="w-full h-12 rounded-xl bg-white/10 border border-white/20 px-4 text-sm text-white focus:outline-none focus:border-[var(--yellow)] transition"
              />
            </div>
            <div class="space-y-1.5">
              <label for="exam-scheduled-at-input" class="block text-xs font-bold text-white/80">
                Data e hora combinadas com o polo *
              </label>
              <input
                id="exam-scheduled-at-input"
                aria-label="Data e hora combinadas com o polo"
                type="datetime-local"
                bind:value={scheduledAt}
                required
                class="w-full h-12 rounded-xl bg-white/10 border border-white/20 px-4 text-sm text-white focus:outline-none focus:border-[var(--yellow)] transition"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              class="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-2xl bg-[var(--yellow)] hover:bg-[var(--yellow-soft)] text-brand-ink font-bold text-sm shadow-xl transition cursor-pointer disabled:opacity-40"
            >
              Confirmar agendamento →
            </button>
          </form>
        {:else}
          <div class="space-y-2 pt-2">
            <p class="text-xs text-white/60 leading-relaxed">
              O agendamento de provas presenciais/finais exige que todos os documentos estejam validados e período mínimo pedagógico de 60 dias desde a confirmação do pagamento da matrícula.
            </p>
            {#if me.exam_available_at}
              <p class="text-xs font-semibold text-[var(--yellow)]">Prazo mínimo estimado: {dateLabel(me.exam_available_at)}.</p>
            {/if}
          </div>
        {/if}
      </Card>
    {/if}
  {/if}
</section>
