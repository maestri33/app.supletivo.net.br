<script lang="ts">
  import { onMount } from "svelte";
  import { whoami, getStudentMe, getLeadMe } from "@/lib/api";
  import { getAccessToken, clearSession } from "@/lib/session";
  import StudentLockedPaywall from "./StudentLockedPaywall.svelte";

  let loading = $state(true);
  let isLocked = $state(false);
  let userRoles = $state<string[]>(["aluno"]);
  let activeRole = $state<string>("aluno");
  let studentName = $state<string>("Aluno");
  let partnerUrl = $state<string | null>(null);

  onMount(async () => {
    const token = getAccessToken();
    if (!token) {
      window.location.replace("/autenticacao/login");
      return;
    }

    try {
      const [whoRes, leadRes, studentRes] = await Promise.allSettled([
        whoami(),
        getLeadMe(),
        getStudentMe(),
      ]);

      if (whoRes.status === "fulfilled") {
        studentName = whoRes.value.name || "Aluno";
        const r = whoRes.value.roles || [];
        userRoles = r.length > 0 ? r : ["aluno"];
        activeRole = userRoles[0];
      }

      // Avaliação de Estado Travado:
      // Se for aluno e não possuir checkout pago em leadMe nem matrícula liberada em studentMe
      const isOnlyStudent = userRoles.length === 1 && userRoles[0] === "aluno";
      if (isOnlyStudent) {
        let paid = false;

        if (leadRes.status === "fulfilled" && leadRes.value?.checkout?.is_paid) {
          paid = true;
        }

        if (studentRes.status === "fulfilled" && studentRes.value?.status && studentRes.value.status !== "pending") {
          paid = true;
          if (studentRes.value.platform?.url) {
            partnerUrl = studentRes.value.platform.url;
          }
        }

        isLocked = !paid;
      } else {
        isLocked = false;
      }
    } catch {
      isLocked = true;
    } finally {
      loading = false;
    }
  });

  function handleLogout() {
    clearSession();
    window.location.href = "/autenticacao/login";
  }

  // 100% PT-BR na Interface e Nomenclatura conforme AGENTS.md
  const roleMeta: Record<string, { label: string; icon: string }> = {
    aluno: { label: "Aluno", icon: "🎓" },
    promotor: { label: "Promotor", icon: "💼" },
    polo: { label: "Polo", icon: "🏫" },
    admin: { label: "Administrador", icon: "🛡️" },
  };
</script>

