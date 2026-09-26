import * as React from "react";
import type { FloatingDockItem } from "@/components/ui/floating-dock";
import type { AdapterContext, AdminDockState } from "./types";
import {
  IconHome,
  IconBuildingCommunity,
  IconBook,
  IconCashBanknote,
  IconShieldLock,
  IconDoorExit,
} from "@tabler/icons-react";

/**
 * Adapter do Ambiente do Administrador Geral / Staff.
 * Gerencia polos, catálogo de matérias LMS, finanças globais e auditoria do sistema.
 */
export function getAdminDockItems(
  state: AdminDockState,
  ctx: AdapterContext,
): FloatingDockItem[] {
  const { currentPath, onLogout } = ctx;
  const alerts = state.systemAlertsCount ?? 0;

  return [
    {
      title: "Visão Geral",
      icon: <IconHome className="h-full w-full" />,
      href: "/admin",
      isActive: currentPath === "/admin",
    },
    {
      title: "Polos & Coordenadores",
      icon: <IconBuildingCommunity className="h-full w-full" />,
      href: "/admin/polos",
      isActive: currentPath.startsWith("/admin/polos"),
    },
    {
      title: "Catálogo de Treinamento",
      icon: <IconBook className="h-full w-full" />,
      href: "/admin/treinamento",
      isActive: currentPath.startsWith("/admin/treinamento"),
    },
    {
      title: "Gestão Financeira",
      icon: <IconCashBanknote className="h-full w-full" />,
      href: "/admin/financeiro",
      isActive: currentPath.startsWith("/admin/financeiro"),
    },
    {
      title: "Auditoria & Versão",
      icon: <IconShieldLock className="h-full w-full" />,
      href: "/admin/auditoria",
      badge: alerts > 0 ? alerts : null,
      badgeVariant: "danger",
      isActive: currentPath.startsWith("/admin/auditoria"),
    },
    {
      title: "Sair",
      icon: <IconDoorExit className="h-full w-full text-[var(--danger)]" />,
      onClick: onLogout,
    },
  ];
}
