<script lang="ts">
  import { onMount } from "svelte";
  import {
    fetchContact,
    getCurrentPayment,
    getErrorMessage,
    getPaymentReceipt,
    type StudentCurrentPayment,
    type StudentPaymentReceipt,
  } from "@/lib/api";
  import { resolveSupportHref, type InstitutionalContact } from "@/lib/config";
  import { dateTimeLabel } from "@/components/interactive/student/workflow";
  import { Alert, Badge, Card } from "@/components/ui";

  let loading = $state(true);
  let error = $state("");
  let payment = $state<StudentCurrentPayment | null>(null);
  let receipt = $state<StudentPaymentReceipt | null>(null);
  let contact = $state<InstitutionalContact | null>(null);

  const supportHref = $derived(resolveSupportHref(contact));

  onMount(async () => {
    try {
      const [payRes, receiptRes, contactRes] = await Promise.all([
        getCurrentPayment(),
        getPaymentReceipt().catch(() => null),
        fetchContact().catch(() => null),
      ]);
      payment = payRes;
      receipt = receiptRes;
      contact = contactRes;
    } catch (err) {
      error = getErrorMessage(err);
    } finally {
      loading = false;
    }
  });
</script>

<section class="mx-auto max-w-2xl px-4 pb-28 pt-6 space-y-5">
  <header class="space-y-1.5">
    <Badge variant="info">Financeiro do aluno</Badge>
    <h1 class="text-2xl font-extrabold tracking-tight text-white">
      Pagamento e comprovante da matrícula
    </h1>
    <p class="text-sm text-[var(--muted-on-dark)]">
      Consulte a situação da sua taxa única de matrícula processada pela InfinitePay.
    </p>
  </header>

  {#if loading}
    <Card class="p-6"><p class="text-sm text-white/75">Carregando dados financeiros...</p></Card>
  {:else if error}
    <Alert variant="danger" title="Não foi possível carregar o financeiro">{error}</Alert>
  {:else if !payment}
    <Card class="p-6">
      <p class="text-sm text-white/75">Nenhum pagamento registrado até o momento.</p>
    </Card>
  {:else}
    <Card class="p-5 sm:p-6 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
        <div>
          <p class="text-xs font-bold uppercase tracking-wide text-white/60">Valor</p>
          <p class="text-2xl font-black text-emerald-300">{payment.amount}</p>
        </div>
        <Badge variant={payment.status === "paid" ? "success" : payment.status === "refunded" ? "danger" : "warning"}>
          {payment.status === "paid"
            ? "Pago"
            : payment.status === "refunded"
            ? "Estornado"
            : payment.status === "failed"
            ? "Falhou"
            : "Pendente"}
        </Badge>
      </div>

      <dl class="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt class="text-xs font-bold uppercase text-white/60">Gateway</dt>
          <dd class="font-semibold text-white">{payment.provider || "InfinitePay"}</dd>
        </div>
        <div>
          <dt class="text-xs font-bold uppercase text-white/60">Forma</dt>
          <dd class="font-semibold text-white">
            {payment.payment_method === "card" ? "Cartão de crédito" : payment.payment_method === "pix" ? "Pix" : "InfinitePay"}
          </dd>
        </div>
        <div>
          <dt class="text-xs font-bold uppercase text-white/60">Data de criação</dt>
          <dd class="font-medium text-white/85">{dateTimeLabel(payment.created_at)}</dd>
        </div>
        <div>
          <dt class="text-xs font-bold uppercase text-white/60">Confirmação</dt>
          <dd class="font-medium text-white/85">
            {payment.paid_at ? dateTimeLabel(payment.paid_at) : "Aguardando compensação"}
          </dd>
        </div>
      </dl>

      {#if receipt?.available && receipt.receipt_url}
        <a
          href={receipt.receipt_url}
          target="_blank"
          rel="noopener noreferrer"
          class="min-h-11 inline-flex w-full items-center justify-center rounded-xl bg-[#00734d] px-4 text-sm font-bold text-white hover:opacity-95"
        >
          Abrir comprovante oficial InfinitePay
        </a>
      {:else if payment.receipt_url}
        <a
          href={payment.receipt_url}
          target="_blank"
          rel="noopener noreferrer"
          class="min-h-11 inline-flex w-full items-center justify-center rounded-xl bg-[#00734d] px-4 text-sm font-bold text-white hover:opacity-95"
        >
          Ver comprovante
        </a>
      {:else if payment.checkout_url && payment.status === "pending"}
        <a
          href={payment.checkout_url}
          target="_blank"
          rel="noopener noreferrer"
          class="min-h-11 inline-flex w-full items-center justify-center rounded-xl bg-[#ffc400] px-4 text-sm font-extrabold text-[#0b1220] hover:brightness-95"
        >
          Retomar pagamento na InfinitePay
        </a>
      {/if}
    </Card>

    <div class="text-center text-xs text-white/60">
      Precisa de segunda via ou atendimento financeiro?
      <a href={supportHref} class="font-semibold text-[var(--yellow)] hover:underline">Falar com atendimento</a>
    </div>
  {/if}
</section>
