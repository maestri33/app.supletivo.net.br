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
 * Adapta dinamicamente os itens do dock reagindo ao status (candidate, training overlay, active, suspended).
 */
export function getPromoterDockItems(
  state: PromoterDockState,
  ctx: AdapterContext,
): FloatingDockItem[] {
  const { currentPath, onLogout } = ctx;
  const newLeads = state.newLeadsCount ?? 0;
  const isCandidate = state.isCandidate || ["started", "profile", "address", "documents", "pix", "education", "selfie", "completed"].includes(state.status || "");
  const isTrainingBlocked = state.isTrainingBlocked || state.status === "training";
  const isSuspended = state.status === "suspended";

  // Se for aspirante / candidato a promotor
  if (isCandidate) {
    return [
      {
        title: "Credenciamento",
        icon: <IconChecklist className="h-full w-full" />,
        href: "/promotor/credenciamento",
        isActive: currentPath === "/promotor" || currentPath.startsWith("/promotor/credenciamento"),
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

  // Se o promotor estiver com a trava de treinamento obrigatório ativa (LMS)
  if (isTrainingBlocked) {
    const pending = state.pendingMaterialsCount ?? 1;
    return [
      {
        title: "Treinamento Obrigatório",
        icon: <IconSchool className="h-full w-full text-[var(--yellow)]" />,
        href: "/promotor/treinamento",
        badge: pending > 0 ? pending : "!",
        badgeVariant: "warning",
        isActive: currentPath.startsWith("/promotor/treinamento"),
      },
      {
        title: "Painel Bloqueado",
        icon: <IconHome className="h-full w-full opacity-50" />,
        href: "/promotor/painel",
        badge: "Travado",
        badgeVariant: "danger",
        isActive: currentPath === "/promotor" || currentPath.startsWith("/promotor/painel"),
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
        href: "/promotor/painel",
        badge: "Suspenso",
        badgeVariant: "danger",
        isActive: currentPath.startsWith("/promotor"),
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
  return [
    {
      title: "Painel do Promotor",
      icon: <IconHome className="h-full w-full" />,
      href: "/promotor/painel",
      isActive: currentPath === "/promotor" || currentPath.startsWith("/promotor/painel"),
    },
    {
      title: "Meus Alunos Indicados",
      icon: <IconUsers className="h-full w-full" />,
      href: "/promotor/leads",
      badge: newLeads > 0 ? newLeads : null,
      badgeVariant: "success",
      isActive: currentPath.startsWith("/promotor/leads"),
    },
    {
      title: "Minhas Comissões",
      icon: <IconCash className="h-full w-full" />,
      href: "/promotor/comissoes",
      isActive: currentPath.startsWith("/promotor/comissoes"),
    },
    {
      title: "Suporte ao Consultor",
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
