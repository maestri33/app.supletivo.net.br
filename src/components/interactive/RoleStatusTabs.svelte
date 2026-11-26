<script lang="ts">
  import { onMount } from "svelte";
  import Tabs from "@/components/ui/Tabs.svelte";
  import RoleAdaptiveNavDock from "@/components/interactive/RoleAdaptiveNavDock.svelte";
  import type { UserRole } from "./dock/types";

  interface Props {
    initialRole?: UserRole;
    initialVariant?: "bottom-bar" | "floating";
  }

  let { initialRole = "student", initialVariant = "bottom-bar" }: Props = $props();

  let hydrated = $state(false);
  let activeRole = $state<UserRole>(initialRole);
  let dockVariant = $state<"bottom-bar" | "floating">(initialVariant);

  let studentStatus = $state("pre_enrolled");

  onMount(() => {
    hydrated = true;
  });

  const studentTabs = [
    { title: "1. Pagamento", value: "lead", badge: "Pendente" },
    { title: "2. Matrícula & Documentos", value: "pre_enrolled", badge: "Em Andamento" },
    { title: "3. Aluno Ativo & Provas", value: "enrolled", badge: "Cursando" },
    { title: "4. Conclusão & Diploma", value: "graduated", badge: "Diploma MEC" },
  ];

  let studentDockState = $derived({
    status: studentStatus,
    pendingDocsCount: studentStatus === "pre_enrolled" ? 2 : 0,
    hasPartnerUrl: studentStatus === "enrolled",
    rgStatus: studentStatus === "pre_enrolled" ? ("rejected" as const) : ("approved" as const),
    addressStatus: studentStatus === "pre_enrolled" ? ("under_review" as const) : ("approved" as const),
    educationStatus: studentStatus === "pre_enrolled" ? ("pending" as const) : ("approved" as const),
    selfieStatus: studentStatus === "pre_enrolled" ? ("pending" as const) : ("approved" as const),
    examStatus: studentStatus === "graduated" ? ("approved" as const) : ("pending" as const),
  });

  let adminDockState = $derived({
    pendingDocsCount: 4,
    pendingSigaCount: 2,
    pendingExamsCount: 1,
    pendingDiplomasCount: 1,
  });
</script>

<div
  data-testid="role-status-tabs-root"
  data-hydrated={hydrated ? "true" : "false"}
  class="w-full flex flex-col items-center pb-32"
>
  <div class="w-full max-w-4xl px-4 py-4 space-y-4">
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--ink)]/80 border border-white/15 backdrop-blur-xl">
      <div class="flex items-center gap-2">
        <span class="text-xs font-bold uppercase tracking-wider text-white/60">Perfil:</span>
        <div class="inline-flex rounded-xl bg-white/5 p-1 border border-white/10">
          <button
            type="button"
            onclick={() => { activeRole = "student"; }}
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors duration-200 touch-manipulation {activeRole === 'student' ? 'bg-[var(--blue)] text-white shadow-md' : 'text-white/70 hover:text-white'}"
          >
            🎓 Aluno
          </button>
          <button
            type="button"
            onclick={() => { activeRole = "admin"; }}
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors duration-200 touch-manipulation {activeRole === 'admin' ? 'bg-[var(--blue)] text-white shadow-md' : 'text-white/70 hover:text-white'}"
          >
            ⚙️ Admin
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-xs font-bold uppercase tracking-wider text-white/60">Estilo do Dock:</span>
        <div class="inline-flex rounded-xl bg-white/5 p-1 border border-white/10">
          <button
            type="button"
            onclick={() => { dockVariant = "bottom-bar"; }}
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors duration-200 touch-manipulation {dockVariant === 'bottom-bar' ? 'bg-emerald-600 text-white shadow-md' : 'text-white/70 hover:text-white'}"
          >
            Barra Nativa
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

    <div class="w-full">
      {#if activeRole === "student"}
        <Tabs
          tabs={studentTabs}
          value={studentStatus}
          onChange={(newStatus) => { studentStatus = newStatus; }}
          ariaLabel="Etapas e Status do Aluno"
          tablistWrapperClassName="mb-4"
        >
          {#snippet children({ activeValue })}
            <div class="w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4">
              <div class="border-b border-white/10 pb-4">
                <span class="text-xs font-semibold text-amber-400 uppercase tracking-wider">Etapa do Aluno</span>
                <h3 class="text-xl font-bold text-white">Status Selecionado: {activeValue}</h3>
              </div>
              <p class="text-sm text-white/80 leading-relaxed">
                Demonstração de alternância dinâmica do dock adaptativo conforme a evolução do aluno na máquina de estados v2.
              </p>
            </div>
          {/snippet}
        </Tabs>
      {:else}
        <div class="w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4">
          <div class="border-b border-white/10 pb-4">
            <span class="text-xs font-semibold text-sky-400 uppercase tracking-wider">Painel Administrativo</span>
            <h3 class="text-xl font-bold text-white">Operação Unificada (/admin/*)</h3>
          </div>
          <p class="text-sm text-white/80 leading-relaxed">
            Navegação administrativa entre Painel, Documentos, SIGA, Taxa Parceira, Provas e Diplomas.
          </p>
        </div>
      {/if}
    </div>
  </div>

  <RoleAdaptiveNavDock
    role={activeRole}
    variant={dockVariant}
    bypassAuth={true}
    studentState={studentDockState}
    adminState={adminDockState}
  />
</div>
