import * as React from "react";
import type { FloatingDockItem } from "@/components/ui/floating-dock";
import type { AdapterContext, PromoterDockState } from "./types";
import {
  IconId,
  IconCamera,
  IconHome,
  IconUsers,
  IconCash,
  IconDoorExit,
  IconSchool,
  IconLock,
  IconFileText,
  IconAlertTriangle,
  IconHeadset,
  IconLink,
} from "@tabler/icons-react";

/**
 * Adapter do Ambiente do Promotor / Consultor Educacional.
 * Adapta dinamicamente os itens do dock reagindo ao status (candidate, training, active, suspended).
 * Cada botão aponta estritamente para rotas padronizadas: /promoter/{status}/{action}
 */
function PixIcon({ className = "h-full w-full" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M9.13 4.25a2.5 2.5 0 0 1 3.54 0l1.41 1.41a.5.5 0 0 1-.7.71l-1.42-1.41a1.5 1.5 0 0 0-2.12 0L5.27 9.54a1.5 1.5 0 0 0 0 2.12l4.57 4.58a1.5 1.5 0 0 0 2.12 0l1.42-1.42a.5.5 0 0 1 .7.71l-1.41 1.41a2.5 2.5 0 0 1-3.54 0L4.56 12.37a2.5 2.5 0 0 1 0-3.54L9.13 4.25Z" fill="currentColor" />
      <path d="M14.87 19.75a2.5 2.5 0 0 1-3.54 0l-1.41-1.41a.5.5 0 0 1 .7-.71l1.42 1.41a1.5 1.5 0 0 0 2.12 0l4.57-4.58a1.5 1.5 0 0 0 0-2.12l-4.57-4.58a1.5 1.5 0 0 0-2.12 0l-1.42 1.42a.5.5 0 0 1-.7-.71l1.41-1.41a2.5 2.5 0 0 1 3.54 0l4.57 4.57a2.5 2.5 0 0 1 0 3.54l-4.57 4.57Z" fill="currentColor" />
    </svg>
  );
}

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
    const next = state.registrationStep ?? "documents";
    const isDocActive = state.selectedSection === "documents" || (!state.selectedSection && next === "documents");
    const isAddrActive = state.selectedSection === "address" || (!state.selectedSection && next === "address");
    const isPixActive = state.selectedSection === "pix" || (!state.selectedSection && next === "pix");
    const isEduActive = state.selectedSection === "education" || (!state.selectedSection && next === "education");
    const isSelfieActive = state.selectedSection === "selfie" || (!state.selectedSection && next === "selfie");
    const isRefActive = state.selectedSection === "referral" || currentPath.endsWith("#referral");

    const isPixValidated = state.pixStatus === "approved";

    return [
      {
        id: "documents",
        title: "RG ou CNH",
        icon: <IconId className="h-full w-full" />,
        href: "#documents",
        disabled: false,
        isActive: isDocActive,
        badge: state.documentStatus === "approved" ? "OK" : state.documentStatus === "rejected" ? "!" : state.documentStatus === "under_review" ? "Análise" : undefined,
        badgeVariant: state.documentStatus === "approved" ? "success" : state.documentStatus === "rejected" ? "danger" : "warning",
        statusIndicator: state.documentStatus === "approved" ? "success" : state.documentStatus === "rejected" ? "danger" : state.documentStatus === "under_review" ? "warning" : "normal",
      },
      {
        id: "address",
        title: "Endereço",
        icon: <IconHome className="h-full w-full" />,
        href: "#address",
        disabled: false,
        isActive: isAddrActive,
        badge: state.addressStatus === "approved" ? "OK" : state.addressStatus === "rejected" ? "!" : state.addressStatus === "under_review" ? "Análise" : undefined,
        badgeVariant: state.addressStatus === "approved" ? "success" : state.addressStatus === "rejected" ? "danger" : "warning",
        statusIndicator: state.addressStatus === "approved" ? "success" : state.addressStatus === "rejected" ? "danger" : state.addressStatus === "under_review" ? "warning" : "normal",
      },
      {
        id: "pix",
        title: "Chave Pix",
        icon: <PixIcon className="h-full w-full" />,
        href: "#pix",
        disabled: false,
        isActive: isPixActive,
        badge: isPixValidated ? "OK" : undefined,
        badgeVariant: "success",
        statusIndicator: isPixValidated ? "success" : "normal",
      },
      {
        id: "education",
        title: "Escolaridade",
        icon: <IconSchool className="h-full w-full" />,
        href: "#education",
        disabled: false,
        isActive: isEduActive,
        badge: state.educationStatus === "approved" ? "OK" : undefined,
        badgeVariant: "success",
        statusIndicator: state.educationStatus === "approved" ? "success" : "normal",
      },
      {
        id: "selfie",
        title: "Selfie",
        icon: <IconCamera className="h-full w-full" />,
        href: "#selfie",
        disabled: false,
        isActive: isSelfieActive,
        badge: state.selfieStatus === "approved" ? "OK" : state.selfieStatus === "rejected" ? "!" : state.selfieStatus === "under_review" ? "Análise" : undefined,
        badgeVariant: state.selfieStatus === "approved" ? "success" : state.selfieStatus === "rejected" ? "danger" : "warning",
        statusIndicator: state.selfieStatus === "approved" ? "success" : state.selfieStatus === "rejected" ? "danger" : state.selfieStatus === "under_review" ? "warning" : "normal",
      },
      {
        id: "referral",
        title: "Indicar",
        icon: <IconLink className="h-full w-full" />,
        href: "#referral",
        disabled: false,
        isActive: isRefActive,
        statusIndicator: "normal",
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
  const isDocumentsActive = currentPath === "/promoter/active/documents";

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
      id: "referral", title: "Indicar", icon: <IconLink className="h-full w-full" />,
      href: "/promoter/active/dashboard#referral",
      isActive: currentPath.endsWith("#referral"), statusIndicator: "normal",
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
      id: "documents",
      title: "Documentos",
      icon: <IconFileText className="h-full w-full" />,
      href: "/promoter/active/documents",
      isActive: isDocumentsActive,
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
