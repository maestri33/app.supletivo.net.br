<script lang="ts">
  import { onMount } from "svelte";
  import { whoami, getStudentMe, getLeadMe } from "@/lib/api";
  import { getAccessToken, clearSession } from "@/lib/session";
  import StudentLockedPaywall from "./StudentLockedPaywall.svelte";
  import EnvironmentTabs from "./EnvironmentTabs";
  import RoleAdaptiveNavDock from "./RoleAdaptiveNavDock";

  let loading = $state(true);
  let isLocked = $state(false);
  let userRoles = $state<string[]>(["aluno"]);
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
</script>

{#if loading}
  <div class="flex-1 flex flex-col items-center justify-center p-12 text-white/70">
    <div class="size-10 border-3 border-white/20 border-t-[var(--yellow)] rounded-full animate-spin mb-4"></div>
    <p class="text-xs uppercase tracking-wider font-semibold">Carregando seu ambiente...</p>
  </div>
{:else if isLocked}
  <!-- ESTADO TRAVADO: 3 Caminhos Exclusivos (Sem Dock de Evasão nem Tabs) -->
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
       Se o usuário tiver mais de uma role: EnvironmentTabs exibe o seletor das roles dele.
       Se tiver apenas 1 role: EnvironmentTabs renderiza direto o ambiente dele sem barra de abas! -->
  <div class="w-full flex flex-col items-center gap-6">
    <EnvironmentTabs
      client:load
      roles={userRoles}
      studentName={studentName}
      partnerUrl={partnerUrl}
    />

    <div class="fixed bottom-6 inset-x-0 z-50 pointer-events-none flex justify-center">
      <div class="pointer-events-auto">
        <RoleAdaptiveNavDock
          client:load
          initialRole={userRoles[0] as any}
          currentPath={typeof window !== "undefined" ? window.location.pathname : "/painel"}
        />
      </div>
    </div>
  </div>
{/if}
