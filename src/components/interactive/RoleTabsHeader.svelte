<script lang="ts">
  import { onMount } from "svelte";

  interface RoleConfig {
    id: "student" | "promoter" | "hub";
    label: string;
    icon: string;
  }

  const ALL_ROLES: RoleConfig[] = [
    { id: "student", label: "Aluno", icon: "🎓" },
    { id: "promoter", label: "Promotor", icon: "💼" },
    { id: "hub", label: "Polo", icon: "🏫" },
  ];

  let currentRole = $state<"student" | "promoter" | "hub">("student");
  let userRoles = $state<RoleConfig[]>([]);
  let roleStatuses = $state<Record<string, string>>({});
  let isLoaded = $state(false);

  function resolvePathForRole(roleId: "student" | "promoter" | "hub"): string {
    const status = roleStatuses[roleId];
    if (roleId === "student") {
      if (status === "lead") return "/student/lead";
      return "/student/enrollment";
    }
    if (roleId === "promoter") {
      if (status === "candidate") return "/promoter/candidate";
      if (status === "training") return "/promoter/training";
      return "/promoter/active";
    }
    if (roleId === "hub") {
      if (status === "review") return "/hub/review";
      return "/hub/active";
    }
    return "/";
  }

  function handleSwitchRole(roleId: "student" | "promoter" | "hub") {
    if (typeof window === "undefined") return;
    localStorage.setItem("supletivo_active_role", roleId);
    currentRole = roleId;
    const targetUrl = resolvePathForRole(roleId);
    window.location.href = targetUrl;
  }

  onMount(() => {
    if (typeof window === "undefined") return;

    // Detecta role pela URL atual
    const path = window.location.pathname;
    if (path.startsWith("/promoter") || path.startsWith("/promotor")) {
      currentRole = "promoter";
    } else if (path.startsWith("/hub") || path.startsWith("/polo")) {
      currentRole = "hub";
    } else if (path.startsWith("/student") || path.startsWith("/aluno")) {
      currentRole = "student";
    }

    try {
      const raw = localStorage.getItem("supletivo.login");
      if (raw) {
        const session = JSON.parse(raw);
        const rolesList: string[] = session.roles || [];
        roleStatuses = session.role_statuses || {};

        // Filtra as roles do usuário (excluindo admin conforme regra)
        const matched = ALL_ROLES.filter((r) => rolesList.includes(r.id));
        userRoles = matched;
      } else {
        userRoles = [];
      }
    } catch {
      userRoles = [];
    }

    isLoaded = true;
  });
  const STATUS_LABELS_PT: Record<string, string> = {
    lead: "Ativação",
    enrollment: "Matrícula",
    candidate: "Credenciamento",
    training: "Treinamento",
    active: "Ativo",
    review: "Revisão",
  };
</script>

{#if isLoaded && userRoles.length > 1}
  <nav aria-label="Seleção de Perfil" class="inline-flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
    {#each userRoles as role (role.id)}
      {@const isActive = currentRole === role.id}
      {@const status = roleStatuses[role.id]}
      {@const statusLabel = status ? (STATUS_LABELS_PT[status.toLowerCase()] || status) : null}
      <button
        type="button"
        onclick={() => handleSwitchRole(role.id)}
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer {isActive
          ? 'bg-[var(--blue-deep)] text-[var(--yellow)] border border-[var(--blue)] shadow-md'
          : 'text-white/70 hover:text-white hover:bg-white/10'}"
        title="Alternar para perfil de {role.label}"
      >
        <span class="text-sm">{role.icon}</span>
        <span>{role.label}</span>
        {#if statusLabel}
          <span class="text-[9px] uppercase tracking-wider font-semibold opacity-75 px-1 rounded {isActive ? 'bg-black/25 text-white' : 'bg-white/10 text-white/60'}">
            {statusLabel}
          </span>
        {/if}
      </button>
    {/each}
  </nav>
{/if}
