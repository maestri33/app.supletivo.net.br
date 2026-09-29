<script lang="ts">
  import { onMount } from "svelte";
  import { whoami, requestAuth } from "@/lib/api";

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

  let balance = $derived.by(() => {
    const sum = commissions
      .filter((c) => c.status !== "paid")
      .reduce((acc, c) => acc + (parseFloat(c.amount) || 0), 0);
    return `R$ ${sum.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  });

  let totalPaid = $derived.by(() => {
    const sum = commissions
      .filter((c) => c.status === "paid")
      .reduce((acc, c) => acc + (parseFloat(c.amount) || 0), 0);
    return `R$ ${sum.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  });

  onMount(async () => {
    try {
      const who = await whoami();
      if (who?.name) promoterName = who.name;
      if ((who as any)?.pix_key) pixKey = (who as any).pix_key;
      if ((who as any)?.pix_key_type) pixType = String((who as any).pix_key_type).toUpperCase();
    } catch {}

    try {
      const [meRes, resp] = await Promise.allSettled([
        requestAuth<any>("/api/v1/collaborators/promoter/me"),
        requestAuth<any>("/api/v1/collaborators/promoter/commissions"),
      ]);
      if (meRes.status === "fulfilled" && meRes.value) {
        const meData = meRes.value;
        if (meData?.pix_key) pixKey = meData.pix_key;
        if (meData?.pix_key_type) pixType = String(meData.pix_key_type).toUpperCase();
      }
      if (resp.status === "fulfilled" && Array.isArray(resp.value)) {
        commissions = resp.value;
      }
    } catch {
      commissions = [];
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
  <div class="rounded-3xl p-6 sm:p-8 glass-panel border border-white/15 bg-gradient-to-br from-green-deep/90 to-blue/90 shadow-2xl">
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
      <span class="text-xs text-white/60">R$ 100,00 por matrícula + Bônus de R$ 500,00 a cada 5 matrículas na semana</span>
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
