<script lang="ts">
  import { onMount } from "svelte";
  import {
    decodeAdminFeeQr,
    getAdminEnrollments,
    getAdminFeesByEnrollment,
    getErrorMessage,
    payAdminFirstFee,
    reconcileAdminFee,
    scheduleAdminSecondFee,
    type AdminEnrollmentItem,
    type DecodedPixQrPlan,
    type PartnerFeeRecord,
  } from "@/lib/api";
  import { formatBRL } from "@/lib/money";
  import { dateTimeLabel } from "@/components/interactive/student/workflow";
  import AdminNav from "@/components/interactive/admin/AdminNav.svelte";
  import { Alert, Badge, Card } from "@/components/ui";

  let loading = $state(true);
  let busy = $state(false);
  let error = $state("");
  let notice = $state("");

  let enrollments = $state<AdminEnrollmentItem[]>([]);
  let search = $state("");
  let selectedEnrollment = $state<AdminEnrollmentItem | null>(null);
  let fees = $state<PartnerFeeRecord[]>([]);

  let qrPayload = $state("");
  let decodedQr = $state<DecodedPixQrPlan | null>(null);
  let scheduleDate = $state("");

  async function loadEnrollments() {
    const res = await getAdminEnrollments({
      limit: 25,
      ...(search.trim() ? { search: search.trim() } : {}),
    });
    enrollments = res.items ?? [];
  }

  async function loadFees(enrollmentId: string) {
    const res = await getAdminFeesByEnrollment(enrollmentId);
    fees = Array.isArray(res) ? res : res.fees ?? [];
  }

  onMount(async () => {
    try {
      await loadEnrollments();
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

  function handleSelectEnrollment(item: AdminEnrollmentItem) {
    selectedEnrollment = item;
    decodedQr = null;
    qrPayload = "";
    return runBusy(() => loadFees(item.role_id));
  }

  function handleDecodeQr() {
    if (!qrPayload.trim()) {
      error = "Cole o código Pix Copia e Cola gerado pela instituição parceira.";
      return;
    }
    return runBusy(async () => {
      try {
        decodedQr = await decodeAdminFeeQr(qrPayload.trim());
      } catch (err) {
        decodedQr = null;
        throw err;
      }
    });
  }

  function handlePayFirst() {
    if (!selectedEnrollment || !qrPayload.trim()) return;
    const enrollmentId = selectedEnrollment.role_id;
    return runBusy(async () => {
      await payAdminFirstFee(enrollmentId, qrPayload.trim());
      notice = "1ª parcela da taxa parceira enviada via Asaas PIX!";
      qrPayload = "";
      decodedQr = null;
      await Promise.all([loadFees(enrollmentId), loadEnrollments()]);
    });
  }

  function handleScheduleSecond() {
    if (!selectedEnrollment || !qrPayload.trim()) return;
    const enrollmentId = selectedEnrollment.role_id;
    return runBusy(async () => {
      await scheduleAdminSecondFee(
        enrollmentId,
        qrPayload.trim(),
        scheduleDate.trim() || undefined
      );
      notice = "2ª parcela da taxa parceira agendada via Asaas PIX!";
      qrPayload = "";
      decodedQr = null;
      scheduleDate = "";
      await Promise.all([loadFees(enrollmentId), loadEnrollments()]);
    });
  }

  function handleReconcile(feeId: string) {
    if (!selectedEnrollment) return;
    const enrollmentId = selectedEnrollment.role_id;
    return runBusy(async () => {
      const updated = await reconcileAdminFee(feeId);
      notice = `Parcela atualizada para status: ${updated.status}.`;
      await Promise.all([loadFees(enrollmentId), loadEnrollments()]);
    });
  }
</script>

<section class="mx-auto max-w-6xl px-4 pb-28 pt-6 space-y-5">
  <header class="space-y-2">
    <Badge variant="info">Saída Administrativa Asaas PIX</Badge>
    <h1 class="text-2xl font-extrabold tracking-tight text-white">
      Taxa da Instituição Parceira
    </h1>
    <AdminNav active="taxa-parceira" />
  </header>

  {#if error}
    <Alert variant="danger" title="Erro">{error}</Alert>
  {/if}
  {#if notice}
    <Alert variant="success">{notice}</Alert>
  {/if}

  {#if loading}
    <Card class="p-6"><p class="text-sm text-white/75">Carregando matrículas...</p></Card>
  {:else}
    <div class="grid gap-5 lg:grid-cols-2">
      <Card class="p-4 sm:p-5 space-y-3">
        <form
          onsubmit={async (e) => {
            e.preventDefault();
            busy = true;
            try { await loadEnrollments(); } catch (err) { error = getErrorMessage(err); } finally { busy = false; }
          }}
          class="flex gap-2"
        >
          <input
            type="search"
            bind:value={search}
            placeholder="Filtrar aluno por nome ou CPF"
            class="min-h-10 flex-1 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white placeholder-white/40 focus:border-[var(--yellow)] focus:outline-none"
          />
          <button type="submit" class="min-h-10 rounded-xl bg-[#ffc400] px-4 text-xs font-extrabold text-[#0b1220] hover:brightness-95">
            Buscar
          </button>
        </form>

        <div class="space-y-2 max-h-[540px] overflow-y-auto pr-1">
          {#each enrollments as item}
            <button
              type="button"
              onclick={() => handleSelectEnrollment(item)}
              class={`w-full rounded-xl border p-3 text-left transition ${
                selectedEnrollment?.role_id === item.role_id
                  ? "border-[var(--yellow)]/60 bg-[var(--yellow)]/10"
                  : "border-white/15 bg-white/5 hover:bg-white/10"
              }`}
            >
              <div class="flex items-center justify-between gap-2">
                <span class="text-sm font-bold text-white">{item.full_name || item.name || item.phone}</span>
                <span class="text-[11px] font-semibold text-white/75">
                  P1: {item.fee_1_status ?? "—"} | P2: {item.fee_2_status ?? "—"}
                </span>
              </div>
              <p class="text-xs text-white/75 mt-0.5">CPF {item.cpf || "—"} • {item.status}</p>
            </button>
          {/each}
        </div>
      </Card>

      <Card class="p-4 sm:p-5 space-y-4">
        {#if !selectedEnrollment}
          <p class="text-sm text-white/60">
            Selecione um aluno ao lado para conferir ou pagar as 2 parcelas da taxa parceira.
          </p>
        {:else}
          <div class="border-b border-white/15 pb-3">
            <h2 class="text-base font-bold text-white">
              {selectedEnrollment.full_name || selectedEnrollment.name || selectedEnrollment.phone}
            </h2>
            <p class="text-xs text-white/75">ID Matrícula: {selectedEnrollment.role_id}</p>
          </div>

          <div class="space-y-2">
            <h3 class="text-xs font-bold uppercase text-white/60">Parcelas registradas</h3>
            {#if !fees.length}
              <p class="text-xs text-white/60">Nenhuma parcela paga ou agendada ainda.</p>
            {:else}
              {#each fees as fee}
                <div class="rounded-xl border border-white/15 bg-white/5 p-3 text-xs flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p class="font-bold text-white">
                      Parcela {fee.installment_number} — {formatBRL(fee.amount_cents / 100)}
                    </p>
                    <p class="text-white/75">
                      Status: <strong class="text-white">{fee.status}</strong>
                      {#if fee.paid_at} • Paga em {dateTimeLabel(fee.paid_at)}{/if}
                      {#if fee.due_date} • Vencimento: {fee.due_date}{/if}
                    </p>
                    {#if fee.last_error}
                      <p class="text-rose-300 mt-0.5">{fee.last_error}</p>
                    {/if}
                  </div>
                  <div class="flex gap-2">
                    <button
                      type="button"
                      onclick={() => handleReconcile(fee.id)}
                      disabled={busy}
                      class="min-h-9 rounded-lg border border-white/20 bg-white/5 px-3 font-bold text-sky-300 hover:bg-white/10 disabled:opacity-50"
                    >
                      Reconciliar
                    </button>
                  </div>
                </div>
              {/each}
            {/if}
          </div>

          <div class="space-y-3 border-t border-white/15 pt-3">
            <label for="fee-qr" class="block text-xs font-bold uppercase text-white/75">
              Pix Copia e Cola da instituição parceira (Asaas)
            </label>
            <textarea
              id="fee-qr"
              rows="3"
              bind:value={qrPayload}
              placeholder="000201..."
              class="w-full rounded-xl border border-white/20 bg-white/5 p-3 font-mono text-xs text-white placeholder-white/40 focus:border-[var(--yellow)] focus:outline-none"
            ></textarea>

            <div class="flex flex-wrap items-end gap-2">
              <button
                type="button"
                onclick={handleDecodeQr}
                disabled={busy}
                class="min-h-10 rounded-xl border border-sky-400/40 bg-sky-500/10 px-4 text-xs font-bold text-sky-200 hover:bg-sky-500/20 disabled:opacity-50"
              >
                Decodificar QR Code
              </button>
              <div class="flex-1 min-w-[160px]">
                <label for="fee-schedule-date" class="mb-1 block text-[11px] font-bold text-white/60">
                  Data agendamento 2ª parcela (opcional)
                </label>
                <input
                  id="fee-schedule-date"
                  type="date"
                  bind:value={scheduleDate}
                  class="min-h-10 w-full rounded-xl border border-white/20 bg-white/5 px-3 text-xs text-white [color-scheme:dark] focus:border-[var(--yellow)] focus:outline-none"
                />
              </div>
            </div>

            {#if decodedQr}
              <div class="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-xs text-white/90 space-y-1">
                <p><strong class="text-white">Valor:</strong> {formatBRL(decodedQr.amount_cents / 100)}</p>
                <p><strong class="text-white">Recebedor:</strong> {decodedQr.receiverName || "—"} ({decodedQr.receiverCpfCnpj || "—"})</p>
                {#if decodedQr.dueDate}<p><strong class="text-white">Vencimento:</strong> {decodedQr.dueDate}</p>{/if}
                {#if !decodedQr.canBePaid}
                  <p class="font-bold text-rose-300">{decodedQr.cannotBePaidReason || "QR indisponível para pagamento."}</p>
                {/if}
              </div>
            {/if}

            <div class="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onclick={handlePayFirst}
                disabled={busy || !qrPayload.trim()}
                class="min-h-10 rounded-xl bg-[#00734d] px-4 text-xs font-bold text-white disabled:opacity-50"
              >
                Pagar 1ª parcela agora
              </button>
              <button
                type="button"
                onclick={handleScheduleSecond}
                disabled={busy || !qrPayload.trim()}
                class="min-h-10 rounded-xl bg-[#002776] px-4 text-xs font-bold text-white disabled:opacity-50"
              >
                Agendar 2ª parcela
              </button>
            </div>
          </div>
        {/if}
      </Card>
    </div>
  {/if}
</section>
