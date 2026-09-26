import * as React from "react";
import type { FloatingDockItem } from "@/components/ui/floating-dock";
import type { AdapterContext, PromoterDockState } from "./types";
import {
  IconHome,
  IconUsers,
  IconCash,
  IconHelpCircle,
  IconDoorExit,
  IconSchool,
  IconChecklist,
} from "@tabler/icons-react";

/**
 * Adapter do Ambiente do Promotor / Consultor Educacional.
 * Adapta dinamicamente os itens do dock reagindo ao status (candidate, training, active, suspended).
 */
export function getPromoterDockItems(
  state: PromoterDockState,
  ctx: AdapterContext,
): FloatingDockItem[] {
  const { currentPath, onLogout } = ctx;
  const isCandidate =
    state.isCandidate ||
    currentPath.startsWith("/promoter/candidate") ||
    ["candidate", "started", "profile", "address", "documents", "pix", "education", "selfie", "completed"].includes(state.status || "");
  const isTrainingBlocked =
    state.isTrainingBlocked ||
    currentPath.startsWith("/promoter/training") ||
    state.status === "training";
  const isSuspended = state.status === "suspended";

  // Se for candidato a promotor
  if (isCandidate) {
    return [
      {
        title: "Credenciamento",
        icon: <IconChecklist className="h-full w-full" />,
        href: "/promoter/candidate",
        isActive: currentPath === "/promoter" || currentPath.startsWith("/promoter/candidate"),
      },
      {
        title: "Suporte",
        icon: <IconHelpCircle className="h-full w-full" />,
        href: "/suporte",
        isActive: currentPath.startsWith("/suporte"),
      },
      {
        title: "Sair",
        icon: <IconDoorExit className="h-full w-full text-[var(--danger)]" />,
        onClick: onLogout,
      },
    ];
  }

  // Se o promotor estiver com a trava de treinamento obrigatório (LMS)
  if (isTrainingBlocked) {
    const pending = state.pendingMaterialsCount ?? 1;
    return [
      {
        title: "Treinamento Obrigatório",
        icon: <IconSchool className="h-full w-full text-[var(--yellow)]" />,
        href: "/promoter/training",
        badge: pending > 0 ? pending : "!",
        badgeVariant: "warning",
        isActive: currentPath.startsWith("/promoter/training"),
      },
      {
        title: "Painel Bloqueado",
        icon: <IconHome className="h-full w-full opacity-50" />,
        href: "/promoter/active",
        badge: "Travado",
        badgeVariant: "danger",
        isActive: currentPath === "/promoter" || currentPath.startsWith("/promoter/active"),
      },
      {
        title: "Suporte",
        icon: <IconHelpCircle className="h-full w-full" />,
        href: "/suporte",
        isActive: currentPath.startsWith("/suporte"),
      },
      {
        title: "Sair",
        icon: <IconDoorExit className="h-full w-full text-[var(--danger)]" />,
        onClick: onLogout,
      },
    ];
  }

  // Se o promotor estiver suspenso
  if (isSuspended) {
    return [
      {
        title: "Acesso Suspenso",
        icon: <IconHome className="h-full w-full text-rose-400" />,
        href: "/promoter/active",
        badge: "Suspenso",
        badgeVariant: "danger",
        isActive: currentPath.startsWith("/promoter"),
      },
      {
        title: "Falar com Coordenação",
        icon: <IconHelpCircle className="h-full w-full" />,
        href: "/suporte",
        isActive: currentPath.startsWith("/suporte"),
      },
      {
        title: "Sair",
        icon: <IconDoorExit className="h-full w-full text-[var(--danger)]" />,
        onClick: onLogout,
      },
    ];
  }

  // Promotor ativo regular
  const newLeads = state.newLeadsCount ?? 0;
  return [
    {
      title: "Painel do Promotor",
      icon: <IconHome className="h-full w-full" />,
      href: "/promoter/active",
      isActive: currentPath === "/promoter" || currentPath.startsWith("/promoter/active"),
    },
    {
      title: "Leads",
      icon: <IconUsers className="h-full w-full" />,
      href: "/promotor/leads",
      badge: newLeads > 0 ? newLeads : undefined,
      badgeVariant: "success",
      isActive: currentPath.startsWith("/promotor/leads") || currentPath.startsWith("/promoter/leads"),
    },
    {
      title: "Comissões",
      icon: <IconCash className="h-full w-full" />,
      href: "/promotor/comissoes",
      isActive: currentPath.startsWith("/promotor/comissoes") || currentPath.startsWith("/promoter/comissoes"),
    },
    {
      title: "Treinamento",
      icon: <IconSchool className="h-full w-full" />,
      href: "/promoter/training",
      isActive: currentPath.startsWith("/promoter/training"),
    },
    {
      title: "Suporte",
      icon: <IconHelpCircle className="h-full w-full" />,
      href: "/suporte",
      isActive: currentPath.startsWith("/suporte"),
    },
    {
      title: "Sair",
      icon: <IconDoorExit className="h-full w-full text-[var(--danger)]" />,
      onClick: onLogout,
    },
  ];
}
