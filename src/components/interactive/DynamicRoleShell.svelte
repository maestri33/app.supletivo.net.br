<script lang="ts">
  import { onMount } from "svelte";
  import { whoami, getStudentMe, getLeadMe } from "@/lib/api";
  import { getAccessToken, clearSession } from "@/lib/session";
  import {
    normalizeUserRoles,
    ENVIRONMENT_META,
    formatStudentStatus,
    type AppEnvironment,
  } from "@/lib/roles";
  import StudentLockedPaywall from "./StudentLockedPaywall.svelte";

  let loading = $state(true);
  let isLocked = $state(false);
  let rawRoles = $state<string[]>([]);
  let userRoles = $state<AppEnvironment[]>(["aluno"]);
  let activeRole = $state<AppEnvironment>("aluno");
  let studentName = $state<string>("Aluno");
  let userExternalId = $state<string>("");
  let partnerUrl = $state<string | null>(null);

  // Estados específicos de cada ambiente
  let studentStatus = $state<string>("awaiting_documents");
  let pendingDocsCount = $state<number>(0);
  let isTrainingBlocked = $state<boolean>(false);
  let isCandidate = $state<boolean>(false);
  let promoterCopied = $state<boolean>(false);

  onMount(async () => {
    const token = getAccessToken();
    if (!token) {
      window.location.replace("/autenticacao/login");
      return;
    }

    let studentRes: PromiseSettledResult<any> | null = null;
    let leadRes: PromiseSettledResult<any> | null = null;

    try {
      const results = await Promise.allSettled([
        whoami(),
        getLeadMe(),
        getStudentMe(),
      ]);
      const whoRes = results[0];
      leadRes = results[1];
      studentRes = results[2];

      if (whoRes.status === "fulfilled") {
        studentName = whoRes.value.name || "Aluno";
        userExternalId = whoRes.value.external_id || "";
        rawRoles = whoRes.value.roles || [];
        userRoles = normalizeUserRoles(rawRoles);
        activeRole = userRoles[0] || "aluno";

        // Verifica travas específicas do promotor
        if (rawRoles.includes("training")) {
          isTrainingBlocked = true;
        }
        if (rawRoles.includes("candidate")) {
          isCandidate = true;
        }
      }

      // Avaliação de Estado Travado (Paywall de matrícula):
      // Se for exclusivamente aluno e não possuir checkout pago nem matrícula liberada
      const isOnlyStudent = userRoles.length === 1 && userRoles[0] === "aluno";
      if (isOnlyStudent) {
        let paid = false;

        if (leadRes.status === "fulfilled" && leadRes.value?.checkout?.is_paid) {
          paid = true;
        }

        if (
          studentRes.status === "fulfilled" &&
          studentRes.value?.status &&
          studentRes.value.status !== "pending"
        ) {
          paid = true;
          studentStatus = studentRes.value.status;
          pendingDocsCount = studentRes.value.pendencies?.length ?? 0;
          if (studentRes.value.platform?.url) {
            partnerUrl = studentRes.value.platform.url;
          }
        }

        isLocked = !paid;
      } else {
        isLocked = false;
        if (studentRes.status === "fulfilled" && studentRes.value?.status) {
          studentStatus = studentRes.value.status;
          pendingDocsCount = studentRes.value.pendencies?.length ?? 0;
          if (studentRes.value.platform?.url) {
            partnerUrl = studentRes.value.platform.url;
          }
        }
      }
    } catch {
      isLocked = true;
    } finally {
      loading = false;
      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("supletivo:role-change", {
              detail: { role: activeRole },
            })
          );
          window.dispatchEvent(
            new CustomEvent("supletivo:lock-change", {
              detail: { isLocked },
            })
          );
          window.dispatchEvent(
            new CustomEvent("supletivo:student-state", {
              detail: {
                status: studentStatus,
                pendingDocsCount,
                hasPartnerUrl: !!partnerUrl,
              },
            })
          );
          window.dispatchEvent(
            new CustomEvent("supletivo:promoter-state", {
              detail: {
                status: isCandidate ? "candidate" : isTrainingBlocked ? "training" : "active",
                newLeadsCount: 3,
                isTrainingBlocked,
                pendingMaterialsCount: isTrainingBlocked ? 2 : 0,
                isCandidate,
              },
            })
          );
          window.dispatchEvent(
            new CustomEvent("supletivo:polo-state", {
              detail: {
                pendingValidationCount: 5,
                pendingExamsCount: 2,
                readyDiplomasCount: 4,
              },
            })
          );
        }, 50);
      }
    }
  });

  function handleLogout() {
    clearSession();
    window.location.href = "/autenticacao/login";
  }

  function handleCopyPromoterLink() {
    if (typeof window !== "undefined") {
      const ref = userExternalId ? `?ref=${userExternalId}` : "";
      const shareUrl = `https://supletivo.net.br${ref}`;
      navigator.clipboard?.writeText(shareUrl);
      promoterCopied = true;
      setTimeout(() => {
        promoterCopied = false;
      }, 2500);
    }
  }

  function switchRole(role: AppEnvironment) {
    activeRole = role;
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("supletivo:role-change", { detail: { role } })
      );
    }
  }

  const statusDisplay = $derived(formatStudentStatus(studentStatus));
