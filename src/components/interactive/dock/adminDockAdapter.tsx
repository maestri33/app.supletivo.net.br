import * as React from "react";
import type { FloatingDockItem } from "@/components/ui/floating-dock";
import type { AdapterContext, AdminDockState } from "./types";
import {
  IconHome,
  IconUsers,
  IconShieldLock,
  IconDoorExit,
} from "@tabler/icons-react";

/**
 * Adapter do Ambiente do Administrador Geral.
 * Gerencia governança, auditoria e usuários.
 */
export function getAdminDockItems(
  _state: AdminDockState,
  ctx: AdapterContext,
): FloatingDockItem[] {
  const { currentPath, onLogout } = ctx;

  return [
    {
      title: "Visão Geral",
      icon: <IconHome className="h-full w-full" />,
      href: "/admin",
      isActive: currentPath === "/admin",
    },
    {
      title: "Gestão de Usuários",
      icon: <IconUsers className="h-full w-full" />,
      href: "/admin/usuarios",
      isActive: currentPath.startsWith("/admin/usuarios"),
    },
    {
      title: "Auditoria do Sistema",
      icon: <IconShieldLock className="h-full w-full" />,
      href: "/admin/auditoria",
      isActive: currentPath.startsWith("/admin/auditoria"),
    },
    {
      title: "Sair",
      icon: <IconDoorExit className="h-full w-full text-[var(--danger)]" />,
      onClick: onLogout,
    },
  ];
}
