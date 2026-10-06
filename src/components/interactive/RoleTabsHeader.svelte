<script lang="ts">
  import { onMount } from "svelte";
  import { whoami } from "@/lib/api";
  import { getAccessToken, saveLogin } from "@/lib/session";

  interface RoleConfig {
    id: "student" | "promoter" | "hub" | "admin";
    label: string;
    icon: string;
    external?: boolean;
    url?: string;
  }

  const ALL_ROLES: RoleConfig[] = [
    { id: "student", label: "Aluno", icon: "🎓" },
    { id: "promoter", label: "Promotor", icon: "💼" },
    { id: "hub", label: "Polo", icon: "🏫" },
    { id: "admin", label: "Admin", icon: "⚙️", external: true, url: "https://admin.supletivo.net.br" },
  ];

  let currentRole = $state<"student" | "promoter" | "hub" | "admin">("student");
  let userRoles = $state<RoleConfig[]>([]);
  let roleStatuses = $state<Record<string, string>>({});
  let isLoaded = $state(false);

  function resolvePathForRole(roleId: "student" | "promoter" | "hub" | "admin"): string {
    if (roleId === "admin") {
      return "https://admin.supletivo.net.br";
    }
    const status = (roleStatuses[roleId] || "").toLowerCase().trim();
    if (roleId === "student") {
      if (status === "lead") return "/student/lead";
      if (status === "veteran") return "/student/veteran";
      if (status === "active") return "/student";
      return "/student/enrollment";
    }
    if (roleId === "promoter") {
      if (status === "candidate") return "/promoter/candidate";
      if (status === "training") return "/promoter/training";
      if (status === "suspended") return "/promoter/suspended";
      return "/promoter/active";
    }
    if (roleId === "hub") {
      if (status === "review") return "/hub/review";
      return "/hub/active";
    }
    return "/";
  }

  function handleSwitchRole(role: RoleConfig) {
    if (typeof window === "undefined") return;
    if (role.external && role.url) {
      window.open(role.url, "_blank");
      return;
    }
    localStorage.setItem("supletivo_active_role", role.id);
    currentRole = role.id;
    const targetUrl = resolvePathForRole(role.id);
    window.location.href = targetUrl;
  }

  function populateRolesFromSession(rolesList: string[], statuses: Record<string, string>) {
    const normRoles = rolesList.map((r) => {
      const s = String(r).toLowerCase().trim();
      if (["aluno", "student", "lead", "enrollment", "veteran"].includes(s)) return "student";
      if (["promotor", "promoter", "candidate", "training"].includes(s)) return "promoter";
      if (["polo", "hub", "coordinator"].includes(s)) return "hub";
      if (["admin", "staff", "superuser"].includes(s)) return "admin";
      return s;
    });
    const uniqueNorm = Array.from(new Set(normRoles));
    userRoles = ALL_ROLES.filter((r) => uniqueNorm.includes(r.id));
    roleStatuses = statuses || {};
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
        const statuses: Record<string, string> = session.role_statuses || {};
        if (rolesList.length > 0) {
          populateRolesFromSession(rolesList, statuses);
        }
      }
    } catch {
      // fallback
    }

    // Auto-hidratação via whoami se autenticado
    const token = getAccessToken();
    if (token) {
      whoami()
        .then((w) => {
          if (w && Array.isArray(w.roles) && w.roles.length > 0) {
            populateRolesFromSession(w.roles, w.role_statuses || {});
            try {
              const raw = localStorage.getItem("supletivo.login");
              const current = raw ? JSON.parse(raw) : {};
              saveLogin({
                ...current,
                roles: w.roles,
                role_statuses: w.role_statuses || {},
                name: w.name || current.name,
              });
            } catch {}
          }
        })
        .catch(() => {})
        .finally(() => {
          isLoaded = true;
        });
    } else {
      isLoaded = true;
    }
  });

  const STATUS_LABELS_PT: Record<string, string> = {
    lead: "Ativação",
    enrollment: "Matrícula",
    candidate: "Credenciamento",
    training: "Treinamento",
    active: "Ativo",
    review: "Revisão",
    veteran: "Concluído",
    suspended: "Suspenso",
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
        onclick={() => handleSwitchRole(role)}
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
