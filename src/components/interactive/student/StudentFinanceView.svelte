<script lang="ts">
  import { onMount } from "svelte";
  import { requestAuth, getErrorMessage } from "@/lib/api";
  import { safePartnerUrl, dateLabel } from "./workflow";
  import Card from "@/components/ui/Card.svelte";
  import Badge from "@/components/ui/Badge.svelte";
  import Alert from "@/components/ui/Alert.svelte";
  import EmptyState from "@/components/ui/EmptyState.svelte";
  import Skeleton from "@/components/ui/Skeleton.svelte";

  type Finance = {
    status: string;
    checkout: {
      amount: string;
      is_paid: boolean;
      payment_method: string;
      provider: string;
      paid_at?: string | null;
      due_date?: string | null;
      receipt_url?: string | null;
    } | null;
  };

  let data = $state<Finance | null>(null), loading = $state(true), error = $state("");
  const receipt = $derived(safePartnerUrl(data?.checkout?.receipt_url));

  function amount(value: string) {
    const parsed = Number(value);
    return Number.isFinite(parsed)
      ? parsed.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "Valor não disponível";
  }

  async function load() {
    loading = true;
    error = "";
    try {
      data = await requestAuth<Finance>("/api/v1/clients/lead/me");
    } catch (cause) {
      error = getErrorMessage(cause);
    } finally {
      loading = false;
    }
  }

  onMount(() => { void load(); });
</script>

<section class="w-full max-w-2xl mx-auto p-4 sm:p-6 space-y-6 text-white" aria-busy={loading}>
  <div class="mb-4">
    <Badge variant="conversion" size="sm" class="mb-2">Financeiro Oficial</Badge>
    <h1 class="text-2xl sm:text-3xl font-display font-bold text-white">Pagamento da Matrícula</h1>
    <p class="text-xs sm:text-sm text-white/70">Consulte o status do seu pagamento, comprovantes e parcelamento.</p>
  </div>

  {#if loading}
    <div class="space-y-4">
      <Skeleton class="h-48 w-full rounded-3xl" />
    </div>
  {:else if error}
    <div class="space-y-3">
      <Alert variant="danger" title="Erro na consulta" description={error} />
      <button
        type="button"
        onclick={load}
        class="min-h-[48px] px-6 py-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition cursor-pointer"
      >
        Tentar novamente
      </button>
    </div>
  {:else if data?.checkout}
    <Card
      title="Comprovante e Dados da Cobrança"
      description="Transação registrada pelos provedores autorizados (Asaas ou InfinitePay)"
      class="mt-2"
    >
      {#snippet actions()}
        <Badge variant={data.checkout.is_paid ? "success" : "warning"} size="sm" pulse={!data.checkout.is_paid}>
          {data.checkout.is_paid ? "✓ Pagamento Confirmado" : "Aguardando Pagamento"}
        </Badge>
      {/snippet}

      <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
        <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10">
          <dt class="text-xs text-white/60">Valor da cobrança</dt>
          <dd class="text-lg font-bold text-white mt-0.5">{amount(data.checkout.amount)}</dd>
        </div>
        <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10">
          <dt class="text-xs text-white/60">Meio de pagamento</dt>
          <dd class="text-lg font-bold text-white mt-0.5">
            {data.checkout.payment_method === "pix" ? "Pix" : data.checkout.payment_method === "credit_card" || data.checkout.payment_method === "card" ? "Cartão de Crédito" : data.checkout.payment_method}
          </dd>
        </div>
        <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10">
          <dt class="text-xs text-white/60">Provedor seguro</dt>
          <dd class="text-sm font-semibold text-white/90 mt-0.5">
            {data.checkout.provider === "asaas" ? "Asaas Pagamentos" : data.checkout.provider === "infinitepay" ? "InfinitePay (CloudWalk)" : data.checkout.provider || "Não informado"}
          </dd>
        </div>
        <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10">
          <dt class="text-xs text-white/60">{data.checkout.is_paid ? "Confirmação registrada" : "Vencimento"}</dt>
          <dd class="text-sm font-semibold text-white/90 mt-0.5">
            {data.checkout.is_paid ? dateLabel(data.checkout.paid_at) : (data.checkout.due_date ? dateLabel(data.checkout.due_date) : "Data não disponível")}
          </dd>
        </div>
      </dl>

      {#snippet footer()}
        {#if receipt}
          <a
            class="min-h-[48px] px-6 py-2.5 rounded-xl bg-[var(--yellow)] hover:bg-[var(--yellow-soft)] text-brand-ink font-bold text-xs sm:text-sm shadow-lg transition inline-flex items-center gap-2"
            href={receipt}
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir comprovante oficial →
          </a>
        {:else}
          <span class="text-white/60 text-xs">O comprovante digital estará disponível assim que a liquidação for finalizada.</span>
        {/if}
      {/snippet}
    </Card>
  {:else}
    <EmptyState
      title="Nenhuma cobrança registrada"
      description="Nenhuma fatura ou proposta de matrícula foi localizada para este acesso no momento."
    />
  {/if}
</section>
