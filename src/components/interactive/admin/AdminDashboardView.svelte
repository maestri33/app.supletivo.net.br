<script lang="ts">
  import { onMount } from "svelte";
  import {
    getAdminPayments,
    getAdminPaymentsSummary,
    getAdminStudentDetail,
    getAdminStudents,
    getErrorMessage,
    markAdminPaymentRefunded,
    recheckAdminPayment,
    type AdminPaymentItem,
    type AdminPaymentsSummaryResponse,
    type AdminStudentDetailResponse,
    type AdminStudentListItem,
  } from "@/lib/api";
  import { dateTimeLabel, STUDENT_STATUS_LABELS } from "@/components/interactive/student/workflow";
  import AdminNav from "@/components/interactive/admin/AdminNav.svelte";
  import PrivateMediaPreview from "@/components/interactive/admin/PrivateMediaPreview.svelte";
  import { Alert, Badge, Card, Modal } from "@/components/ui";

  let loading = $state(true);
  let busy = $state(false);
  let error = $state("");
  let notice = $state("");

  let period = $state<"today" | "week" | "month" | "all">("all");
  let summary = $state<AdminPaymentsSummaryResponse["metrics"] | null>(null);

  let students = $state<AdminStudentListItem[]>([]);
  let studentsTotal = $state(0);
  let studentsPage = $state(1);
  let studentsTotalPages = $state(1);
  let search = $state("");
  let statusFilter = $state("");

  let payments = $state<AdminPaymentItem[]>([]);
  let selectedDetail = $state<AdminStudentDetailResponse["student"] | null>(null);
  let detailOpen = $state(false);

  let refundTargetId = $state<string | null>(null);
  let refundReason = $state("");
  let refundAction = $state<"revert_to_pending" | "cancel_enrollment">("revert_to_pending");

  async function loadDashboard() {
    const [sumRes, stdRes, payRes] = await Promise.all([
      getAdminPaymentsSummary(period),
      getAdminStudents({
        page: studentsPage,
        limit: 15,
        status: statusFilter || undefined,
        search: search.trim() || undefined,
      }),
      getAdminPayments({ page: 1, limit: 15 }).catch(() => null),
    ]);
    summary = sumRes.metrics;
    students = stdRes.items;
    studentsTotal = stdRes.total;
    studentsTotalPages = stdRes.total_pages;
    payments = payRes?.items ?? [];
  }

  onMount(async () => {
    try {
      await loadDashboard();
    } catch (err) {
      error = getErrorMessage(err);
    } finally {
      loading = false;
    }
  });

  async function runBusy(work: () => Promise<void>, clearNotice = false) {
    busy = true;
    error = "";
    if (clearNotice) notice = "";
    try {
      await work();
    } catch (err) {
      error = getErrorMessage(err);
    } finally {
      busy = false;
    }
  }

  function applyFilters(event?: Event) {
    event?.preventDefault();
    studentsPage = 1;
    return runBusy(loadDashboard);
  }

  function changePage(nextPage: number) {
    if (nextPage < 1 || nextPage > studentsTotalPages) return;
    studentsPage = nextPage;
    return runBusy(loadDashboard);
  }

  function openStudentDetail(roleId: string) {
    return runBusy(async () => {
      const res = await getAdminStudentDetail(roleId);
      selectedDetail = res.student;
      detailOpen = true;
    });
  }

  function handleRecheckPayment(paymentId: string) {
    return runBusy(async () => {
      const res = await recheckAdminPayment(paymentId);
      notice = res.message || `Pagamento atualizado para ${res.status}.`;
      await loadDashboard();
    }, true);
  }

  async function handleMarkRefunded(event: Event) {
    event.preventDefault();
    if (!refundTargetId || refundReason.trim().length < 3) {
      error = "Informe o motivo do estorno (mínimo 3 caracteres).";
      return;
    }
    const targetId = refundTargetId;
    await runBusy(async () => {
      const res = await markAdminPaymentRefunded(targetId, {
        refund_reason: refundReason.trim(),
        refund_action: refundAction,
      });
      notice = res.message || "Estorno registrado.";
      refundTargetId = null;
      refundReason = "";
      await loadDashboard();
    }, true);
  }
