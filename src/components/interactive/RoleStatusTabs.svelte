<script lang="ts">
  import { onMount } from "svelte";
  import Tabs from "@/components/ui/Tabs.svelte";
  import RoleAdaptiveNavDock from "@/components/interactive/RoleAdaptiveNavDock.svelte";
  import type { UserRole } from "./dock/types";

  interface Props {
    initialRole?: UserRole;
    initialVariant?: "bottom-bar" | "floating";
  }

  let { initialRole = "aluno", initialVariant = "bottom-bar" }: Props = $props();

  let hydrated = $state(false);
  let activeRole = $state<UserRole>(initialRole);
  let dockVariant = $state<"bottom-bar" | "floating">(initialVariant);

  let studentStatus = $state("awaiting_documents");
  let promoterStatus = $state("candidate");
  let poloStatus = $state("pending_validation");

  onMount(() => {
    hydrated = true;
  });

  const studentTabs = [
    { title: "1. Envio de Documentos", value: "awaiting_documents", badge: "Pendente" },
    { title: "2. Análise da Secretaria", value: "documents_under_review", badge: "Em Análise" },
    { title: "3. Aluno Ativo & Provas", value: "active", badge: "Cursando" },
    { title: "4. Conclusão & Diploma", value: "veteran", badge: "Diploma MEC" },
  ];

  const promoterTabs = [
    { title: "1. Credenciamento", value: "candidate", badge: "Pendente" },
    { title: "2. Treinamento", value: "training", badge: "Trava LMS" },
    { title: "3. Promotor Ativo", value: "active", badge: "Links & PIX" },
  ];

  const poloTabs = [
    { title: "1. Fila de Conferência", value: "pending_validation", badge: "5 Pendentes" },
    { title: "2. Polo Operacional", value: "active", badge: "Regular" },
  ];

  let studentDockState = $derived({
    status:
      studentStatus === "awaiting_documents"
        ? "enrollment"
        : studentStatus === "documents_under_review"
          ? "awaiting_release"
          : studentStatus === "veteran"
            ? "veteran"
            : "active",
    pendingDocsCount: studentStatus === "awaiting_documents" ? 2 : 0,
    hasPartnerUrl: studentStatus === "active",
    enrollmentStep: studentStatus === "awaiting_documents" ? "awaiting_documents" : undefined,
    rgStatus: studentStatus === "awaiting_documents" ? "rejected" : "approved",
    addressStatus: studentStatus === "awaiting_documents" ? "under_review" : "approved",
    educationStatus: studentStatus === "awaiting_documents" ? "pending" : "approved",
    selfieStatus: studentStatus === "awaiting_documents" ? "pending" : "approved",
    examStatus: studentStatus === "veteran" ? "approved" : "pending",
  });

  let promoterDockState = $derived({
    status: promoterStatus,
    newLeadsCount: promoterStatus === "active" ? 3 : 0,
    isCandidate: promoterStatus === "candidate",
    isTrainingBlocked: promoterStatus === "training",
    onboardingStatus: promoterStatus === "candidate" ? "under_review" : "approved",
    pixStatus: promoterStatus === "candidate" ? "rejected" : "approved",
    termsStatus: promoterStatus === "candidate" ? "approved" : "approved",
  });

  let poloDockState = $derived({
    status: poloStatus,
    pendingValidationCount: poloStatus === "pending_validation" ? 5 : 0,
    pendingExamsCount: 0,
    readyDiplomasCount: 0,
  });
</script>

<div
  data-testid="role-status-tabs-root"
  data-hydrated={hydrated ? "true" : "false"}
  class="w-full flex flex-col items-center pb-32"
