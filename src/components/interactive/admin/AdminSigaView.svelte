<script lang="ts">
  import { onMount } from "svelte";
  import {
    getAdminEnrollments,
    getErrorMessage,
    registerAdminSigaCredentials,
    type AdminEnrollmentItem,
  } from "@/lib/api";
  import AdminNav from "@/components/interactive/admin/AdminNav.svelte";
  import { Alert, Badge, Card, Modal } from "@/components/ui";

  let loading = $state(true);
  let busy = $state(false);
  let error = $state("");
  let notice = $state("");

  let readyOnly = $state(true);
  let enrollments = $state<AdminEnrollmentItem[]>([]);
  let targetStudent = $state<AdminEnrollmentItem | null>(null);
  let sigaUsername = $state("");
  let sigaPassword = $state("");
  let sigaUrl = $state("");

  async function loadList() {
    const res = await getAdminEnrollments({
      limit: 30,
      ...(readyOnly ? { ready_for_siga: "true" } : {}),
    });
    enrollments = res.items ?? [];
  }

  onMount(async () => {
    try {
      await loadList();
    } catch (err) {
      error = getErrorMessage(err);
    } finally {
      loading = false;
    }
  });

  function openModal(item: AdminEnrollmentItem) {
    targetStudent = item;
    sigaUsername = item.cpf ? item.cpf.replace(/\D/g, "") : "";
    sigaPassword = "";
    sigaUrl = "";
    error = "";
  }

  async function handleSubmitSiga(event: Event) {
    event.preventDefault();
    if (!targetStudent || !sigaUsername.trim() || !sigaPassword.trim()) {
      error = "Preencha usuário e senha do SIGA.";
      return;
    }
    busy = true;
    error = "";
    notice = "";
    try {
      const res = await registerAdminSigaCredentials({
        student_role_id: targetStudent.role_id,
        siga_username: sigaUsername.trim(),
        siga_password: sigaPassword.trim(),
        ...(sigaUrl.trim() ? { siga_url: sigaUrl.trim() } : {}),
      });
      notice = res.message || `Credenciais SIGA registradas (${res.siga_username}).`;
      targetStudent = null;
      await loadList();
    } catch (err) {
      error = getErrorMessage(err);
    } finally {
      busy = false;
    }
  }
</script>

<section class="mx-auto max-w-5xl px-4 pb-28 pt-6 space-y-5">
  <header class="space-y-2">
    <Badge variant="info">Emissão de Portal</Badge>
    <h1 class="text-2xl font-extrabold tracking-tight text-[#0b1220]">
      Credenciais SIGA
    </h1>
    <AdminNav active="credenciais-siga" />
  </header>

  {#if error}
    <Alert variant="error" title="Erro">{error}</Alert>
  {/if}
  {#if notice}
    <Alert variant="success">{notice}</Alert>
  {/if}

  <div class="flex flex-wrap items-center justify-between gap-2">
    <label class="flex items-center gap-2 text-xs font-bold text-[#0b1220]">
      <input
        type="checkbox"
        checked={readyOnly}
        onchange={async (e) => {
          readyOnly = (e.currentTarget as HTMLInputElement).checked;
          loading = true;
          try { await loadList(); } catch (err) { error = getErrorMessage(err); } finally { loading = false; }
        }}
        class="h-4 w-4 accent-[#00734d]"
      />
      <span>Mostrar apenas alunos prontos para SIGA (5 docs básicos enviados + 1ª parcela confirmada)</span>
    </label>
  </div>

  {#if loading}
    <Card class="p-6"><p class="text-sm text-slate-500">Carregando matrículas...</p></Card>
  {:else if !enrollments.length}
    <Card class="p-6"><p class="text-sm text-slate-500">Nenhum aluno encontrado nessa fila.</p></Card>
  {:else}
    <div class="space-y-3">
      {#each enrollments as item}
        <Card class="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          <div class="space-y-1.5">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-sm font-bold text-[#0b1220]">{item.full_name || item.name || item.phone}</h2>
              <Badge variant={item.ready_for_siga ? "success" : "warning"}>
                {item.ready_for_siga ? "Pronto para SIGA" : item.substatus || item.status}
              </Badge>
              {#if item.has_siga}
                <Badge variant="info">SIGA emitido</Badge>
              {/if}
            </div>
            <p class="text-xs text-slate-600">CPF: {item.cpf || "—"} • Tel: {item.phone}</p>
            <p class="text-[11px] text-slate-500">
              RG: {item.doc_statuses.rg ?? "—"} • Endereço: {item.doc_statuses.proof_of_residence ?? "—"} •
              Escolaridade: {item.doc_statuses.education_level ?? "—"} • Selfie: {item.doc_statuses.selfie ?? "—"} •
              1ª Taxa: {item.fee_1_status ?? "—"}
            </p>
          </div>

          <button
            type="button"
            onclick={() => openModal(item)}
            class="min-h-10 rounded-xl bg-[#00734d] px-4 text-xs font-bold text-white hover:opacity-95"
          >
            {item.has_siga ? "Atualizar SIGA" : "Emitir acesso SIGA"}
          </button>
        </Card>
      {/each}
    </div>
  {/if}

  <Modal
    isOpen={targetStudent !== null}
    onClose={() => { targetStudent = null; }}
    title="Cadastrar credenciais do SIGA"
  >
    <form onsubmit={handleSubmitSiga} class="space-y-4">
      <p class="text-xs text-white/80">
        Aluno: <strong class="text-white">{targetStudent?.full_name || targetStudent?.name || targetStudent?.phone}</strong>
      </p>
      <div>
        <label for="siga-user" class="mb-1 block text-xs font-bold text-white/80">Usuário (login SIGA)</label>
        <input
          id="siga-user"
          type="text"
          bind:value={sigaUsername}
          required
          class="min-h-11 w-full rounded-xl border border-black/15 bg-white px-3 text-sm text-[#0b1220]"
        />
      </div>
      <div>
        <label for="siga-pass" class="mb-1 block text-xs font-bold text-white/80">Senha inicial</label>
        <input
          id="siga-pass"
          type="text"
          bind:value={sigaPassword}
          required
          class="min-h-11 w-full rounded-xl border border-black/15 bg-white px-3 text-sm text-[#0b1220]"
        />
      </div>
      <div>
        <label for="siga-url" class="mb-1 block text-xs font-bold text-white/80">URL do portal (opcional)</label>
        <input
          id="siga-url"
          type="url"
          bind:value={sigaUrl}
          placeholder="https://..."
          class="min-h-11 w-full rounded-xl border border-black/15 bg-white px-3 text-sm text-[#0b1220]"
        />
      </div>
      <div class="flex justify-end gap-2">
        <button type="button" onclick={() => { targetStudent = null; }} class="min-h-10 rounded-xl border border-white/20 px-4 text-xs font-bold text-white hover:bg-white/10">
          Cancelar
        </button>
        <button type="submit" disabled={busy} class="min-h-10 rounded-xl bg-[#00734d] px-4 text-xs font-bold text-white">
          {busy ? "Salvando..." : "Salvar e liberar acesso"}
        </button>
      </div>
    </form>
  </Modal>
</section>