</script>

{#if loading}
  <div class="flex-1 flex flex-col items-center justify-center p-12 text-white/70">
    <div
      class="size-10 border-3 border-white/20 border-t-[var(--yellow)] rounded-full animate-spin mb-4"
    ></div>
    <p class="text-xs uppercase tracking-wider font-semibold">
      Carregando seu ambiente...
    </p>
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
      <div
        class="flex items-center gap-2 p-1.5 rounded-full glass-panel border border-white/15 bg-white/5 backdrop-blur-md"
      >
        {#each userRoles as r}
          <button
            type="button"
            onclick={() => switchRole(r)}
            class="flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer {activeRole ===
            r
              ? 'bg-[var(--blue)] text-white shadow-lg ring-1 ring-white/30'
              : 'text-white/70 hover:text-white hover:bg-white/10'}"
          >
            <span>{ENVIRONMENT_META[r]?.icon || "🔹"}</span>
            <span>{ENVIRONMENT_META[r]?.label || r}</span>
          </button>
        {/each}
      </div>
    {/if}

    <!-- CONTEÚDO DO AMBIENTE ATIVO PERSONALIZADO (ROLE + STATUS) -->
    <div class="w-full">
      {#if activeRole === "aluno"}
        <!-- AMBIENTE DO ALUNO -->
        <div
          class="w-full overflow-hidden relative rounded-3xl p-6 sm:p-8 text-white glass-panel border border-white/15 bg-gradient-to-br from-[#002776]/80 to-[#001a52]/90 shadow-2xl"
        >
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6"
          >
            <div>
              <div
                class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-2 {statusDisplay.variant ===
                'success'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                  : statusDisplay.variant === 'warning'
                    ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                    : 'bg-blue-500/15 border border-blue-500/30 text-blue-300'}"
              >
                <span
                  class="size-2 rounded-full {statusDisplay.variant === 'success'
                    ? 'bg-emerald-400'
                    : statusDisplay.variant === 'warning'
                      ? 'bg-amber-400'
                      : 'bg-blue-400'}"
                ></span>
                {statusDisplay.label}
              </div>
              <h2 class="text-2xl sm:text-3xl font-display text-white">
                Olá, {studentName}!
              </h2>
              <p class="text-xs sm:text-sm text-white/70 mt-1">
                Acesse seus conteúdos, histórico e acompanhe a conclusão do Ensino Médio.
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-3">
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

              {#if studentStatus === "exam_released"}
                <a
                  href="/provas"
                  class="inline-flex items-center gap-2 text-xs py-2.5 px-5 rounded-full font-bold uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-lg shadow-emerald-500/20"
                >
                  Agendar Prova Presencial →
                </a>
              {:else if studentStatus === "awaiting_pickup"}
                <a
                  href="/aluno"
                  class="inline-flex items-center gap-2 text-xs py-2.5 px-5 rounded-full font-bold uppercase tracking-wider bg-[var(--yellow)] hover:bg-amber-300 text-slate-950 transition-colors shadow-lg"
                >
                  Instruções de Retirada do Diploma →
                </a>
              {/if}
            </div>
          </div>

          <!-- Alerta Contextual por Status do Aluno -->
          {#if studentStatus === "exam_released"}
            <div
              class="p-4 mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4 text-emerald-200 text-xs sm:text-sm"
            >
              <div class="flex items-center gap-3">
                <span class="text-xl">🎉</span>
                <div>
                  <strong class="text-emerald-100 font-semibold"
                    >Parabéns! Você está liberado para o exame presencial.</strong
                  >
                  <p class="text-xs text-emerald-300/80 mt-0.5">
                    Escolha o polo regional mais conveniente e agende sua data de prova.
                  </p>
                </div>
              </div>
              <a href="/provas" class="underline font-bold whitespace-nowrap">Agendar Agora</a>
            </div>
          {:else if studentStatus === "awaiting_documents"}
            <div
              class="p-4 mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4 text-amber-200 text-xs sm:text-sm"
            >
              <div class="flex items-center gap-3">
                <span class="text-xl">📋</span>
                <div>
                  <strong class="text-amber-100 font-semibold"
                    >Documentação pendente para validação MEC.</strong
                  >
                  <p class="text-xs text-amber-300/80 mt-0.5">
                    Envie seus comprovantes para liberar sua inscrição definitiva no polo.
                  </p>
                </div>
              </div>
              <a href="/documentos" class="underline font-bold whitespace-nowrap">Enviar Documentos</a>
            </div>
          {/if}

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span class="text-xs text-white/60 uppercase font-semibold">Status Curricular</span>
              <p class="text-lg font-bold text-white mt-1">Disciplinas Liberadas</p>
              <p class="text-xs text-emerald-400 mt-2">12 de 12 matérias ativas</p>
            </div>
            <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span class="text-xs text-white/60 uppercase font-semibold">Documentação</span>
              <p class="text-lg font-bold text-white mt-1">
                {studentStatus === "awaiting_documents"
                  ? "Pendente de Envio"
                  : studentStatus === "documents_under_review"
                    ? "Em Análise pela IA"
                    : "Validação Concluída"}
              </p>
              <p class="text-xs text-white/70 mt-2">
                {pendingDocsCount > 0 ? `${pendingDocsCount} pendências abertas` : "Tudo em conformidade"}
              </p>
            </div>
            <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span class="text-xs text-white/60 uppercase font-semibold">Diploma Oficial</span>
              <p class="text-lg font-bold text-white mt-1">Credenciado MEC</p>
              <p class="text-xs text-white/70 mt-2">Publicação no GDAE / Diário Oficial</p>
            </div>
          </div>
        </div>
      {:else if activeRole === "promotor"}
        <!-- AMBIENTE DO PROMOTOR -->
        <div
          class="w-full overflow-hidden relative rounded-3xl p-6 sm:p-8 text-white glass-panel border border-white/15 bg-gradient-to-br from-[#005238]/80 to-[#002776]/80 shadow-2xl"
        >
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6"
          >
            <div>
              <div
                class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--yellow)]/15 border border-[var(--yellow)]/30 text-xs font-semibold text-[var(--yellow)] mb-2"
              >
                {isCandidate
                  ? "Aspirante a Consultor Educacional"
                  : isTrainingBlocked
                    ? "Treinamento Obrigatório Pendente"
                    : "Painel do Consultor Educacional"}
              </div>
              <h2 class="text-2xl sm:text-3xl font-display text-white">
                {isCandidate
                  ? "Credenciamento de Promotor"
                  : isTrainingBlocked
                    ? "Treinamento em Andamento"
                    : "Gestão de Indicações & Comissões"}
              </h2>
              <p class="text-xs sm:text-sm text-white/70 mt-1">
                {isTrainingBlocked
                  ? "Conclua as matérias obrigatórias para liberar seu link oficial de indicações."
                  : "Acompanhe o funil de matrículas e seus repasses financeiros automáticos no PIX."}
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-3">
              {#if !isTrainingBlocked && !isCandidate}
                <button
                  type="button"
                  onclick={handleCopyPromoterLink}
                  class="inline-flex items-center gap-2 text-xs py-2.5 px-5 rounded-full border border-[var(--yellow)]/40 bg-[var(--yellow)]/10 hover:bg-[var(--yellow)]/20 text-[var(--yellow)] font-bold transition-colors cursor-pointer"
                >
                  {promoterCopied ? "✓ Link Copiado!" : "Copiar Link ?ref 📋"}
                </button>
                <a
                  href="/promotor/leads"
                  class="inline-flex items-center gap-2 text-xs py-2.5 px-5 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
                >
                  Ver Meus Leads →
                </a>
              {:else if isTrainingBlocked}
                <a
                  href="/promotor/treinamento"
                  class="btn inline-flex items-center gap-2 text-xs py-2.5 px-5 font-bold uppercase tracking-wider text-[var(--ink)]"
                >
                  Iniciar Aulas do Treino →
                </a>
              {/if}
            </div>
          </div>

          <!-- Trava de Treinamento Obrigatório (LMS) -->
          {#if isTrainingBlocked}
            <div
              class="p-5 mb-6 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs sm:text-sm"
            >
              <div class="flex items-start gap-3">
                <span class="text-2xl">⚠️</span>
                <div>
                  <strong class="text-amber-100 font-bold block text-base"
                    >Trava Ativa: Matérias Obrigatórias Pendentes</strong
                  >
                  <p class="mt-1 text-white/80 leading-relaxed">
                    Você possui 2 matérias do curso de consultoria educacional pendentes. Responda
                    as questões e obtenha a homologação para liberar sua captação de leads.
                  </p>
                  <div class="mt-3">
                    <a
                      href="/promotor/treinamento"
                      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs"
                    >
                      Acessar Módulo 1: Técnicas de Abordagem →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          {/if}

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span class="text-xs text-white/60 uppercase font-semibold">Leads Ativos</span>
              <p class="text-2xl font-bold text-white mt-1">24</p>
              <p class="text-xs text-emerald-400 mt-1">+3 nas últimas 24h</p>
            </div>
            <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span class="text-xs text-white/60 uppercase font-semibold"
                >Matrículas Confirmadas</span
              >
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
        <!-- AMBIENTE DO POLO REGIONAL (COORDENADOR) -->
        <div
          class="w-full overflow-hidden relative rounded-3xl p-6 sm:p-8 text-white glass-panel border border-white/15 bg-gradient-to-br from-[#0b1220]/90 to-[#002776]/90 shadow-2xl"
        >
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6"
          >
            <div>
              <div
                class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-xs font-semibold text-blue-300 mb-2"
              >
                Secretaria do Polo Regional
              </div>
              <h2 class="text-2xl sm:text-3xl font-display text-white">
                Conferência Documental & Turmas
              </h2>
              <p class="text-xs sm:text-sm text-white/70 mt-1">
                Validação de documentação física, homologação de candidatos e entrega de certificados.
              </p>
            </div>

            <div class="flex items-center gap-3">
              <a
                href="/polo/matriculas"
                class="inline-flex items-center gap-2 text-xs py-2.5 px-5 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
              >
                Acessar Fila de Análise (5) →
              </a>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span class="text-xs text-white/60 uppercase font-semibold"
                >Fila de Conferência</span
              >
              <p class="text-2xl font-bold text-amber-300 mt-1">5 pendências</p>
              <p class="text-xs text-white/60 mt-1">RG, Histórico e Selfies</p>
            </div>
            <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span class="text-xs text-white/60 uppercase font-semibold">Bancas Presenciais</span>
              <p class="text-2xl font-bold text-blue-300 mt-1">2 agendadas</p>
              <p class="text-xs text-white/60 mt-1">Próxima sessão: Quinta-feira</p>
            </div>
            <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span class="text-xs text-white/60 uppercase font-semibold">Diplomas Prontos</span>
              <p class="text-2xl font-bold text-emerald-400 mt-1">4 para retirada</p>
              <p class="text-xs text-white/60 mt-1">Aguardando assinatura do concluinte</p>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Navegação Interna Contextual do Ambiente Ativo via RoleAdaptiveNavDock -->
    <slot {activeRole} />
  </div>
{/if}
