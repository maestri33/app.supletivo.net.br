import * as React from "react";
import type { FloatingDockItem } from "@/components/ui/floating-dock";
import type { AdapterContext, PromoterDockState } from "./types";
import {
  IconHome,
  IconUsers,
  IconCash,
  IconHelpCircle,
  IconDoorExit,
} from "@tabler/icons-react";

/**
 * Adapter do Ambiente do Promotor / Consultor Educacional.
 * Gerencia navegação de leads, indicações e comissões.
 */
export function getPromoterDockItems(
  state: PromoterDockState,
  ctx: AdapterContext,
): FloatingDockItem[] {
  const { currentPath, onLogout } = ctx;
  const newLeads = state.newLeadsCount ?? 0;

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
