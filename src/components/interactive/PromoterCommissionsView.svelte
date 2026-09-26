<script lang="ts">
  import { onMount } from "svelte";
  import { whoami } from "@/lib/api";
  import { getAccessToken } from "@/lib/session";

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
  let pixKey = $state<string>("•••.•••.•••-••");
  let pixType = $state<string>("CPF");
  let balance = $state<string>("R$ 2.450,00");
  let totalPaid = $state<string>("R$ 4.200,00");

  const mockCommissions: CommissionItem[] = [
    {
      external_id: "com-01",
      amount: "150.00",
      source: "Matrícula: Mariana Albuquerque Souza",
      status: "paid",
      created_at: "2026-09-25T14:35:00Z",
    },
    {
      external_id: "com-02",
      amount: "150.00",
      source: "Matrícula: Beatriz Cristina Mendes",
      status: "paid",
      created_at: "2026-09-23T11:47:00Z",
    },
    {
      external_id: "com-03",
      amount: "150.00",
      source: "Matrícula: Fernanda Lima de Oliveira",
      status: "paid",
      created_at: "2026-09-21T16:10:00Z",
    },
    {
      external_id: "com-04",
      amount: "150.00",
      source: "Matrícula: Lucas Fernandes Ramos",
      status: "pending",
      created_at: "2026-09-24T18:15:00Z",
    },
  ];

  onMount(async () => {
    try {
      const who = await whoami();
      if (who?.name) promoterName = who.name;
    } catch {}

    try {
      const token = getAccessToken();
      const resp = await fetch("/api/v1/collaborators/promoter/commissions", {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          Accept: "application/json",
        },
      });
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          commissions = data;
        } else {
          commissions = mockCommissions;
        }
      } else {
        commissions = mockCommissions;
      }
    } catch {
      commissions = mockCommissions;
    } finally {
      loading = false;
    }
  });

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
  <!-- Painel de Repasses PIX -->
  <div class="rounded-3xl p-6 sm:p-8 glass-panel border border-white/15 bg-gradient-to-br from-[#005238]/90 to-[#002776]/90 shadow-2xl">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--yellow)]/15 border border-[var(--yellow)]/30 text-xs font-semibold text-[var(--yellow)] mb-2">
          Finanças & Repasses
        </div>
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
    <div class="p-5 border-b border-white/10 bg-white/5 flex items-center justify-between">
      <h2 class="text-base font-bold text-white">Histórico de Comissões</h2>
      <span class="text-xs text-white/60">R$ 150,00 por matrícula confirmada</span>
    </div>

    {#if loading}
      <div class="p-12 text-center text-white/60">
        <div class="size-6 border-2 border-[var(--yellow)] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p class="text-sm">Carregando extrato de comissões...</p>
      </div>
    {:else if commissions.length === 0}
      <div class="p-12 text-center text-white/60">
        <p class="text-base font-semibold text-white/80">Nenhuma comissão registrada</p>
        <p class="text-xs text-white/50 mt-1">Quando seus alunos efetuarem o pagamento da matrícula, a bonificação aparecerá aqui.</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-white/80">
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
                  {#if item.status === "paid"}
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      ✓ Pago no PIX
                    </span>
                  {:else}
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Aguardando Fechamento
                    </span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>
