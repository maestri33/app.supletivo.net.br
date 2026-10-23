<script lang="ts">
  import { onMount } from "svelte";
  import { requestAuth, getErrorMessage } from "@/lib/api";
  import { safePartnerUrl, dateLabel } from "./workflow";
  import "./workflow.css";
  type Finance = { status: string; checkout: { amount: string; is_paid: boolean; payment_method: string; provider: string; paid_at?: string | null; due_date?: string | null; receipt_url?: string | null } | null };
  let data = $state<Finance | null>(null), loading = $state(true), error = $state("");
  const receipt = $derived(safePartnerUrl(data?.checkout?.receipt_url));
  function amount(value: string) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "Valor não disponível"; }
  async function load() { loading = true; error = ""; try { data = await requestAuth<Finance>("/api/v1/clients/lead/me"); } catch (cause) { error = getErrorMessage(cause); } finally { loading = false; } }
  onMount(() => { void load(); });
</script>
<section class="student-workflow" aria-busy={loading}>
  <h1>Financeiro</h1>
  {#if loading}<p role="status">Consultando seu pagamento...</p>
  {:else if error}<p class="error" role="alert">{error}</p><button class="secondary" onclick={load}>Tentar novamente</button>
  {:else if data?.checkout}
    <div class="panel"><h2>Pagamento da matrícula</h2><dl>
      <div><dt>Valor da cobrança</dt><dd>{amount(data.checkout.amount)}</dd></div>
      <div><dt>Situação</dt><dd>{data.checkout.is_paid ? "Pagamento confirmado" : "Sem confirmação de pagamento"}</dd></div>
      <div><dt>Meio de pagamento</dt><dd>{data.checkout.payment_method === "pix" ? "Pix" : data.checkout.payment_method === "credit_card" || data.checkout.payment_method === "card" ? "Cartão" : data.checkout.payment_method}</dd></div>
      <div><dt>Confirmação registrada</dt><dd>{dateLabel(data.checkout.paid_at)}</dd></div>
    </dl>{#if receipt}<a class="btn" href={receipt} target="_blank" rel="noopener noreferrer">Abrir comprovante</a>{:else}<p class="muted">O provedor ainda não disponibilizou um comprovante nesta consulta.</p>{/if}</div>
  {:else}<p class="muted">Nenhuma cobrança disponível nesta consulta.</p>{/if}
</section>
