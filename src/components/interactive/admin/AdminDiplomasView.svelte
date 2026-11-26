<script lang="ts">
  import { onMount } from "svelte";
  import {
    getAdminStudentDiploma,
    getAdminStudents,
    getErrorMessage,
    issueAdminDiploma,
    pickupAdminDiploma,
    type AdminStudentListItem,
  } from "@/lib/api";
  import { compressImage } from "@/lib/image-compression";
  import {
    dateLabel,
    dateTimeLabel,
    documentFileError,
    imageError,
    STUDENT_STATUS_LABELS,
  } from "@/components/interactive/student/workflow";
  import AdminNav from "@/components/interactive/admin/AdminNav.svelte";
  import PrivateMediaPreview from "@/components/interactive/admin/PrivateMediaPreview.svelte";
  import { Alert, Badge, Card } from "@/components/ui";

  let loading = $state(true);
  let busy = $state(false);
  let error = $state("");
  let notice = $state("");

  let search = $state("");
  let statusFilter = $state("");
  let students = $state<AdminStudentListItem[]>([]);
  let selectedStudent = $state<AdminStudentListItem | null>(null);

  type DiplomaDetail = Awaited<ReturnType<typeof getAdminStudentDiploma>>;
  let diplomaDetail = $state<DiplomaDetail | null>(null);

  let registrationNumber = $state("");
  let processNumber = $state("");
  let officialGazetteDate = $state("");
  let diplomaFile = $state<File | null>(null);
  let transcriptFile = $state<File | null>(null);

  async function loadStudents() {
    const res = await getAdminStudents({
      limit: 25,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
    });
    students = res.items ?? [];
  }

  async function selectStudent(st: AdminStudentListItem) {
    selectedStudent = st;
    error = "";
    notice = "";
    busy = true;
    try {
      const detail = await getAdminStudentDiploma(st.role_id);
      diplomaDetail = detail;
      registrationNumber = detail.diploma?.registration_number ?? "";
      processNumber = detail.diploma?.process_number ?? "";
      officialGazetteDate = detail.diploma?.official_gazette_date ?? "";
      diplomaFile = null;
      transcriptFile = null;
    } catch (err) {
      error = getErrorMessage(err);
      diplomaDetail = null;
    } finally {
      busy = false;
    }
  }

  onMount(async () => {
    try {
      await loadStudents();
    } catch (err) {
      error = getErrorMessage(err);
    } finally {
      loading = false;
    }
  });

  function readValidatedPdf(event: Event): File | null {
    const input = event.currentTarget as HTMLInputElement;
    const f = input.files?.[0] ?? null;
    if (f) {
      const err = documentFileError(f);
      if (err) {
        error = err;
        input.value = "";
        return null;
      }
    }
    return f;
  }

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

  async function handleIssueDiploma(event: Event) {
    event.preventDefault();
    if (!selectedStudent) return;
    const target = selectedStudent;
    await runBusy(async () => {
      const fd = new FormData();
      if (registrationNumber.trim()) fd.set("registration_number", registrationNumber.trim());
      if (processNumber.trim()) fd.set("process_number", processNumber.trim());
      if (officialGazetteDate.trim()) fd.set("official_gazette_date", officialGazetteDate.trim());
      if (diplomaFile) fd.set("diploma", diplomaFile);
      if (transcriptFile) fd.set("transcript", transcriptFile);

      const res = await issueAdminDiploma(target.role_id, fd);
      notice = res.message || "Diploma e histórico registrados com sucesso.";
      await Promise.all([selectStudent(target), loadStudents()]);
    });
  }

  async function handlePickupPhoto(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const rawFile = input.files?.[0];
    input.value = "";
    if (!rawFile || !selectedStudent) return;

    const validationError = imageError(rawFile);
    if (validationError) {
      error = validationError;
      return;
    }

    const target = selectedStudent;
    await runBusy(async () => {
      const compressed = await compressImage(rawFile, { maxSizeMB: 2 });
      const postErr = imageError(compressed);
      if (postErr) throw new Error(postErr);

      const res = await pickupAdminDiploma(target.role_id, compressed);
      notice = res.message || "Retirada do diploma registrada.";
      await Promise.all([selectStudent(target), loadStudents()]);
    });
  }
