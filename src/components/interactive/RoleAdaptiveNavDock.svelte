<script lang="ts">
  import { onMount } from "svelte";
  import { dockState } from "@/lib/dockState.svelte";
  import DockIcon from "@/components/icons/DockIcon.svelte";
  import type { UserRole } from "./dock/types";

  interface Props {
    initialRole?: UserRole;
    role?: UserRole;
    variant?: "bottom-bar" | "floating";
    currentPath?: string;
    onNavigate?: (href: string) => void;
    onLogout?: () => void;
    bypassAuth?: boolean;
    studentState?: Record<string, any>;
    adminState?: Record<string, any>;
  }

  let {
    initialRole = "student",
    role: controlledRole,
    variant = "bottom-bar",
    currentPath = "/student",
    onNavigate,
    onLogout,
    bypassAuth = false,
    studentState: controlledStudentState,
    adminState: controlledAdminState,
  }: Props = $props();

  onMount(() => {
    dockState.init(controlledRole || initialRole, currentPath, bypassAuth);
  });

  let activeRole = $derived(controlledRole || dockState.activeRole || initialRole);
  let effectiveStudentState = $derived({ ...dockState.studentState, ...controlledStudentState });
  let effectiveAdminState = $derived({ ...dockState.adminState, ...controlledAdminState });

  let isLeadWizard = $derived(
    activeRole === "student" &&
      (effectiveStudentState.status === "lead" ||
        effectiveStudentState.status === "payment_pending" ||
        currentPath.startsWith("/student/lead"))
  );

  let shouldShow = $derived(
    dockState.isAuthenticated && (!dockState.isLocked || isLeadWizard)
  );

  interface DockItem {
    id: string;
    title: string;
    icon: string;
    href?: string;
    onClick?: () => void;
    isActive?: boolean;
    disabled?: boolean;
    badge?: string | number;
    badgeVariant?: "danger" | "success" | "warning" | "info";
    statusIndicator?: "danger" | "warning" | "success" | "normal" | "disabled";
  }

  function handleItemClick(item: DockItem, e: MouseEvent) {
    if (item.disabled) {
      e.preventDefault();
      return;
    }
    if (item.onClick) {
      e.preventDefault();
      item.onClick();
      return;
    }
    if (onNavigate && item.href) {
      e.preventDefault();
      onNavigate(item.href);
    }
  }

  function handleLogout() {
    if (onLogout) {
      onLogout();
    } else {
      dockState.logout();
    }
  }

  let items = $derived.by<DockItem[]>(() => {
    const rawStatus = (effectiveStudentState.status || "").toLowerCase();
    const rawSubstatus = (
      effectiveStudentState.enrollmentStep ||
      effectiveStudentState.substatus ||
      ""
    ).toLowerCase();
    const cleanPath = currentPath.split("#")[0];
    const currentHash = dockState.currentHash;

    if (activeRole === "admin") {
      const pendingDocs = effectiveAdminState.pendingDocsCount ?? 0;
      const pendingSiga = effectiveAdminState.pendingSigaCount ?? 0;
      const pendingExams = effectiveAdminState.pendingExamsCount ?? 0;
      const pendingDiplomas = effectiveAdminState.pendingDiplomasCount ?? 0;

      return [
        {
          id: "dashboard",
          title: "Painel",
          icon: "home",
          href: "/admin/dashboard",
          isActive: cleanPath === "/admin/dashboard" || cleanPath === "/admin",
          statusIndicator: "normal",
        },
        {
          id: "documents",
          title: "Documentos",
          icon: "file-check",
          href: "/admin/documentos",
          isActive: cleanPath === "/admin/documentos",
          badge: pendingDocs > 0 ? pendingDocs : undefined,
          badgeVariant: "warning",
          statusIndicator: pendingDocs > 0 ? "warning" : "normal",
        },
        {
          id: "siga",
          title: "SIGA",
          icon: "school",
          href: "/admin/credenciais-siga",
          isActive: cleanPath === "/admin/credenciais-siga",
          badge: pendingSiga > 0 ? pendingSiga : undefined,
          badgeVariant: "info",
          statusIndicator: pendingSiga > 0 ? "warning" : "normal",
        },
        {
          id: "fees",
          title: "Taxa",
          icon: "cash",
          href: "/admin/taxa-parceira",
          isActive: cleanPath === "/admin/taxa-parceira",
          statusIndicator: "normal",
        },
        {
          id: "exams",
          title: "Provas",
          icon: "award",
          href: "/admin/provas",
          isActive: cleanPath === "/admin/provas",
          badge: pendingExams > 0 ? pendingExams : undefined,
          badgeVariant: "info",
          statusIndicator: "normal",
        },
        {
          id: "diplomas",
          title: "Diplomas",
          icon: "certificate",
          href: "/admin/diplomas",
          isActive: cleanPath === "/admin/diplomas",
          badge: pendingDiplomas > 0 ? pendingDiplomas : undefined,
          badgeVariant: "success",
          statusIndicator: "normal",
        },
        { id: "logout", title: "Sair", icon: "logout", onClick: handleLogout },
      ];
    }

    // STUDENT
    if (
      rawStatus === "lead" ||
      rawStatus === "payment_pending" ||
      cleanPath.startsWith("/student/lead")
    ) {
      return [
        {
          id: "payment",
          title: "Pagamento",
          icon: "credit-card",
          href: "/student/lead/payment",
          isActive: true,
          statusIndicator: effectiveStudentState.isCheckoutReady ? "success" : "warning",
        },
        { id: "logout", title: "Sair", icon: "logout", onClick: handleLogout },
      ];
    }

    if (
      rawSubstatus === "pending_siga" &&
      (cleanPath === "/student/enrollment" || cleanPath === "/student" || cleanPath === "/tabs-status")
    ) {
      const section = currentHash.replace("#", "") || "tracking";
      return [
        { id: "tracking", title: "Acompanhamento", icon: "progress", href: "/student/enrollment#tracking", isActive: section === "tracking", statusIndicator: "normal" },
        { id: "documents", title: "Meus documentos", icon: "file-text", href: "/student/enrollment#documents", isActive: section === "documents", statusIndicator: "normal" },
        { id: "payment", title: "Pagamento", icon: "credit-card", href: "/student/enrollment#payment", isActive: section === "payment", statusIndicator: "normal" },
        { id: "contact", title: "Atendimento", icon: "messages", href: "/student/enrollment#contact", isActive: section === "contact", statusIndicator: "normal" },
      ];
    }

    if (
      rawStatus === "enrolled" ||
      rawStatus === "exam_scheduled" ||
      cleanPath.startsWith("/student/active")
    ) {
      const isDashboardActive =
        cleanPath === "/student/active/dashboard" ||
        cleanPath === "/student/active" ||
        cleanPath === "/student";
      const isAccessActive =
        cleanPath === "/student/active/access" || cleanPath === "/student/active/subjects";
      const isAssessmentsActive = cleanPath === "/student/active/assessments";

      const examIndicator =
        rawStatus === "exam_scheduled"
          ? "warning"
          : effectiveStudentState.examStatus === "approved"
          ? "success"
          : "normal";
      const examBadge =
        rawStatus === "exam_scheduled"
          ? "Agendada"
          : effectiveStudentState.examStatus === "approved"
          ? "Liberada"
          : undefined;

      return [
        { id: "dashboard", title: "Painel", icon: "home", href: "/student/active/dashboard", isActive: isDashboardActive, statusIndicator: "normal" },
        { id: "documents", title: "Documentos", icon: "file-text", href: "/student/active/documents", isActive: cleanPath === "/student/active/documents", statusIndicator: effectiveStudentState.pendingDocsCount ? "warning" : "normal" },
        { id: "access", title: "Acesso", icon: "book", href: "/student/active/access", isActive: isAccessActive, statusIndicator: "normal" },
        { id: "assessments", title: "Avaliações", icon: "award", href: "/student/active/assessments", isActive: isAssessmentsActive, badge: examBadge, badgeVariant: examIndicator === "success" ? "success" : "warning", statusIndicator: examIndicator },
        { id: "finance", title: "Financeiro", icon: "credit-card", href: "/student/active/finance", isActive: cleanPath === "/student/active/finance", statusIndicator: "normal" },
        { id: "logout", title: "Sair", icon: "logout", onClick: handleLogout },
      ];
    }

    if (
      rawStatus === "awaiting_pickup" ||
      rawStatus === "graduated" ||
      cleanPath.startsWith("/student/veteran")
    ) {
      return [
        { id: "dashboard", title: "Conclusão", icon: "award", href: "/student/veteran/dashboard", isActive: cleanPath === "/student/veteran/dashboard" || cleanPath === "/student/veteran", statusIndicator: "success" },
        { id: "records", title: "Histórico", icon: "file-text", href: "/student/veteran/records", isActive: cleanPath === "/student/veteran/records", statusIndicator: "success" },
        { id: "diploma", title: "Diploma", icon: "certificate", href: "/student/veteran/diploma", isActive: cleanPath === "/student/veteran/diploma", statusIndicator: (effectiveStudentState.diplomaStatus as any) || "normal" },
        { id: "assessments", title: "Prova", icon: "award", href: "/student/veteran/assessments", isActive: cleanPath === "/student/veteran/assessments", statusIndicator: "normal" },
        { id: "finance", title: "Financeiro", icon: "credit-card", href: "/student/veteran/finance", isActive: cleanPath === "/student/veteran/finance", statusIndicator: "normal" },
        { id: "logout", title: "Sair", icon: "logout", onClick: handleLogout },
      ];
    }

    // Default pre_enrolled onboarding steps
    const activeStep = cleanPath.endsWith("/address")
      ? "address"
      : cleanPath.endsWith("/education")
      ? "education"
      : cleanPath.endsWith("/selfie")
      ? "selfie"
      : "documents";

    return [
      { id: "documents", title: "RG", icon: "id", href: "/student/enrollment/rg", isActive: activeStep === "documents", statusIndicator: effectiveStudentState.rgStatus || "normal" },
      { id: "address", title: "Endereço", icon: "address", href: "/student/enrollment/address", isActive: activeStep === "address", statusIndicator: effectiveStudentState.addressStatus || "normal" },
      { id: "education", title: "Escolaridade", icon: "school", href: "/student/enrollment/education", isActive: activeStep === "education", statusIndicator: effectiveStudentState.educationStatus || "normal" },
      { id: "selfie", title: "Selfie", icon: "camera", href: "/student/enrollment/selfie", isActive: activeStep === "selfie", statusIndicator: effectiveStudentState.selfieStatus || "normal" },
      { id: "logout", title: "Sair", icon: "logout", onClick: handleLogout },
    ];
  });

  let displayedItems = $derived(
    activeRole === "student" ? items.filter((i) => i.id !== "logout") : items
  );

  function getIndicatorClasses(indicator?: string, disabled?: boolean) {
    if (disabled || indicator === "disabled") {
      return "opacity-35 grayscale contrast-75 cursor-not-allowed pointer-events-none border-dashed border-neutral-400";
    }
    switch (indicator) {
      case "danger":
        return "ring-2 ring-rose-500 shadow-[0_0_18px_rgba(244,63,94,0.7)] border-rose-500 text-rose-500";
      case "warning":
        return "ring-2 ring-amber-500 shadow-[0_0_18px_rgba(245,158,11,0.7)] border-amber-500 text-amber-500";
      case "success":
        return "ring-2 ring-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.7)] border-emerald-500 text-emerald-500";
      default:
        return "";
    }
  }

  function getBadgeClasses(variant?: string) {
    switch (variant) {
      case "danger": return "bg-[var(--danger)] text-white";
      case "success": return "bg-[var(--success)] text-white";
      case "warning": return "bg-amber-500 text-black";
      case "info": return "bg-[var(--info)] text-white";
      default: return "bg-[var(--yellow)] text-[var(--ink)]";
    }
  }
