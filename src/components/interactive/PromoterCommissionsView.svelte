<script lang="ts">
  import { onMount } from "svelte";
  import { requestAuth, getErrorMessage } from "@/lib/api";
  import { commissionTotal, moneyLabel, COMMISSION_STATUS_LABELS, type PromoterProfile } from "@/lib/promoter";
  import Badge from "@/components/ui/Badge.svelte";
  import Alert from "@/components/ui/Alert.svelte";
  import EmptyState from "@/components/ui/EmptyState.svelte";
  import Skeleton from "@/components/ui/Skeleton.svelte";
  import Table from "@/components/ui/Table.svelte";

  interface CommissionItem {
    external_id: string;
    amount: string;
    source: string;
    status: string;
    created_at: string;
  }

  let commissions = $state<CommissionItem[]>([]);
  let loading = $state<boolean>(true);
  let promoterName = $state<string>("Promotor");
  let pixKey = $state<string>("Não informada");
  let pixType = $state<string>("PIX");
  let error = $state("");

  let balance = $derived.by(() => {
    return moneyLabel(commissionTotal(commissions, ["pending", "processed"]));
  });

  let totalPaid = $derived.by(() => {
    return moneyLabel(commissionTotal(commissions, ["paid"]));
  });

  async function load() {
    loading = true;
    error = "";
    try {
      const [profile, ledger] = await Promise.all([
        requestAuth<PromoterProfile>("/api/v1/collaborators/promoter/me"),
        requestAuth<CommissionItem[]>("/api/v1/collaborators/promoter/commissions"),
      ]);
      promoterName = profile.name ?? "Promotor";
      pixKey = profile.pix_key ?? "Não informada";
      if (!Array.isArray(ledger)) throw new Error("O servidor retornou um extrato inválido.");
      commissions = ledger;
    } catch (cause) {
      error = getErrorMessage(cause);
    } finally {
      loading = false;
    }
  }
  onMount(() => { void load(); });

  function formatDate(iso: string) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return iso;
    }
  }
</script>

<div class="w-full max-w-5xl mx-auto p-4 sm:p-6 text-white space-y-6">
  {#if error}
    <div class="space-y-3">
      <Alert variant="danger" title="Erro no extrato" description={error} />
      <button type="button" class="btn min-h-12 px-5" onclick={load}>Tentar novamente</button>
    </div>
  {:else}
  <!-- Painel de Repasses PIX -->
  <div class="rounded-3xl p-6 sm:p-8 glass-panel border border-white/15 bg-gradient-to-br from-green-deep/90 to-blue/90 shadow-2xl">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
      <div>
        <Badge variant="conversion" size="md" class="mb-2">
          Finanças & Repasses
        </Badge>
        <h1 class="text-2xl sm:text-3xl font-display text-white">Comissões & Extrato PIX</h1>
        <p class="text-xs sm:text-sm text-white/70 mt-1">
          Acompanhe suas bonificações por matrícula aprovada e datas de fechamento semanal.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <a
          href="/promoter/active"
          class="inline-flex items-center gap-2 text-xs py-2.5 px-4 rounded-xl border border-white/20 bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-colors"
        >
          ← Voltar ao Painel
        </a>
      </div>
    </div>

    <!-- Cards Financeiros -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="p-5 rounded-2xl bg-white/5 border border-white/10">
        <span class="text-xs text-white/60 uppercase font-semibold">Saldo a Receber</span>
        <p class="text-3xl font-bold text-[var(--yellow)] mt-1">{balance}</p>
        <p class="text-xs text-emerald-400 mt-1.5">✓ Fechamento na próxima sexta-feira</p>
      </div>

      <div class="p-5 rounded-2xl bg-white/5 border border-white/10">
        <span class="text-xs text-white/60 uppercase font-semibold">Total Já Pago</span>
        <p class="text-3xl font-bold text-white mt-1">{totalPaid}</p>
        <p class="text-xs text-white/60 mt-1.5">Repasses automáticos no PIX</p>
      </div>

      <div class="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
        <div>
          <span class="text-xs text-white/60 uppercase font-semibold">Chave PIX Cadastrada</span>
          <p class="text-base font-mono font-bold text-white mt-1">{pixKey}</p>
          <p class="text-xs text-emerald-400 mt-1">Tipo: {pixType} (Validada no DICT)</p>
        </div>
        <div class="mt-3">
          <span class="text-[11px] text-white/50">Repasses 100% bancários e seguros</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Extrato de Comissões -->
  <div class="rounded-3xl border border-white/15 bg-white/5 backdrop-blur-md overflow-hidden shadow-xl">
    <div class="p-5 border-b border-white/10 bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <h2 class="text-base font-bold text-white">Histórico de Comissões</h2>
      <span class="text-xs text-white/60">R$ 100,00 por matrícula + Bônus de R$ 500,00 a cada 5 matrículas na semana</span>
    </div>

    {#if loading}
      <div class="p-6 space-y-3">
        <Skeleton class="h-10 w-full rounded-xl" />
        <Skeleton class="h-10 w-full rounded-xl" />
        <Skeleton class="h-10 w-full rounded-xl" />
      </div>
    {:else if commissions.length === 0}
      <div class="p-6">
        <EmptyState
          icon="💰"
          title="Nenhuma comissão registrada"
          description="Quando seus alunos efetuarem o pagamento da matrícula, a bonificação aparecerá aqui."
        />
      </div>
    {:else}
      <Table>
        <thead class="border-b border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-white/60 font-semibold">
          <tr>
            <th class="p-4 pl-6">Origem da Bonificação</th>
            <th class="p-4">Data</th>
            <th class="p-4">Valor</th>
            <th class="p-4 pr-6 text-right">Status do Repasse</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/10">
          {#each commissions as item (item.external_id)}
            <tr class="hover:bg-white/5 transition-colors">
              <td class="p-4 pl-6 font-medium text-white">
                {item.source}
              </td>
              <td class="p-4 text-white/60">
                {formatDate(item.created_at)}
              </td>
              <td class="p-4 font-bold text-emerald-400">
                R$ {parseFloat(item.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </td>
              <td class="p-4 pr-6 text-right">
                <Badge
                  variant={item.status === "paid" ? "success" : "warning"}
                  size="sm"
                >
                  {item.status === "paid" ? "✓ Pago no PIX" : (COMMISSION_STATUS_LABELS[item.status] ?? "Status não informado")}
                </Badge>
              </td>
            </tr>
          {/each}
        </tbody>
      </Table>
    {/if}
  </div>
  {/if}
</div>
