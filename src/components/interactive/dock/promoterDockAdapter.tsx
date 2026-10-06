import * as React from "react";
import type { FloatingDockItem, DockStatusIndicator } from "@/components/ui/floating-dock";
import type { AdapterContext, PromoterDockState, ItemHealthStatus } from "./types";
import {
  IconHome,
  IconUsers,
  IconCash,
  IconDoorExit,
  IconSchool,
  IconLock,
  IconFileText,
  IconFileCheck,
  IconAlertTriangle,
  IconUserCheck,
  IconHeadset,
} from "@tabler/icons-react";

function mapHealthToIndicator(health?: ItemHealthStatus): DockStatusIndicator {
  switch (health) {
    case "rejected":
      return "danger";
    case "under_review":
      return "warning";
    case "approved":
      return "success";
    case "pending":
    default:
      return "normal";
  }
}

function getBadgeFromHealth(health?: ItemHealthStatus): { badge?: string; badgeVariant?: "danger" | "warning" | "success" } {
  switch (health) {
    case "rejected":
      return { badge: "!", badgeVariant: "danger" };
    case "under_review":
      return { badge: "Análise", badgeVariant: "warning" };
    case "approved":
      return { badge: "OK", badgeVariant: "success" };
    default:
      return {};
  }
}

/**
 * Adapter do Ambiente do Promotor / Consultor Educacional.
 * Adapta dinamicamente os itens do dock reagindo ao status (candidate, training, active, suspended).
 * Cada botão aponta estritamente para rotas padronizadas: /promoter/{status}/{action}
 */
