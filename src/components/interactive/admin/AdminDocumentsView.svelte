<script lang="ts">
  import { onMount } from "svelte";
  import {
    approveAdminDocument,
    approveAdminStudentDocument,
    fastOkAdminDocument,
    getAdminPendingStudentDocuments,
    getAdminReviewDesk,
    getErrorMessage,
    rejectAdminDocument,
    rejectAdminStudentDocument,
    type AdminDocumentReviewDeskItem,
    type AdminPendingAcademicStudent,
  } from "@/lib/api";
  import { dateTimeLabel } from "@/components/interactive/student/workflow";
  import AdminNav from "@/components/interactive/admin/AdminNav.svelte";
  import PrivateMediaPreview from "@/components/interactive/admin/PrivateMediaPreview.svelte";
  import { Alert, Badge, Card, Modal } from "@/components/ui";

  let loading = $state(true);
  let busy = $state(false);
  let error = $state("");
  let notice = $state("");

  let activeTab = $state<"initial" | "academic">("initial");
  let deskItems = $state<AdminDocumentReviewDeskItem[]>([]);
  let academicStudents = $state<AdminPendingAcademicStudent[]>([]);

  let rejectModal = $state<{ id: string; kind: "initial" | "academic"; label: string } | null>(null);
  let rejectReason = $state("");

  async function loadQueues() {
    const [deskRes, acadRes] = await Promise.all([
      getAdminReviewDesk(),
      getAdminPendingStudentDocuments(),
    ]);
    deskItems = deskRes.documents ?? [];
    academicStudents = acadRes.students ?? [];
  }

  onMount(async () => {
    try {
      await loadQueues();
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

  function handleDecision(
    action: () => Promise<{ message?: string }>,
    fallbackNotice: string
  ) {
    return runBusy(async () => {
      const res = await action();
      notice = res.message || fallbackNotice;
      await loadQueues();
    });
  }

  async function submitReject(event: Event) {
    event.preventDefault();
    if (!rejectModal || rejectReason.trim().length < 3) {
      error = "Informe o motivo da reprovação para orientar o aluno.";
      return;
    }
    const modal = rejectModal;
    const reason = rejectReason.trim();
    await runBusy(async () => {
      if (modal.kind === "initial") {
        await rejectAdminDocument(modal.id, reason);
      } else {
        await rejectAdminStudentDocument(modal.id, reason);
      }
      notice = "Documento reprovado e aluno notificado para reenvio.";
      rejectModal = null;
      rejectReason = "";
      await loadQueues();
    });
  }
</script>

<section class="mx-auto max-w-5xl px-4 pb-28 pt-6 space-y-5">
  <header class="space-y-2">
    <Badge variant="info">Conferência Documental</Badge>
    <h1 class="text-2xl font-extrabold tracking-tight text-[#0b1220]">
      Mesa de Revisão de Documentos
    </h1>
    <AdminNav active="documentos" />
  </header>

  {#if error}
    <Alert variant="error" title="Erro">{error}</Alert>
  {/if}
  {#if notice}
    <Alert variant="success">{notice}</Alert>
  {/if}

  <div class="flex flex-wrap gap-2">
    <button
      type="button"
      onclick={() => { activeTab = "initial"; }}
      class={`min-h-10 rounded-xl px-4 text-xs font-bold ${
        activeTab === "initial" ? "bg-[#002776] text-white" : "bg-black/5 text-slate-700"
      }`}
    >
      Documentos iniciais ({deskItems.length})
    </button>
    <button
      type="button"
      onclick={() => { activeTab = "academic"; }}
      class={`min-h-10 rounded-xl px-4 text-xs font-bold ${
        activeTab === "academic" ? "bg-[#002776] text-white" : "bg-black/5 text-slate-700"
      }`}
    >
      Documentos pós-SIGA ({academicStudents.reduce((acc, s) => acc + s.pending_documents.length, 0)})
    </button>
  </div>

  {#if loading}
    <Card class="p-6"><p class="text-sm text-slate-500">Carregando fila de conferência...</p></Card>
  {:else if activeTab === "initial"}
    {#if !deskItems.length}
      <Card class="p-6"><p class="text-sm text-slate-500">Nenhum documento inicial pendente de revisão.</p></Card>
    {:else}
      <div class="grid gap-4 md:grid-cols-2">
        {#each deskItems as item}
          <Card class="p-4 sm:p-5 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 class="text-sm font-bold text-[#0b1220]">{item.student_name}</h2>
                <p class="text-xs text-slate-600">{item.student_cpf} • {item.student_phone}</p>
              </div>
              <Badge variant={item.fast_ok_eligible ? "success" : "warning"}>
                {item.document_type}
              </Badge>
            </div>

            <div class="text-xs text-slate-600 space-y-1">
              <p>Confiança IA: <strong>{Math.round((item.ai_confidence ?? 0) * 100)}%</strong> • Enviado em {dateTimeLabel(item.submitted_at)}</p>
              {#if item.divergences?.length}
                <p class="font-semibold text-amber-700">Divergências: {item.divergences.join("; ")}</p>
              {/if}
            </div>

            <PrivateMediaPreview path={item.file_url} alt={`Documento ${item.document_type}`} />

            <div class="flex flex-wrap gap-2 pt-1">
              {#if item.fast_ok_eligible}
                <button
                  type="button"
                  onclick={() => handleDecision(() => fastOkAdminDocument(item.id), "Documento aprovado via Fast OK.")}
                  disabled={busy}
                  class="min-h-10 rounded-xl bg-[#00734d] px-3.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  Fast OK
                </button>
              {/if}
              <button
                type="button"
                onclick={() => handleDecision(() => approveAdminDocument(item.id), "Documento aprovado.")}
                disabled={busy}
                class="min-h-10 rounded-xl bg-[#0b1220] px-3.5 text-xs font-bold text-white disabled:opacity-50"
              >
                Aprovar
              </button>
              <button
                type="button"
                onclick={() => { rejectModal = { id: item.id, kind: "initial", label: `${item.student_name} — ${item.document_type}` }; }}
                disabled={busy}
                class="min-h-10 rounded-xl border border-red-300 px-3.5 text-xs font-bold text-red-700 disabled:opacity-50"
              >
                Reprovar
              </button>
            </div>
          </Card>
        {/each}
      </div>
    {/if}
  {:else}
    {#if !academicStudents.length}
      <Card class="p-6"><p class="text-sm text-slate-500">Nenhum documento acadêmico pós-SIGA aguardando conferência.</p></Card>
    {:else}
      <div class="space-y-4">
        {#each academicStudents as st}
          <Card class="p-4 sm:p-5 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-3">
              <div>
                <h2 class="text-sm font-bold text-[#0b1220]">{st.student_name}</h2>
                <p class="text-xs text-slate-600">
                  CPF {st.cpf} • {st.phone} • Tipo sanguíneo: {st.blood_type || "—"}
                </p>
              </div>
              <Badge variant="info">{st.current_status}</Badge>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              {#each st.pending_documents as doc}
                <div class="rounded-xl border border-black/10 p-3 space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-[#0b1220]">{doc.document_type}</span>
                    <Badge variant="warning">{doc.status}</Badge>
                  </div>
                  <PrivateMediaPreview path={doc.file_url_temporary} alt={doc.document_type} compact />
                  <div class="flex gap-2">
                    <button
                      type="button"
                      onclick={() => handleDecision(() => approveAdminStudentDocument(doc.doc_id), "Documento acadêmico aprovado.")}
                      disabled={busy}
                      class="min-h-9 rounded-lg bg-[#00734d] px-3 text-xs font-bold text-white disabled:opacity-50"
                    >
                      Aprovar
                    </button>
                    <button
                      type="button"
                      onclick={() => { rejectModal = { id: doc.doc_id, kind: "academic", label: `${st.student_name} — ${doc.document_type}` }; }}
                      disabled={busy}
                      class="min-h-9 rounded-lg border border-red-300 px-3 text-xs font-bold text-red-700 disabled:opacity-50"
                    >
                      Reprovar
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          </Card>
        {/each}
      </div>
    {/if}
  {/if}

  <Modal
    isOpen={rejectModal !== null}
    onClose={() => { rejectModal = null; rejectReason = ""; }}
    title="Motivo da reprovação"
  >
    <form onsubmit={submitReject} class="space-y-4">
      <p class="text-xs text-white/80">{rejectModal?.label}</p>
      <div>
        <label for="reject-reason" class="mb-1 block text-xs font-bold text-white/80">
          Explique ao aluno o que precisa ser corrigido
        </label>
        <textarea
          id="reject-reason"
          rows="3"
          bind:value={rejectReason}
          required
          minlength="3"
          placeholder="Ex.: Foto cortada na parte inferior, envie o documento inteiro."
          class="w-full rounded-xl border border-black/15 bg-white p-3 text-sm text-[#0b1220]"
        ></textarea>
      </div>
      <div class="flex justify-end gap-2">
        <button type="button" onclick={() => { rejectModal = null; }} class="min-h-10 rounded-xl border border-white/20 px-4 text-xs font-bold text-white hover:bg-white/10">
          Cancelar
        </button>
        <button type="submit" disabled={busy} class="min-h-10 rounded-xl bg-red-700 px-4 text-xs font-bold text-white">
          {busy ? "Reprovando..." : "Confirmar reprovação"}
        </button>
      </div>
    </form>
  </Modal>
</section>
