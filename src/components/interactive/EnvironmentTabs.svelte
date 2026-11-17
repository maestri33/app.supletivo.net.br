<script lang="ts">
  import Tabs, { type TabItem } from "@/components/ui/Tabs.svelte";
  import { normalizeUserRoles, type AppEnvironment } from "@/lib/roles";

  interface Props {
    roles?: string[];
    studentName?: string;
    partnerUrl?: string | null;
    stickyTop?: boolean;
    activeRole?: string;
    onRoleChange?: (role: string) => void;
  }

  let {
    roles = [],
    studentName,
    partnerUrl,
    stickyTop = true,
    activeRole: controlledActiveRole,
    onRoleChange,
  }: Props = $props();

  let activeRoles = $derived(normalizeUserRoles(roles));
  let internalRole = $state<string>(activeRoles[0] || "aluno");
  let currentActiveRole = $derived(controlledActiveRole || internalRole);

  const tabsConfig: Record<string, TabItem> = {
    aluno: { title: "🎓 Aluno", value: "aluno" },
    promotor: { title: "💼 Promotor", value: "promotor" },
    polo: { title: "🏫 Polo", value: "polo" },
  };

  let tabs = $derived(
    activeRoles.map((role) => tabsConfig[role] || { title: role, value: role })
  );

  function handleTabChange(newRole: string) {
    if (controlledActiveRole === undefined) {
      internalRole = newRole;
    }
    onRoleChange?.(newRole);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("supletivo:role-change", { detail: { role: newRole } })
      );
    }
  }
</script>

{#if activeRoles.length > 1}
  <header
    class="w-full z-30 transition-all duration-200 {stickyTop ? 'sticky top-0' : ''}"
    aria-label="Alternância de Ambiente de Usuário Multi-Role"
  >
    <div class="w-full bg-[var(--ink)]/90 backdrop-blur-xl border-b border-white/10 px-4 py-2.5 shadow-md">
      <div class="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold uppercase tracking-wider text-white/60">Ambientes:</span>
          <Tabs
            {tabs}
            value={currentActiveRole}
            onChange={handleTabChange}
            ariaLabel="Seletor de ambiente institucional"
            tablistClassName="bg-black/30 border-white/10 py-1 px-1.5"
            tabClassName="py-1.5 px-3.5 text-xs min-h-[36px]"
          />
        </div>

        {#if studentName}
          <div class="hidden sm:flex items-center gap-2 text-xs text-white/70">
            <span>Conectado como</span>
            <strong class="text-white font-semibold">{studentName}</strong>
          </div>
        {/if}
      </div>
    </div>
  </header>
{/if}