>
  <!-- Top Controls: Role Selector & Dock Variant Switcher -->
  <div class="w-full max-w-4xl px-4 py-4 space-y-4">
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--ink)]/80 border border-white/15 backdrop-blur-xl">
      <!-- Seletor de Role -->
      <div class="flex items-center gap-2">
        <span class="text-xs font-bold uppercase tracking-wider text-white/60">Perfil:</span>
        <div class="inline-flex rounded-xl bg-white/5 p-1 border border-white/10">
          <button
            type="button"
            onclick={() => { activeRole = "aluno"; }}
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors duration-200 touch-manipulation {activeRole === 'aluno' ? 'bg-[var(--blue)] text-white shadow-md' : 'text-white/70 hover:text-white'}"
          >
            🎓 Aluno
          </button>
          <button
            type="button"
            onclick={() => { activeRole = "promotor"; }}
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors duration-200 touch-manipulation {activeRole === 'promotor' ? 'bg-[var(--blue)] text-white shadow-md' : 'text-white/70 hover:text-white'}"
          >
            💼 Promotor
          </button>
          <button
            type="button"
            onclick={() => { activeRole = "polo"; }}
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors duration-200 touch-manipulation {activeRole === 'polo' ? 'bg-[var(--blue)] text-white shadow-md' : 'text-white/70 hover:text-white'}"
          >
            🏫 Polo
          </button>
        </div>
      </div>

      <!-- Seletor de Variante do Dock -->
      <div class="flex items-center gap-2">
        <span class="text-xs font-bold uppercase tracking-wider text-white/60">Estilo do Dock:</span>
        <div class="inline-flex rounded-xl bg-white/5 p-1 border border-white/10">
          <button
            type="button"
            onclick={() => { dockVariant = "bottom-bar"; }}
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors duration-200 touch-manipulation {dockVariant === 'bottom-bar' ? 'bg-emerald-600 text-white shadow-md' : 'text-white/70 hover:text-white'}"
          >
            Opção 1 (Barra Nativa)
          </button>
          <button
            type="button"
            onclick={() => { dockVariant = "floating"; }}
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors duration-200 touch-manipulation {dockVariant === 'floating' ? 'bg-[var(--yellow)] text-black shadow-md' : 'text-white/70 hover:text-white'}"
          >
            Cápsula Flutuante
          </button>
        </div>
      </div>
    </div>

    <!-- TABS DE STATUS DO PERFIL SELECIONADO -->
    <div class="w-full">
      {#if activeRole === "aluno"}
        <Tabs
          tabs={studentTabs}
          value={studentStatus}
          onChange={(newStatus) => { studentStatus = newStatus; }}
          ariaLabel="Etapas e Status do Aluno"
          tablistWrapperClassName="mb-4"
        >
          {#snippet children({ activeValue })}
            <div class="w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <span class="text-xs font-semibold text-amber-400 uppercase tracking-wider">Etapa do Aluno</span>
                  <h3 class="text-xl font-bold text-white">Status Selecionado: {activeValue}</h3>
                </div>
              </div>
              <p class="text-sm text-white/80 leading-relaxed">
                Demonstração de alternância dinâmica do dock adaptativo conforme a evolução do aluno no sistema.
              </p>
            </div>
          {/snippet}
        </Tabs>
      {:else if activeRole === "promotor"}
        <Tabs
          tabs={promoterTabs}
          value={promoterStatus}
          onChange={(newStatus) => { promoterStatus = newStatus; }}
          ariaLabel="Etapas e Status do Promotor"
          tablistWrapperClassName="mb-4"
        >
          {#snippet children({ activeValue })}
            <div class="w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <span class="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Etapa do Promotor</span>
                  <h3 class="text-xl font-bold text-white">Status Selecionado: {activeValue}</h3>
                </div>
              </div>
              <p class="text-sm text-white/80 leading-relaxed">
                Demonstração da adaptação do dock para credenciamento (candidato), trava LMS (treinamento) e painel ativo.
              </p>
            </div>
          {/snippet}
        </Tabs>
      {:else if activeRole === "polo"}
        <Tabs
          tabs={poloTabs}
          value={poloStatus}
          onChange={(newStatus) => { poloStatus = newStatus; }}
          ariaLabel="Etapas e Status do Coordenador do Polo"
          tablistWrapperClassName="mb-4"
        >
          {#snippet children({ activeValue })}
            <div class="w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <span class="text-xs font-semibold text-sky-400 uppercase tracking-wider">Etapa do Polo</span>
                  <h3 class="text-xl font-bold text-white">Status Selecionado: {activeValue}</h3>
                </div>
              </div>
              <p class="text-sm text-white/80 leading-relaxed">
                Demonstração da visão de secretaria de polo e conferência operacional.
              </p>
            </div>
          {/snippet}
        </Tabs>
      {/if}
    </div>
  </div>

  <!-- RENDERIZAÇÃO DO DOCK SINCRONIZADO COM O STATUS ATIVO -->
  <RoleAdaptiveNavDock
    role={activeRole}
    variant={dockVariant}
    studentState={studentDockState}
    promoterState={promoterDockState}
    poloState={poloDockState}
    bypassAuth={true}
  />
</div>