</script>

{#snippet bottomDockContent(item: DockItem)}
  <div class="relative flex h-8 w-8 items-center justify-center rounded-xl transition-colors duration-200 {getIndicatorClasses(item.statusIndicator, item.disabled)}">
    <div class="size-5">
      <DockIcon name={item.icon} />
    </div>
    {#if item.badge !== undefined && item.badge !== null}
      <span class="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-black shadow-md {getBadgeClasses(item.badgeVariant)}">
        {item.badge}
      </span>
    {/if}
  </div>
  <span class="text-[10px] tracking-tight whitespace-nowrap">{item.title}</span>
{/snippet}

{#snippet floatingDockContent(item: DockItem)}
  <div class="size-5 {getIndicatorClasses(item.statusIndicator, item.disabled)}">
    <DockIcon name={item.icon} />
  </div>
  <span class="sr-only">{item.title}</span>
  <span class="absolute -top-8 px-2 py-0.5 rounded-md bg-black/90 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md">
    {item.title}
  </span>
{/snippet}

{#if shouldShow}
  {#if variant === "bottom-bar"}
    <nav
      aria-label={`Navegação principal do ${activeRole}`}
      data-testid="role-adaptive-dock"
      data-app-dock="true"
      data-app-dock-mode="bottom-bar"
      class="fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-[var(--ink)]/90 backdrop-blur-2xl shadow-2xl pb-[env(safe-area-inset-bottom)]"
    >
      <div class="h-[2px] w-full bg-gradient-to-r from-[var(--green)] via-[var(--yellow)] to-[var(--blue)]"></div>
      <div class="mx-auto flex w-full max-w-lg items-center justify-around px-1 sm:px-2 py-2 overflow-x-auto">
        {#each displayedItems as item}
          {@const commonClasses = `flex min-h-12 min-w-11 flex-col items-center gap-1 p-1.5 sm:p-2 rounded-xl transition-[color,transform] duration-200 active:scale-95 cursor-pointer touch-manipulation ${
            item.isActive
              ? "text-[var(--yellow)] font-bold drop-shadow-[0_0_8px_rgba(255,204,0,0.3)]"
              : "text-white/70 hover:text-white"
          } ${item.disabled ? "opacity-40 pointer-events-none cursor-not-allowed" : ""}`}

          {#if item.onClick}
            <button
              type="button"
              onclick={(e) => handleItemClick(item, e)}
              disabled={item.disabled}
              aria-current={item.isActive ? "page" : undefined}
              class={commonClasses}
            >
              {@render bottomDockContent(item)}
            </button>
          {:else}
            <a
              href={item.href || "#"}
              onclick={(e) => handleItemClick(item, e)}
              aria-disabled={item.disabled || undefined}
              aria-current={item.isActive ? "page" : undefined}
              class={commonClasses}
            >
              {@render bottomDockContent(item)}
            </a>
          {/if}
        {/each}
      </div>
    </nav>
  {:else}
    <nav
      aria-label={`Navegação principal do ${activeRole}`}
      data-testid="role-adaptive-dock"
      data-app-dock="true"
      data-app-dock-mode="floating"
      class="fixed bottom-6 inset-x-0 z-50 flex justify-center items-center pointer-events-none"
    >
      <div class="pointer-events-auto flex items-center gap-2 p-2 rounded-full bg-[var(--ink)]/85 backdrop-blur-2xl border border-white/15 shadow-[var(--shadow-glass)]">
        {#each displayedItems as item}
          {@const commonClasses = `relative group flex size-11 items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer ${
            item.isActive
              ? "bg-[var(--blue)] text-white shadow-lg shadow-[var(--blue)]/40"
              : "text-white/70 hover:text-white hover:bg-white/10"
          } ${item.disabled ? "opacity-40 pointer-events-none" : ""}`}

          {#if item.onClick}
            <button
              type="button"
              onclick={(e) => handleItemClick(item, e)}
              disabled={item.disabled}
              aria-label={item.title}
              class={commonClasses}
            >
              {@render floatingDockContent(item)}
            </button>
          {:else}
            <a
              href={item.href || "#"}
              onclick={(e) => handleItemClick(item, e)}
              aria-label={item.title}
              aria-current={item.isActive ? "page" : undefined}
              class={commonClasses}
            >
              {@render floatingDockContent(item)}
            </a>
          {/if}
        {/each}
      </div>
    </nav>
  {/if}
{/if}