export function getPromoterDockItems(
  state: PromoterDockState,
  ctx: AdapterContext,
): FloatingDockItem[] {
  const { currentPath, onLogout } = ctx;
  const rawStatus = state.status || "";

  const isCandidate =
    state.isCandidate ||
    currentPath.startsWith("/promoter/candidate") ||
    [
      "candidate",
      "started",
      "profile",
      "address",
      "documents",
      "pix",
      "education",
      "selfie",
      "completed",
    ].includes(rawStatus);

  const isTrainingBlocked =
    state.isTrainingBlocked ||
    currentPath.startsWith("/promoter/training") ||
    rawStatus === "training";

  const isSuspended =
    rawStatus === "suspended" ||
    currentPath.startsWith("/promoter/suspended");

  // ── 1. STATUS CANDIDATE: Credenciamento & Onboarding Inicial ──
  if (isCandidate) {
    const onboardingHealth = getBadgeFromHealth(state.onboardingStatus);
    const pixHealth = getBadgeFromHealth(state.pixStatus);
    const termsHealth = getBadgeFromHealth(state.termsStatus);

    const isOnboardingActive =
      currentPath === "/promoter/candidate/onboarding" ||
      currentPath === "/promoter/candidate" ||
      currentPath === "/promoter";
    const isPixActive = currentPath === "/promoter/candidate/pix";
    const isTermsActive = currentPath === "/promoter/candidate/terms";

    return [
      {
        id: "onboarding",
        title: "1. Cadastro",
        icon: <IconUserCheck className="h-full w-full" />,
        href: "/promoter/candidate/onboarding",
        isActive: isOnboardingActive,
        badge: onboardingHealth.badge,
        badgeVariant: onboardingHealth.badgeVariant,
        statusIndicator: mapHealthToIndicator(state.onboardingStatus),
      },
      {
        id: "pix",
        title: "2. Chave PIX",
        icon: <IconCash className="h-full w-full" />,
        href: "/promoter/candidate/pix",
        isActive: isPixActive,
        badge: pixHealth.badge,
        badgeVariant: pixHealth.badgeVariant,
        statusIndicator: mapHealthToIndicator(state.pixStatus),
      },
      {
        id: "terms",
        title: "3. Termos",
        icon: <IconFileCheck className="h-full w-full" />,
        href: "/promoter/candidate/terms",
        isActive: isTermsActive,
        badge: termsHealth.badge,
        badgeVariant: termsHealth.badgeVariant,
        statusIndicator: mapHealthToIndicator(state.termsStatus),
      },
      {
        id: "logout",
        title: "Sair",
        icon: <IconDoorExit className="h-full w-full text-[var(--danger)]" />,
        onClick: onLogout,
      },
    ];
  }

  // ── 2. STATUS TRAINING: Capacitação Obrigatória (LMS) com Painel Travado ──
  if (isTrainingBlocked) {
    const pending = state.pendingMaterialsCount ?? 1;
    const isCoursesActive =
      currentPath === "/promoter/training/courses" ||
      currentPath === "/promoter/training";
    const isLockedActive = currentPath === "/promoter/training/locked";

    return [
      {
        id: "courses",
        title: "Capacitação",
        icon: <IconSchool className="h-full w-full text-[var(--yellow)]" />,
        href: "/promoter/training/courses",
        badge: pending > 0 ? pending : "!",
        badgeVariant: "warning",
        isActive: isCoursesActive,
        statusIndicator: "warning",
      },
      {
        id: "locked",
        title: "Painel Travado",
        icon: <IconLock className="h-full w-full opacity-50" />,
        href: "/promoter/training/locked",
        badge: "Travado",
        badgeVariant: "danger",
        isActive: isLockedActive,
        disabled: true,
        statusIndicator: "disabled",
      },
      {
        id: "logout",
        title: "Sair",
        icon: <IconDoorExit className="h-full w-full text-[var(--danger)]" />,
        onClick: onLogout,
      },
    ];
  }

  // ── 3. STATUS SUSPENDED: Acesso Suspenso Preventivamente ──
  if (isSuspended) {
    const isNoticeActive =
      currentPath === "/promoter/suspended/notice" ||
      currentPath === "/promoter/suspended";
    const isSupportActive = currentPath === "/promoter/suspended/support";

    return [
      {
        id: "notice",
        title: "Suspenso",
        icon: <IconAlertTriangle className="h-full w-full text-rose-400" />,
        href: "/promoter/suspended/notice",
        badge: "Suspenso",
        badgeVariant: "danger",
        isActive: isNoticeActive,
        statusIndicator: "danger",
      },
      {
        id: "support",
        title: "Suporte",
        icon: <IconHeadset className="h-full w-full" />,
        href: "/promoter/suspended/support",
        isActive: isSupportActive,
        statusIndicator: "warning",
      },
      {
        id: "logout",
        title: "Sair",
        icon: <IconDoorExit className="h-full w-full text-[var(--danger)]" />,
        onClick: onLogout,
      },
    ];
  }

  // ── 4. STATUS ACTIVE: Promotor Ativo / Operação Regular ──
  const newLeads = state.newLeadsCount ?? 0;
  const isDashboardActive =
    currentPath === "/promoter/active/dashboard" ||
    currentPath === "/promoter/active" ||
    currentPath === "/promoter";
  const isLeadsActive =
    currentPath === "/promoter/active/leads" ||
    currentPath.startsWith("/promoter/leads");
  const isCommissionsActive =
    currentPath === "/promoter/active/commissions" ||
    currentPath.startsWith("/promoter/comissoes");
  const isMaterialsActive = currentPath === "/promoter/active/materials";

  return [
    {
      id: "dashboard",
      title: "Painel",
      icon: <IconHome className="h-full w-full" />,
      href: "/promoter/active/dashboard",
      isActive: isDashboardActive,
      statusIndicator: "normal",
    },
    {
      id: "leads",
      title: "Leads",
      icon: <IconUsers className="h-full w-full" />,
      href: "/promoter/active/leads",
      badge: newLeads > 0 ? newLeads : undefined,
      badgeVariant: "success",
      isActive: isLeadsActive,
      statusIndicator: "normal",
    },
    {
      id: "commissions",
      title: "Comissões",
      icon: <IconCash className="h-full w-full text-emerald-400" />,
      href: "/promoter/active/commissions",
      isActive: isCommissionsActive,
      statusIndicator: "success",
    },
    {
      id: "materials",
      title: "Materiais",
      icon: <IconFileText className="h-full w-full" />,
      href: "/promoter/active/materials",
      isActive: isMaterialsActive,
      statusIndicator: "normal",
    },
    {
      id: "logout",
      title: "Sair",
      icon: <IconDoorExit className="h-full w-full text-[var(--danger)]" />,
      onClick: onLogout,
    },
  ];
}