</script>

<section class="mx-auto max-w-6xl px-4 pb-28 pt-6 space-y-5">
  <header class="space-y-2">
    <Badge variant="info">Secretaria Central</Badge>
    <h1 class="text-2xl font-extrabold tracking-tight text-[#0b1220]">
      Painel Administrativo
    </h1>
    <AdminNav active="dashboard" />
  </header>

  {#if error}
    <Alert variant="error" title="Erro">{error}</Alert>
  {/if}
  {#if notice}
    <Alert variant="success">{notice}</Alert>
  {/if}

  {#if loading}
    <Card class="p-6"><p class="text-sm text-slate-500">Carregando indicadores e alunos...</p></Card>
  {:else}
    {#if summary}
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="text-sm font-bold uppercase tracking-wide text-slate-600">Resumo Financeiro (InfinitePay)</h2>
        <select
          bind:value={period}
          onchange={() => applyFilters()}
          class="min-h-10 rounded-xl border border-black/15 bg-white px-3 text-xs font-bold text-[#0b1220]"
        >
          <option value="all">Todo o período</option>
          <option value="month">Últimos 30 dias</option>
          <option value="week">Últimos 7 dias</option>
          <option value="today">Hoje</option>
        </select>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card class="p-4">
          <p class="text-xs font-bold uppercase text-slate-500">Receita confirmada</p>
          <p class="mt-1 text-2xl font-black text-[#00734d]">{summary.total_revenue}</p>
          <p class="text-xs text-slate-600">{summary.total_paid_count} matrículas pagas</p>
        </Card>
        <Card class="p-4">
          <p class="text-xs font-bold uppercase text-slate-500">Pagamentos pendentes</p>
          <p class="mt-1 text-2xl font-black text-[#0b1220]">{summary.total_pending_count}</p>
          <p class="text-xs text-slate-600">Aguardando compensação</p>
        </Card>
        <Card class="p-4">
          <p class="text-xs font-bold uppercase text-slate-500">Estornos</p>
          <p class="mt-1 text-2xl font-black text-red-700">{summary.total_refunded_amount}</p>
          <p class="text-xs text-slate-600">{summary.total_refunded_count} estornados</p>
        </Card>
        <Card class="p-4">
          <p class="text-xs font-bold uppercase text-slate-500">Total de alunos filtrados</p>
          <p class="mt-1 text-2xl font-black text-[#002776]">{studentsTotal}</p>
          <p class="text-xs text-slate-600">Página {studentsPage} de {Math.max(1, studentsTotalPages)}</p>
        </Card>
      </div>
    {/if}

    <Card class="p-4 sm:p-5 space-y-4">
      <form onsubmit={applyFilters} class="grid gap-3 sm:grid-cols-4">
        <input
          type="search"
          bind:value={search}
          placeholder="Buscar por nome, CPF ou telefone"
          class="min-h-11 rounded-xl border border-black/15 bg-white px-3.5 text-sm sm:col-span-2"
        />
        <select
          bind:value={statusFilter}
          class="min-h-11 rounded-xl border border-black/15 bg-white px-3 text-sm"
        >
          <option value="">Todos os status</option>
          {#each Object.entries(STUDENT_STATUS_LABELS) as [key, label]}
            {#if ["lead", "payment_pending", "pre_enrolled", "enrolled", "exam_scheduled", "awaiting_pickup", "graduated", "cancelled"].includes(key)}
              <option value={key}>{label}</option>
            {/if}
          {/each}
        </select>
        <button
          type="submit"
          disabled={busy}
          class="min-h-11 rounded-xl bg-[#0b1220] px-4 text-sm font-bold text-white hover:opacity-95 disabled:opacity-50"
        >
          {busy ? "Filtrando..." : "Buscar"}
        </button>
      </form>

      {#if !students.length}
        <p class="text-sm text-slate-500 py-4">Nenhum aluno encontrado para os filtros atuais.</p>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs sm:text-sm">
            <thead class="border-b border-black/10 text-xs uppercase text-slate-500">
              <tr>
                <th class="py-2 pr-3">Aluno</th>
                <th class="py-2 pr-3">CPF / Tel</th>
                <th class="py-2 pr-3">Status</th>
                <th class="py-2 pr-3">Docs Pend.</th>
                <th class="py-2 pr-3">SIGA</th>
                <th class="py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-black/5">
              {#each students as s}
                <tr>
                  <td class="py-3 pr-3 font-semibold text-[#0b1220]">
                    {s.full_name || s.name || "Sem nome"}
                    {#if s.email}<p class="text-xs font-normal text-slate-500">{s.email}</p>{/if}
                  </td>
                  <td class="py-3 pr-3 font-mono text-xs text-slate-700">
                    <p>{s.cpf || "—"}</p>
                    <p>{s.phone}</p>
                  </td>
                  <td class="py-3 pr-3">
                    <Badge variant={s.status === "graduated" || s.status === "enrolled" ? "success" : "info"}>
                      {STUDENT_STATUS_LABELS[s.status] ?? s.status}
                    </Badge>
                    {#if s.substatus}
                      <p class="mt-0.5 text-[11px] text-slate-500">
                        {STUDENT_STATUS_LABELS[s.substatus] ?? s.substatus}
                      </p>
                    {/if}
                  </td>
                  <td class="py-3 pr-3 font-bold text-slate-700">{s.pending_docs_count}</td>
                  <td class="py-3 pr-3">
                    <Badge variant={s.has_siga ? "success" : "default"}>
                      {s.has_siga ? "Emitido" : "Pendente"}
                    </Badge>
                  </td>
                  <td class="py-3 text-right">
                    <button
                      type="button"
                      onclick={() => openStudentDetail(s.role_id)}
                      class="min-h-9 rounded-lg border border-black/15 px-3 text-xs font-bold text-[#002776] hover:bg-black/5"
                    >
                      Abrir ficha
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <div class="flex items-center justify-between pt-2 text-xs">
          <button
            type="button"
            onclick={() => changePage(studentsPage - 1)}
            disabled={studentsPage <= 1 || busy}
            class="min-h-9 rounded-lg border border-black/15 px-3 font-bold disabled:opacity-40"
          >
            Anterior
          </button>
          <span class="text-slate-600">Página {studentsPage} / {Math.max(1, studentsTotalPages)}</span>
          <button
            type="button"
            onclick={() => changePage(studentsPage + 1)}
            disabled={studentsPage >= studentsTotalPages || busy}
            class="min-h-9 rounded-lg border border-black/15 px-3 font-bold disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      {/if}
    </Card>

    <Card class="p-4 sm:p-5 space-y-3">
      <h2 class="text-base font-bold text-[#0b1220]">Últimas transações InfinitePay</h2>
      {#if !payments.length}
        <p class="text-sm text-slate-500">Nenhuma transação recente.</p>
      {:else}
        <div class="space-y-2">
          {#each payments as p}
            <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 p-3 text-xs">
              <div>
                <p class="font-bold text-[#0b1220]">
                  {p.student_name || p.student_phone || p.user_id} — {p.amount}
                </p>
                <p class="text-slate-600">
                  Status: <strong>{p.status}</strong> • Criado em {dateTimeLabel(p.created_at)}
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                {#if p.status === "pending"}
                  <button
                    type="button"
                    onclick={() => handleRecheckPayment(p.id)}
                    disabled={busy}
                    class="min-h-9 rounded-lg border border-[#00734d] px-3 font-bold text-[#00734d]"
                  >
                    Reconsultar
                  </button>
                {/if}
                {#if p.status === "paid"}
                  <button
                    type="button"
                    onclick={() => { refundTargetId = p.id; }}
                    disabled={busy}
                    class="min-h-9 rounded-lg border border-red-300 px-3 font-bold text-red-700"
                  >
                    Registrar estorno
                  </button>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </Card>
  {/if}

  <Modal
    isOpen={detailOpen}
    onClose={() => { detailOpen = false; selectedDetail = null; }}
    title="Ficha completa do aluno"
  >
    {#if selectedDetail}
      <div class="space-y-4 max-h-[75vh] overflow-y-auto pr-1 text-xs">
        <div class="rounded-xl border border-black/10 bg-[#f6f6f2] p-3 space-y-1 text-[#0b1220]">
          <p class="text-sm font-bold text-[#0b1220]">
            {selectedDetail.user.full_name || selectedDetail.user.name || "Sem nome"}
          </p>
          <p>CPF: {selectedDetail.user.cpf || "—"} • Tel: {selectedDetail.user.phone}</p>
          <p>E-mail: {selectedDetail.user.email || "—"} • Tipo sanguíneo: {selectedDetail.user.blood_type || "—"}</p>
          <p>
            Status: <strong>{STUDENT_STATUS_LABELS[selectedDetail.role.status] ?? selectedDetail.role.status}</strong>
            {#if selectedDetail.role.substatus} ({selectedDetail.role.substatus}){/if}
          </p>
        </div>

        <div class="space-y-2">
          <h3 class="font-bold text-white">Documentos enviados ({selectedDetail.documents.length})</h3>
          {#each selectedDetail.documents as doc}
            <div class="rounded-xl border border-black/10 bg-white p-3 space-y-2 text-[#0b1220]">
              <div class="flex items-center justify-between gap-2">
                <span class="font-bold text-[#0b1220]">{doc.doc_type}</span>
                <Badge variant={doc.status === "approved" ? "success" : doc.status === "rejected" ? "error" : "info"}>
                  {doc.status}
                </Badge>
              </div>
              {#if doc.rejection_reason}
                <p class="text-red-700">Rejeição: {doc.rejection_reason}</p>
              {/if}
              {#if doc.file_url || doc.r2_key}
                <PrivateMediaPreview path={doc.file_url || doc.r2_key} alt={doc.doc_type} compact />
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </Modal>

  <Modal
    isOpen={refundTargetId !== null}
    onClose={() => { refundTargetId = null; refundReason = ""; }}
    title="Registrar estorno de pagamento"
  >
    <form onsubmit={handleMarkRefunded} class="space-y-4">
      <div>
        <label for="refund-reason" class="mb-1 block text-xs font-bold text-white/80">Motivo do estorno</label>
        <input
          id="refund-reason"
          type="text"
          bind:value={refundReason}
          required
          minlength="3"
          placeholder="Ex.: Desistência antes da emissão SIGA"
          class="min-h-11 w-full rounded-xl border border-black/15 bg-white px-3 text-sm text-[#0b1220]"
        />
      </div>
      <div>
        <label for="refund-action" class="mb-1 block text-xs font-bold text-white/80">Ação na matrícula</label>
        <select id="refund-action" bind:value={refundAction} class="min-h-11 w-full rounded-xl border border-black/15 bg-white px-3 text-sm text-[#0b1220]">
          <option value="revert_to_pending">Voltar para aguardando pagamento</option>
          <option value="cancel_enrollment">Cancelar matrícula</option>
        </select>
      </div>
      <div class="flex justify-end gap-2">
        <button type="button" onclick={() => { refundTargetId = null; }} class="min-h-10 rounded-xl border border-white/20 px-4 text-xs font-bold text-white hover:bg-white/10">
          Cancelar
        </button>
        <button type="submit" disabled={busy} class="min-h-10 rounded-xl bg-red-700 px-4 text-xs font-bold text-white">
          {busy ? "Registrando..." : "Confirmar estorno"}
        </button>
      </div>
    </form>
  </Modal>
</section>
