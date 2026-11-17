<script lang="ts">
  import { onMount } from "svelte";
  import { dockState, getLeadCheckoutReadyState } from "@/lib/dockState.svelte";
  import DockIcon from "@/components/icons/DockIcon.svelte";
  import type { UserRole, ItemHealthStatus } from "./dock/types";

  interface Props {
    initialRole?: UserRole;
    role?: UserRole;
    variant?: "bottom-bar" | "floating";
    currentPath?: string;
    onNavigate?: (href: string) => void;
    onLogout?: () => void;
    bypassAuth?: boolean;
    studentState?: Record<string, any>;
    promoterState?: Record<string, any>;
    poloState?: Record<string, any>;
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
    promoterState: controlledPromoterState,
    poloState: controlledPoloState,
  }: Props = $props();

  onMount(() => {
    dockState.init(controlledRole || initialRole, currentPath, bypassAuth);
  });

  let activeRole = $derived(controlledRole || dockState.activeRole || initialRole);
  let effectiveStudentState = $derived({ ...dockState.studentState, ...controlledStudentState });
  let effectivePromoterState = $derived({ ...dockState.promoterState, ...controlledPromoterState });
  let effectivePoloState = $derived({ ...dockState.poloState, ...controlledPoloState });

  let isLeadWizard = $derived(
    (activeRole === "student" || activeRole === "aluno") &&
    (effectiveStudentState.status === "lead" || currentPath.startsWith("/student/lead"))
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
    const cleanPath = currentPath.split("#")[0];
    const currentHash = dockState.currentHash;

    // 1. STUDENT
    if (activeRole === "student" || activeRole === "aluno") {
      if (rawStatus === "lead" || cleanPath.startsWith("/student/lead")) {
        const isCheckoutReady = Boolean(effectiveStudentState.isCheckoutReady || getLeadCheckoutReadyState());
        const modality = effectiveStudentState.selectedModality;
        const isMethodSelected = Boolean(modality && isCheckoutReady);
        const phase = effectiveStudentState.leadPhase ?? (cleanPath.endsWith("/checkout") ? "checkout" : "selection");

        const checkoutTitle = modality === "pix" ? "Checkout PIX" : modality === "credit_card" ? "Checkout Cartão" : "Checkout";
        const checkoutIcon = modality === "credit_card" ? "credit-card" : "pix";

        return [
          {
            id: "payment",
            title: "Forma de pagamento",
            icon: "credit-card",
            href: "/student/lead/payment",
            isActive: phase === "selection" || !isMethodSelected,
            statusIndicator: isMethodSelected ? "normal" : "warning",
            onClick: () => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("supletivo:lead-wizard-step", { detail: { step: "selection" } }));
              }
            },
          },
          {
            id: "checkout",
            title: checkoutTitle,
            icon: checkoutIcon,
            href: "/student/lead/checkout",
            isActive: phase === "checkout" && isMethodSelected,
            disabled: !isMethodSelected,
            statusIndicator: !isMethodSelected ? "disabled" : "success",
            onClick: () => {
              if (!isMethodSelected) return;
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("supletivo:lead-wizard-step", { detail: { step: "checkout" } }));
              }
            },
          },
          { id: "logout", title: "Sair", icon: "logout", onClick: handleLogout },
        ];
      }

      const releaseStatus = effectiveStudentState.enrollmentStep || rawStatus;
      if (["awaiting_release", "fee_paid", "fee_scheduled"].includes(releaseStatus) && cleanPath === "/student/enrollment") {
        const section = currentHash.replace("#", "") || "tracking";
        return [
          { id: "tracking", title: "Acompanhamento", icon: "progress", href: "/student/enrollment", isActive: section === "tracking", statusIndicator: "normal" },
          { id: "documents", title: "Meus documentos", icon: "file-text", href: "/student/enrollment#documents", isActive: section === "documents", statusIndicator: "normal" },
          { id: "payment", title: "Pagamento", icon: "credit-card", href: "/student/enrollment#payment", isActive: section === "payment", statusIndicator: "normal" },
          { id: "contact", title: "Falar com o polo", icon: "messages", href: "/student/enrollment#contact", isActive: section === "contact", statusIndicator: "normal" },
        ];
      }

      if (rawStatus === "active" || rawStatus === "exam_released" || rawStatus === "regular" || cleanPath.startsWith("/student/active")) {
        const isDashboardActive = cleanPath === "/student/active/dashboard" || cleanPath === "/student/active" || cleanPath === "/student";
        const isAccessActive = cleanPath === "/student/active/access" || cleanPath === "/student/active/subjects";
        const isAssessmentsActive = cleanPath === "/student/active/assessments";

        const examIndicator = effectiveStudentState.examStatus === "approved" ? "success" : effectiveStudentState.examStatus === "under_review" || rawStatus === "exam_released" ? "warning" : "normal";
        const examBadge = effectiveStudentState.examStatus === "approved" ? "Aprovado" : effectiveStudentState.examStatus === "under_review" || rawStatus === "exam_released" ? "Liberada" : undefined;

        return [
          { id: "dashboard", title: "Painel", icon: "home", href: "/student/active/dashboard", isActive: isDashboardActive, statusIndicator: "normal" },
          { id: "documents", title: "Documentos", icon: "file-text", href: "/student/active/documents", isActive: cleanPath === "/student/active/documents", statusIndicator: effectiveStudentState.pendingDocsCount ? "warning" : "normal" },
          { id: "access", title: "Acesso", icon: "book", href: "/student/active/access", isActive: isAccessActive, statusIndicator: "normal" },
          { id: "assessments", title: "Avaliações", icon: "award", href: "/student/active/assessments", isActive: isAssessmentsActive, badge: examBadge, badgeVariant: examIndicator === "success" ? "success" : "warning", statusIndicator: examIndicator },
          { id: "finance", title: "Financeiro", icon: "credit-card", href: "/student/active/finance", isActive: cleanPath === "/student/active/finance", statusIndicator: "normal" },
          { id: "logout", title: "Sair", icon: "logout", onClick: handleLogout },
        ];
      }

      if (rawStatus === "veteran" || rawStatus === "graduated" || rawStatus === "awaiting_diploma_issuance" || cleanPath.startsWith("/student/veteran")) {
        return [
          { id: "dashboard", title: "Conclusão", icon: "award", href: "/student/veteran/dashboard", isActive: cleanPath === "/student/veteran/dashboard" || cleanPath === "/student/veteran", statusIndicator: "success" },
          { id: "records", title: "Histórico", icon: "file-text", href: "/student/veteran/records", isActive: cleanPath === "/student/veteran/records", statusIndicator: "success" },
          { id: "diploma", title: "Diploma", icon: "certificate", href: "/student/veteran/diploma", isActive: cleanPath === "/student/veteran/diploma", statusIndicator: (effectiveStudentState.diplomaStatus as any) || "normal" },
          { id: "assessments", title: "Prova", icon: "award", href: "/student/veteran/assessments", isActive: cleanPath === "/student/veteran/assessments", statusIndicator: "normal" },
          { id: "finance", title: "Financeiro", icon: "credit-card", href: "/student/veteran/finance", isActive: cleanPath === "/student/veteran/finance", statusIndicator: "normal" },
          { id: "logout", title: "Sair", icon: "logout", onClick: handleLogout },
        ];
      }

      // Default Enrollment Document Upload
      const activeStep = cleanPath.endsWith("/address") ? "address" : cleanPath.endsWith("/education") ? "education" : cleanPath.endsWith("/selfie") ? "selfie" : "documents";
      return [
        { id: "documents", title: "RG", icon: "id", href: "/student/enrollment/rg", isActive: activeStep === "documents", statusIndicator: effectiveStudentState.rgStatus || "normal" },
        { id: "address", title: "Endereço", icon: "address", href: "/student/enrollment/address", isActive: activeStep === "address", statusIndicator: effectiveStudentState.addressStatus || "normal" },
        { id: "education", title: "Escolaridade", icon: "school", href: "/student/enrollment/education", isActive: activeStep === "education", statusIndicator: effectiveStudentState.educationStatus || "normal" },
        { id: "selfie", title: "Selfie", icon: "camera", href: "/student/enrollment/selfie", isActive: activeStep === "selfie", statusIndicator: effectiveStudentState.selfieStatus || "normal" },
        { id: "logout", title: "Sair", icon: "logout", onClick: handleLogout },
      ];
    }

    // 2. PROMOTER
    if (activeRole === "promoter" || activeRole === "promotor") {
      const pStatus = (effectivePromoterState.status || "").toLowerCase();
      const isCandidate = effectivePromoterState.isCandidate || cleanPath.startsWith("/promoter/candidate") || ["candidate", "started", "profile", "address", "documents", "pix", "education", "selfie", "completed"].includes(pStatus);
      const isTraining = effectivePromoterState.isTrainingBlocked || cleanPath.startsWith("/promoter/training") || pStatus === "training";

      if (isCandidate) {
        const next = effectivePromoterState.registrationStep ?? "documents";
        const section = currentHash.replace("#", "") || next;
        const isPixApproved = effectivePromoterState.pixStatus === "approved";

        return [
          { id: "documents", title: "RG ou CNH", icon: "id", href: "#documents", isActive: section === "documents", statusIndicator: effectivePromoterState.documentStatus || "normal" },
          { id: "address", title: "Endereço", icon: "address", href: "#address", isActive: section === "address", statusIndicator: effectivePromoterState.addressStatus || "normal" },
          { id: "pix", title: "Chave Pix", icon: "pix", href: "#pix", isActive: section === "pix", badge: isPixApproved ? "OK" : undefined, badgeVariant: "success", statusIndicator: isPixApproved ? "success" : "normal" },
          { id: "education", title: "Escolaridade", icon: "school", href: "#education", isActive: section === "education", statusIndicator: effectivePromoterState.educationStatus || "normal" },
          { id: "selfie", title: "Selfie", icon: "camera", href: "#selfie", isActive: section === "selfie", statusIndicator: effectivePromoterState.selfieStatus || "normal" },
          { id: "referral", title: "Indicação", icon: "link", href: "#referral", isActive: section === "referral", statusIndicator: "normal" },
          { id: "logout", title: "Sair", icon: "logout", onClick: handleLogout },
        ];
      }

      if (isTraining) {
        const section = currentHash.replace("#", "") || "training";
        return [
          { id: "training", title: "Treinamento", icon: "school", href: "/promoter/training", isActive: section === "training", statusIndicator: "warning" },
          { id: "materials", title: "Materiais", icon: "book", href: "/promoter/training#materials", isActive: section === "materials", statusIndicator: "normal" },
          { id: "support", title: "Suporte", icon: "messages", href: "/promoter/training#support", isActive: section === "support", statusIndicator: "normal" },
          { id: "logout", title: "Sair", icon: "logout", onClick: handleLogout },
        ];
      }

      // Active Promoter
      return [
        { id: "dashboard", title: "Painel", icon: "home", href: "/promoter/active/dashboard", isActive: cleanPath === "/promoter/active/dashboard" || cleanPath === "/promoter/active" || cleanPath === "/promoter", statusIndicator: "normal" },
        { id: "leads", title: "Leads", icon: "users", href: "/promoter/active/leads", isActive: cleanPath === "/promoter/active/leads", statusIndicator: "normal" },
        { id: "commissions", title: "Comissões", icon: "cash", href: "/promoter/active/commissions", isActive: cleanPath === "/promoter/active/commissions", statusIndicator: "normal" },
        { id: "materials", title: "Materiais", icon: "book", href: "/promoter/active/materials", isActive: cleanPath === "/promoter/active/materials", statusIndicator: "normal" },
        { id: "logout", title: "Sair", icon: "logout", onClick: handleLogout },
      ];
    }

    // 3. POLO / HUB
    const pendingReviews = effectivePoloState.pendingValidationCount ?? 0;
    const isReviews = effectivePoloState.status === "review" || cleanPath.startsWith("/hub/review");
    return [
      { id: "dashboard", title: "Painel", icon: "home", href: "/hub/active/dashboard", isActive: cleanPath === "/hub/active/dashboard" || cleanPath === "/hub", statusIndicator: "normal" },
      { id: "students", title: "Alunos", icon: "file-check", href: "/hub/active/operations", badge: pendingReviews > 0 ? pendingReviews : undefined, badgeVariant: "warning", statusIndicator: pendingReviews > 0 ? "warning" : "normal", isActive: isReviews || cleanPath === "/hub/active/operations" },
      { id: "promoters", title: "Promotores", icon: "users", href: "/hub/review/promoters", statusIndicator: "normal", isActive: cleanPath === "/hub/review/promoters" },
      { id: "exams", title: "Provas", icon: "school", href: "/hub/active/exams", statusIndicator: "normal", isActive: cleanPath === "/hub/active/exams" },
      { id: "logout", title: "Sair", icon: "logout", onClick: handleLogout },
    ];
  });

  // Filter out logout button on mobile bottom bar for student/promoter as canonical
  let displayedItems = $derived(
    (["student", "aluno", "promoter", "promotor"].includes(activeRole))
      ? items.filter((i) => i.id !== "logout")
      : items
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
      <div class="mx-auto flex w-full max-w-lg items-center justify-around px-2 py-2">
        {#each displayedItems as item}
          {@const commonClasses = `flex min-h-12 min-w-12 flex-col items-center gap-1 p-2 rounded-xl transition-[color,transform] duration-200 active:scale-95 cursor-pointer touch-manipulation ${
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
              <span class="text-[10px] tracking-tight">{item.title}</span>
            </button>
          {:else}
            <a
              href={item.href || "#"}
              onclick={(e) => handleItemClick(item, e)}
              aria-disabled={item.disabled || undefined}
              aria-current={item.isActive ? "page" : undefined}
              class={commonClasses}
            >
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
              <span class="text-[10px] tracking-tight">{item.title}</span>
            </a>
          {/if}
        {/each}
      </div>
    </nav>
  {:else}
    <!-- Variant: Floating Dock Cápsula -->
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
              <div class="size-5 {getIndicatorClasses(item.statusIndicator, item.disabled)}">
                <DockIcon name={item.icon} />
              </div>
              <span class="sr-only">{item.title}</span>
              <!-- Tooltip on hover -->
              <span class="absolute -top-8 px-2 py-0.5 rounded-md bg-black/90 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md">
                {item.title}
              </span>
            </button>
          {:else}
            <a
              href={item.href || "#"}
              onclick={(e) => handleItemClick(item, e)}
              aria-label={item.title}
              aria-current={item.isActive ? "page" : undefined}
              class={commonClasses}
            >
              <div class="size-5 {getIndicatorClasses(item.statusIndicator, item.disabled)}">
                <DockIcon name={item.icon} />
              </div>
              <span class="sr-only">{item.title}</span>
              <!-- Tooltip on hover -->
              <span class="absolute -top-8 px-2 py-0.5 rounded-md bg-black/90 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md">
                {item.title}
              </span>
            </a>
          {/if}
        {/each}
      </div>
    </nav>
  {/if}
{/if}
