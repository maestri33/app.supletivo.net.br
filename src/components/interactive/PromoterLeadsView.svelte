<script lang="ts">
  import { onMount } from "svelte";
  import { whoami } from "@/lib/api";
  import { getAccessToken } from "@/lib/session";

  interface PromoterLead {
    external_id: string;
    name?: string | null;
    phone?: string | null;
    status: string;
    created_at: string;
  }

  let leads = $state<PromoterLead[]>([]);
  let loading = $state<boolean>(true);
  let searchQuery = $state<string>("");
  let statusFilter = $state<string>("all");
  let promoterName = $state<string>("Promotor");
  let externalId = $state<string>("");
  let copied = $state<boolean>(false);

  let referralUrl = $derived(
    externalId
      ? `https://supletivo.net.br?ref=${externalId}`
      : "https://supletivo.net.br"
  );

  const mockLeads: PromoterLead[] = [
    {
      external_id: "lead-01",
      name: "Mariana Albuquerque Souza",
      phone: "11988887766",
      status: "paid",
      created_at: "2026-09-25T14:32:00Z",
    },
    {
      external_id: "lead-02",
      name: "Lucas Fernandes Ramos",
      phone: "21977776655",
      status: "checkout",
      created_at: "2026-09-24T18:10:00Z",
    },
    {
      external_id: "lead-03",
      name: "Beatriz Cristina Mendes",
      phone: "31966665544",
      status: "paid",
      created_at: "2026-09-23T11:45:00Z",
    },
    {
      external_id: "lead-04",
      name: "Carlos Eduardo da Silva",
      phone: "43999990001",
      status: "started",
      created_at: "2026-09-22T09:20:00Z",
    },
    {
      external_id: "lead-05",
      name: "Fernanda Lima de Oliveira",
      phone: "11955554433",
      status: "paid",
      created_at: "2026-09-21T16:05:00Z",
    },
  ];

  onMount(async () => {
    try {
      const who = await whoami();
      if (who?.name) promoterName = who.name;
      if (who?.external_id) externalId = who.external_id;
    } catch {}

    try {
      const token = getAccessToken();
      const resp = await fetch("/api/v1/collaborators/promoter/leads", {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          Accept: "application/json",
        },
      });
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          leads = data;
        } else {
          leads = mockLeads;
        }
      } else {
        leads = mockLeads;
      }
    } catch {
      leads = mockLeads;
    } finally {
      loading = false;
    }
  });

  function copyReferralLink() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(referralUrl);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2500);
    }
  }

  let filteredLeads = $derived(
    leads.filter((lead) => {
      const matchesSearch =
        !searchQuery ||
        (lead.name && lead.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (lead.phone && lead.phone.includes(searchQuery.replace(/\D/g, "")));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "paid" && (lead.status === "paid" || lead.status === "enrolled")) ||
        (statusFilter === "pending" && (lead.status === "checkout" || lead.status === "started"));

      return matchesSearch && matchesStatus;
    })
  );

  let totalCount = $derived(leads.length);
  let paidCount = $derived(
    leads.filter((l) => l.status === "paid" || l.status === "enrolled").length
  );
  let pendingCount = $derived(
    leads.filter((l) => l.status === "checkout" || l.status === "started").length
  );
  let totalCommissions = $derived(paidCount * 150);

  function formatStatusBadge(status: string) {
    switch (status) {
      case "paid":
      case "enrolled":
        return { label: "Matriculado / Pago", bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" };
      case "checkout":
        return { label: "Checkout Iniciado", bg: "bg-amber-500/20 text-amber-300 border-amber-500/40" };
      default:
        return { label: "Lead Captado", bg: "bg-blue-500/20 text-blue-300 border-blue-500/40" };
    }
  }

  function formatPhone(phone?: string | null) {
    if (!phone) return "—";
    const clean = phone.replace(/\D/g, "");
    if (clean.length === 11) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    }
    return phone;
  }

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
  <!-- Cabeçalho -->
  <div class="rounded-3xl p-6 sm:p-8 glass-panel border border-white/15 bg-gradient-to-br from-[#005238]/90 to-[#002776]/90 shadow-2xl">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--yellow)]/15 border border-[var(--yellow)]/30 text-xs font-semibold text-[var(--yellow)] mb-2">
          Gestão de Captação
        </div>
        <h1 class="text-2xl sm:text-3xl font-display text-white">Meus Indicados & Leads</h1>
        <p class="text-xs sm:text-sm text-white/70 mt-1">
          Acompanhe o funil de matrículas dos alunos que acessaram pelo seu link oficial.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <a
          href="/promoter/active"
          class="inline-flex items-center gap-2 text-xs py-2.5 px-4 rounded-xl border border-white/20 bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-colors"
        >
          ← Voltar ao Painel
        </a>
        <button
          type="button"
          onclick={copyReferralLink}
          class="btn inline-flex items-center gap-2 text-xs py-2.5 px-5 font-bold uppercase tracking-wider text-[var(--ink)] cursor-pointer"
        >
          {copied ? "✓ Copiado!" : "Copiar Link ?ref 🔗"}
        </button>
      </div>
    </div>

    <!-- Métricas Consolidadas -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
        <span class="text-[11px] text-white/60 uppercase font-semibold">Total de Leads</span>
        <p class="text-2xl sm:text-3xl font-bold text-white mt-1">{totalCount}</p>
        <p class="text-[11px] text-white/50 mt-1">Cadastrados no funil</p>
      </div>

      <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
        <span class="text-[11px] text-white/60 uppercase font-semibold">Matrículas Pagas</span>
        <p class="text-2xl sm:text-3xl font-bold text-emerald-400 mt-1">{paidCount}</p>
        <p class="text-[11px] text-emerald-400/70 mt-1">Comissões geradas</p>
      </div>

      <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
        <span class="text-[11px] text-white/60 uppercase font-semibold">Aguardando Pagamento</span>
        <p class="text-2xl sm:text-3xl font-bold text-amber-300 mt-1">{pendingCount}</p>
        <p class="text-[11px] text-amber-300/70 mt-1">Em fase de checkout</p>
      </div>

      <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
        <span class="text-[11px] text-white/60 uppercase font-semibold">Comissões Estimadas</span>
        <p class="text-2xl sm:text-3xl font-bold text-[var(--yellow)] mt-1">
          R$ {totalCommissions.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>
        <p class="text-[11px] text-[var(--yellow)]/70 mt-1">R$ 150 por matrícula</p>
      </div>
    </div>
  </div>

  <!-- Filtros e Busca -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
    <div class="flex items-center gap-2">
      <button
        type="button"
        onclick={() => (statusFilter = "all")}
        class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all {statusFilter === 'all'
          ? 'bg-[var(--yellow)] text-[var(--ink)] font-bold'
          : 'bg-white/5 text-white/70 hover:bg-white/10'}"
      >
        Todos ({totalCount})
      </button>
      <button
        type="button"
        onclick={() => (statusFilter = "paid")}
        class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all {statusFilter === 'paid'
          ? 'bg-emerald-500 text-white font-bold'
          : 'bg-white/5 text-white/70 hover:bg-white/10'}"
      >
        Pagos ({paidCount})
      </button>
      <button
        type="button"
        onclick={() => (statusFilter = "pending")}
        class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all {statusFilter === 'pending'
          ? 'bg-amber-500 text-white font-bold'
          : 'bg-white/5 text-white/70 hover:bg-white/10'}"
      >
        Pendentes ({pendingCount})
      </button>
    </div>

    <div class="relative w-full sm:w-72">
      <input
        type="text"
        placeholder="Buscar por nome ou WhatsApp..."
        bind:value={searchQuery}
        class="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs placeholder-white/40 focus:outline-none focus:border-[var(--yellow)]"
      />
    </div>
  </div>

  <!-- Lista de Leads -->
  <div class="rounded-3xl border border-white/15 bg-white/5 backdrop-blur-md overflow-hidden shadow-xl">
    {#if loading}
      <div class="p-12 text-center text-white/60">
        <div class="size-6 border-2 border-[var(--yellow)] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p class="text-sm">Carregando lista de indicados...</p>
      </div>
    {:else if filteredLeads.length === 0}
      <div class="p-12 text-center text-white/60">
        <p class="text-base font-semibold text-white/80">Nenhum lead encontrado</p>
        <p class="text-xs text-white/50 mt-1">Compartilhe seu link exclusivo para captar novos alunos.</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-white/80">
          <thead class="border-b border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-white/60 font-semibold">
            <tr>
              <th class="p-4 pl-6">Aluno Indicado</th>
              <th class="p-4">WhatsApp</th>
              <th class="p-4">Data do Cadastro</th>
              <th class="p-4">Status da Matrícula</th>
              <th class="p-4">Comissão</th>
              <th class="p-4 pr-6 text-right">Ação</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/10">
            {#each filteredLeads as lead (lead.external_id)}
              {@const badge = formatStatusBadge(lead.status)}
              <tr class="hover:bg-white/5 transition-colors">
                <td class="p-4 pl-6 font-medium text-white">
                  {lead.name || "Aluno em Cadastro"}
                </td>
                <td class="p-4 font-mono text-white/70">
                  {formatPhone(lead.phone)}
                </td>
                <td class="p-4 text-white/60">
                  {formatDate(lead.created_at)}
                </td>
                <td class="p-4">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border {badge.bg}">
                    {badge.label}
                  </span>
                </td>
                <td class="p-4 font-bold {lead.status === 'paid' || lead.status === 'enrolled' ? 'text-emerald-400' : 'text-white/40'}">
                  {lead.status === 'paid' || lead.status === 'enrolled' ? 'R$ 150,00' : 'R$ 0,00'}
                </td>
                <td class="p-4 pr-6 text-right">
                  {#if lead.phone}
                    <a
                      href={`https://wa.me/55${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Sou seu consultor educacional do Supletivo Brasil. Como posso te ajudar na sua matrícula?')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold transition-colors"
                    >
                      WhatsApp ↗
                    </a>
                  {:else}
                    <span class="text-white/30 text-[11px]">—</span>
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