{#if loading}
  <div class="flex-1 flex flex-col items-center justify-center p-12 text-white/70">
    <div class="size-10 border-3 border-white/20 border-t-[var(--yellow)] rounded-full animate-spin mb-4"></div>
    <p class="text-xs uppercase tracking-wider font-semibold">Carregando seu ambiente...</p>
  </div>
{:else if isLocked}
  <!-- ESTADO TRAVADO: 3 Caminhos Exclusivos -->
  <div class="w-full flex-1 flex flex-col justify-center">
    <StudentLockedPaywall />
    <div class="text-center mt-6">
      <button
        type="button"
        onclick={handleLogout}
        class="text-xs text-white/50 hover:text-rose-400 transition-colors cursor-pointer"
      >
        Encerrar sessão e sair
      </button>
    </div>
  </div>
{:else}
  <!-- ESTADO NÃO TRAVADO:
       REGRA CANÔNICA DE TABS:
       - Se o usuário tem mais de uma role: exibe as tabs em cima para alternar entre os ambientes que possui.
       - Se o usuário tem APENAS UMA ROLE: NENHUMA tab é exibida no topo, entra direto no ambiente dele. -->
  <div class="w-full max-w-5xl mx-auto flex flex-col items-center gap-6">
    {#if userRoles.length > 1}
      <div class="flex items-center gap-2 p-1.5 rounded-full glass-panel border border-white/15 bg-white/5 backdrop-blur-md">
        {#each userRoles as r}
          <button
            type="button"
            onclick={() => {
              activeRole = r;
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("supletivo:role-change", { detail: { role: r } }));
              }
            }}
            class="flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer {activeRole === r ? 'bg-[var(--blue)] text-white shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}"
          >
            <span>{roleMeta[r]?.icon || "🔹"}</span>
            <span>{roleMeta[r]?.label || r}</span>
          </button>
        {/each}
      </div>
    {/if}

    <!-- CONTEÚDO DO AMBIENTE ATIVO -->
    <div class="w-full">
      {#if activeRole === "aluno"}
        <div class="w-full overflow-hidden relative rounded-3xl p-6 sm:p-8 text-white glass-panel border border-white/15 bg-gradient-to-br from-[#002776]/80 to-[#001a52]/90 shadow-2xl">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
            <div>
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs font-semibold text-emerald-300 mb-2">
                <span class="size-2 rounded-full bg-emerald-400"></span>
                Ambiente de Formação Ativo
              </div>
              <h2 class="text-2xl sm:text-3xl font-display text-white">
                Olá, {studentName}!
              </h2>
              <p class="text-xs sm:text-sm text-white/70 mt-1">
                Acesse seus conteúdos, histórico e acompanhe a conclusão do Ensino Médio.
              </p>
            </div>

            {#if partnerUrl}
              <a
                href={partnerUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="btn inline-flex items-center gap-2 text-xs py-2.5 px-5 font-bold uppercase tracking-wider text-[var(--ink)]"
              >
                Acessar Sala de Aula ↗
              </a>
            {/if}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span class="text-xs text-white/60 uppercase font-semibold">Status Curricular</span>
              <p class="text-lg font-bold text-white mt-1">Disciplinas Liberadas</p>
              <p class="text-xs text-emerald-400 mt-2">12 de 12 matérias ativas</p>
            </div>
            <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span class="text-xs text-white/60 uppercase font-semibold">Documentação</span>
              <p class="text-lg font-bold text-white mt-1">Validação Concluída</p>
              <p class="text-xs text-white/70 mt-2">Apto para prova de certificação</p>
            </div>
            <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span class="text-xs text-white/60 uppercase font-semibold">Diploma Oficial</span>
              <p class="text-lg font-bold text-white mt-1">Credenciado MEC</p>
              <p class="text-xs text-white/70 mt-2">Publicação no GDAE / Diário Oficial</p>
            </div>
          </div>
        </div>
      {:else if activeRole === "promotor"}
        <div class="w-full overflow-hidden relative rounded-3xl p-6 sm:p-8 text-white glass-panel border border-white/15 bg-gradient-to-br from-[#005238]/80 to-[#002776]/80 shadow-2xl">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
            <div>
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--yellow)]/15 border border-[var(--yellow)]/30 text-xs font-semibold text-[var(--yellow)] mb-2">
                Painel do Consultor Educacional
              </div>
              <h2 class="text-2xl sm:text-3xl font-display text-white">
                Gestão de Indicações & Comissões
              </h2>
              <p class="text-xs sm:text-sm text-white/70 mt-1">
                Acompanhe o funil de matrículas e seus repasses financeiros.
              </p>
            </div>

            <a
              href="/promotor/leads"
              class="inline-flex items-center gap-2 text-xs py-2.5 px-5 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
            >
              Ver Meus Leads →
            </a>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span class="text-xs text-white/60 uppercase font-semibold">Leads Ativos</span>
              <p class="text-2xl font-bold text-white mt-1">24</p>
              <p class="text-xs text-emerald-400 mt-1">+3 nas últimas 24h</p>
            </div>
            <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span class="text-xs text-white/60 uppercase font-semibold">Matrículas Confirmadas</span>
              <p class="text-2xl font-bold text-white mt-1">18</p>
              <p class="text-xs text-white/70 mt-1">Conversão de 75%</p>
            </div>
            <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span class="text-xs text-white/60 uppercase font-semibold">Saldo a Receber</span>
              <p class="text-2xl font-bold text-[var(--yellow)] mt-1">R$ 2.450,00</p>
              <p class="text-xs text-white/70 mt-1">Próximo fechamento semanal</p>
            </div>
          </div>
        </div>
      {:else if activeRole === "polo"}
        <div class="w-full overflow-hidden relative rounded-3xl p-6 sm:p-8 text-white glass-panel border border-white/15 bg-gradient-to-br from-[#0b1220]/90 to-[#002776]/90 shadow-2xl">
          <div class="border-b border-white/10 pb-6 mb-6">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-xs font-semibold text-blue-300 mb-2">
              Secretaria do Polo Regional
            </div>
            <h2 class="text-2xl sm:text-3xl font-display text-white">
              Conferência Documental & Turmas
            </h2>
            <p class="text-xs sm:text-sm text-white/70 mt-1">
              Validação de documentação física, agendamento de bancas e entrega de certificados.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span class="text-xs text-white/60 uppercase font-semibold">Pendências de Validação</span>
              <p class="text-xl font-bold text-amber-300 mt-1">5 documentos para análise</p>
              <p class="text-xs text-white/60 mt-1">RG, Histórico e Comprovantes em fila</p>
            </div>
            <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span class="text-xs text-white/60 uppercase font-semibold">Diplomas Prontos para Retirada</span>
              <p class="text-xl font-bold text-emerald-400 mt-1">12 certificados impressos</p>
              <p class="text-xs text-white/60 mt-1">Aguardando assinatura do concluinte</p>
            </div>
          </div>
        </div>
      {:else if activeRole === "admin"}
        <div class="w-full overflow-hidden relative rounded-3xl p-6 sm:p-8 text-white glass-panel border border-white/15 bg-gradient-to-br from-[#0b1220] to-[#121d33] shadow-2xl">
          <div class="border-b border-white/10 pb-6 mb-6">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-xs font-semibold text-purple-300 mb-2">
              Governança Central do Sistema
            </div>
            <h2 class="text-2xl sm:text-3xl font-display text-white">
              Painel de Auditoria & Infraestrutura
            </h2>
            <p class="text-xs sm:text-sm text-white/70 mt-1">
              Saúde de micro-serviços, oráculo de versão e logs de segurança.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span class="text-xs text-white/60 uppercase font-semibold">Oráculo de Versão</span>
              <p class="text-lg font-mono font-bold text-emerald-400 mt-1">v0.2.0-cloud</p>
              <p class="text-xs text-white/60 mt-1">Sincronizado com a rede global</p>
            </div>
            <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span class="text-xs text-white/60 uppercase font-semibold">Edge Workers</span>
              <p class="text-lg font-bold text-white mt-1">Cloudflare SP (Anycast)</p>
              <p class="text-xs text-white/60 mt-1">Latência média: 18ms</p>
            </div>
            <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span class="text-xs text-white/60 uppercase font-semibold">Banco Neon (Hyperdrive)</span>
              <p class="text-lg font-bold text-white mt-1">PostgreSQL 18</p>
              <p class="text-xs text-white/60 mt-1">Pool ativo e saudável</p>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Navegação Interna Contextual do Ambiente Ativo via RoleAdaptiveNavDock -->
    <slot {activeRole} />
  </div>
{/if}
