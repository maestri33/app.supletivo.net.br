<script lang="ts">
  import { onMount } from "svelte";
  import { whoami } from "@/lib/api";
  import { getAccessToken, saveLogin } from "@/lib/session";
  import { getRoleDestination, normalizeUserRoles, type CanonicalEnvironment } from "@/lib/roles";

  interface RoleConfig {
    id: CanonicalEnvironment;
    label: string;
    icon: string;
  }

  const ALL_ROLES: RoleConfig[] = [
    { id: "student", label: "Aluno", icon: "🎓" },
    { id: "admin", label: "Administrador", icon: "⚙️" },
  ];

  let currentRole = $state<CanonicalEnvironment>("student");
  let userRoles = $state<RoleConfig[]>([]);
  let roleStatuses = $state<Record<string, string>>({});
  let statusText = $state<string | null>(null);
  let substatusText = $state<string | null>(null);
  let isLoaded = $state(false);

  function resolvePathForRole(roleId: CanonicalEnvironment): string {
    if (roleId === "admin") return "/admin/dashboard";
    return (
      getRoleDestination(
        {
          roles: userRoles.map((r) => (r.id === "student" ? "client" : "admin")),
          role_statuses: roleStatuses,
          status: statusText,
          substatus: substatusText,
        },
        "student"
      ) ?? "/student"
    );
  }

  function handleSwitchRole(role: RoleConfig) {
    if (typeof window === "undefined") return;
    localStorage.setItem("supletivo_active_role", role.id);
    currentRole = role.id;
    window.location.href = resolvePathForRole(role.id);
  }

  function populateRolesFromSession(
    rolesList: string[],
    statuses: Record<string, string>,
    status?: string | null,
    substatus?: string | null
  ) {
    const normalized = normalizeUserRoles(rolesList);
    userRoles = ALL_ROLES.filter((r) => normalized.includes(r.id));
    roleStatuses = statuses || {};
    statusText = status ?? null;
    substatusText = substatus ?? null;
  }

  onMount(() => {
    if (typeof window === "undefined") return;

    const path = window.location.pathname;
    if (path.startsWith("/admin")) {
      currentRole = "admin";
    } else if (path.startsWith("/student")) {
      currentRole = "student";
    }

    try {
      const raw = localStorage.getItem("supletivo.login");
      if (raw) {
        const session = JSON.parse(raw);
        const rolesList: string[] = session.roles || [];
        const statuses: Record<string, string> = session.role_statuses || {};
        if (rolesList.length > 0) {
          populateRolesFromSession(rolesList, statuses, session.status, session.substatus);
        }
      }
    } catch {}

    const token = getAccessToken();
    if (token) {
      whoami()
        .then((w) => {
          if (w && Array.isArray(w.roles)) {
            populateRolesFromSession(w.roles, w.role_statuses || {}, w.status, w.substatus);
            try {
              const raw = localStorage.getItem("supletivo.login");
              const current = raw ? JSON.parse(raw) : {};
              saveLogin({
                ...current,
                roles: w.roles,
                role_statuses: w.role_statuses || {},
                active_role: w.active_role,
                status: w.status,
                substatus: w.substatus,
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
    payment_pending: "Pagamento",
    pre_enrolled: "Matrícula",
    enrolled: "Ativo",
    exam_scheduled: "Prova",
    awaiting_pickup: "Diploma",
    graduated: "Concluído",
    active: "Ativo",
  };
</script>

{#if isLoaded && userRoles.length > 1}
  <nav aria-label="Seleção de Perfil" class="inline-flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
    {#each userRoles as role (role.id)}
      {@const isActive = currentRole === role.id}
      {@const status = role.id === "admin" ? "active" : (roleStatuses.client ?? roleStatuses.student)}
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