</script>

<section class="mx-auto max-w-6xl px-4 pb-28 pt-6 space-y-5">
  <header class="space-y-2">
    <Badge variant="info">Conclusão & Certificação</Badge>
    <h1 class="text-2xl font-extrabold tracking-tight text-[#0b1220]">
      Diplomas, Históricos e Entregas
    </h1>
    <AdminNav active="diplomas" />
  </header>

  {#if error}
    <Alert variant="error" title="Erro">{error}</Alert>
  {/if}
  {#if notice}
    <Alert variant="success">{notice}</Alert>
  {/if}

  {#if loading}
    <Card class="p-6"><p class="text-sm text-slate-500">Carregando alunos...</p></Card>
  {:else}
    <div class="grid gap-5 lg:grid-cols-2">
      <Card class="p-4 sm:p-5 space-y-3">
        <form
          onsubmit={async (e) => {
            e.preventDefault();
            busy = true;
            try { await loadStudents(); } catch (err) { error = getErrorMessage(err); } finally { busy = false; }
          }}
          class="flex flex-wrap gap-2"
        >
          <input
            type="search"
            bind:value={search}
            placeholder="Nome ou CPF"
            class="min-h-10 flex-1 rounded-xl border border-black/15 px-3 text-xs"
          />
          <select bind:value={statusFilter} class="min-h-10 rounded-xl border border-black/15 px-3 text-xs">
            <option value="">Todos</option>
            <option value="academic_ready">Aguardando emissão</option>
            <option value="graduated">Concluintes</option>
          </select>
          <button type="submit" class="min-h-10 rounded-xl bg-[#0b1220] px-4 text-xs font-bold text-white">
            Buscar
          </button>
        </form>

        <div class="space-y-2 max-h-[540px] overflow-y-auto pr-1">
          {#each students as st}
            <button
              type="button"
              onclick={() => selectStudent(st)}
              class={`w-full rounded-xl border p-3 text-left transition ${
                selectedStudent?.role_id === st.role_id
                  ? "border-[#002776] bg-[#002776]/5"
                  : "border-black/10 hover:bg-black/5"
              }`}
            >
              <div class="flex items-center justify-between gap-2">
                <span class="text-sm font-bold text-[#0b1220]">{st.full_name || st.name || st.phone}</span>
                <Badge variant={st.status === "graduated" ? "success" : "info"}>
                  {STUDENT_STATUS_LABELS[st.status] ?? st.status}
                </Badge>
              </div>
              <p class="text-xs text-slate-600 mt-0.5">CPF {st.cpf || "—"} • {st.phone}</p>
            </button>
          {/each}
        </div>
      </Card>

      <Card class="p-4 sm:p-5 space-y-4">
        {#if !selectedStudent || !diplomaDetail}
          <p class="text-sm text-slate-500">
            Selecione um aluno ao lado para emitir os PDFs oficiais ou registrar a foto de entrega do diploma.
          </p>
        {:else}
          <div class="border-b border-black/10 pb-3">
            <h2 class="text-base font-bold text-[#0b1220]">
              {diplomaDetail.user.full_name || diplomaDetail.user.name || diplomaDetail.user.phone}
            </h2>
            <p class="text-xs text-slate-600">
              Status atual: <strong>{STUDENT_STATUS_LABELS[diplomaDetail.role.status] ?? diplomaDetail.role.status}</strong>
              {#if diplomaDetail.role.substatus} ({diplomaDetail.role.substatus}){/if}
            </p>
          </div>

          <form onsubmit={handleIssueDiploma} class="space-y-3">
            <h3 class="text-xs font-bold uppercase text-slate-500">Expedição e arquivos oficiais (PDF)</h3>
            <div class="grid gap-3 sm:grid-cols-3">
              <div>
                <label for="dip-reg" class="mb-1 block text-[11px] font-bold text-slate-600">Nº Registro</label>
                <input id="dip-reg" type="text" bind:value={registrationNumber} class="min-h-10 w-full rounded-xl border border-black/15 px-3 text-xs" />
              </div>
              <div>
                <label for="dip-proc" class="mb-1 block text-[11px] font-bold text-slate-600">Nº Processo</label>
                <input id="dip-proc" type="text" bind:value={processNumber} class="min-h-10 w-full rounded-xl border border-black/15 px-3 text-xs" />
              </div>
              <div>
                <label for="dip-gazette" class="mb-1 block text-[11px] font-bold text-slate-600">Data D.O.</label>
                <input id="dip-gazette" type="date" bind:value={officialGazetteDate} class="min-h-10 w-full rounded-xl border border-black/15 px-3 text-xs" />
              </div>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <label for="dip-pdf" class="mb-1 block text-[11px] font-bold text-slate-600">PDF do Diploma (até 10 MB)</label>
                <input
                  id="dip-pdf"
                  type="file"
                  accept="application/pdf"
                  onchange={(e) => { diplomaFile = readValidatedPdf(e); }}
                  class="block w-full text-xs text-slate-600"
                />
              </div>
              <div>
                <label for="trans-pdf" class="mb-1 block text-[11px] font-bold text-slate-600">PDF do Histórico (até 10 MB)</label>
                <input
                  id="trans-pdf"
                  type="file"
                  accept="application/pdf"
                  onchange={(e) => { transcriptFile = readValidatedPdf(e); }}
                  class="block w-full text-xs text-slate-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              class="min-h-11 w-full rounded-xl bg-[#00734d] px-4 text-xs font-bold text-white disabled:opacity-50"
            >
              {busy ? "Salvando emissão..." : "Salvar emissão de diploma / histórico"}
            </button>
          </form>

          {#if diplomaDetail.diploma}
            <div class="space-y-3 border-t border-black/10 pt-3 text-xs">
              <p>
                Emitido em: <strong>{diplomaDetail.diploma.issued_at ? dateTimeLabel(diplomaDetail.diploma.issued_at) : "—"}</strong>
                • Retirado em: <strong>{diplomaDetail.diploma.picked_up_at ? dateLabel(diplomaDetail.diploma.picked_up_at) : "Aguardando retirada"}</strong>
              </p>

              <div class="grid gap-3 sm:grid-cols-2">
                <div>
                  <p class="font-bold text-[#0b1220] mb-1">Diploma emitido</p>
                  <PrivateMediaPreview path={diplomaDetail.diploma.diploma_file_key} alt="Diploma PDF" compact />
                </div>
                <div>
                  <p class="font-bold text-[#0b1220] mb-1">Histórico emitido</p>
                  <PrivateMediaPreview path={diplomaDetail.diploma.transcript_file_key} alt="Histórico PDF" compact />
                </div>
              </div>

              <div class="space-y-2 pt-2">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <p class="font-bold text-[#0b1220]">Comprovante presencial de retirada (foto)</p>
                  <label class="min-h-9 inline-flex cursor-pointer items-center rounded-lg bg-[#002776] px-3 text-xs font-bold text-white">
                    <span>Registrar retirada com foto</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onchange={handlePickupPhoto}
                      disabled={busy}
                      class="sr-only"
                    />
                  </label>
                </div>
                {#if diplomaDetail.diploma.pickup_photo_key}
                  <PrivateMediaPreview path={diplomaDetail.diploma.pickup_photo_key} alt="Foto da entrega do diploma" compact />
                {/if}
              </div>
            </div>
          {/if}
        {/if}
      </Card>
    </div>
  {/if}
</section>
