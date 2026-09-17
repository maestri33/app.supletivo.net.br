import * as React from "react";
import type { FloatingDockItem } from "@/components/ui/floating-dock";
import type { AdapterContext, PoloDockState } from "./types";
import {
  IconHome,
  IconFileText,
  IconSettings,
  IconDoorExit,
} from "@tabler/icons-react";

/**
 * Adapter do Ambiente do Polo Regional.
 * Gerencia conferência documental e gestão física de turmas.
 */
export function getPoloDockItems(
  state: PoloDockState,
  ctx: AdapterContext,
): FloatingDockItem[] {
  const { currentPath, onLogout } = ctx;
  const pending = state.pendingValidationCount ?? 0;

  return [
    {
      title: "Painel do Polo",
      icon: <IconHome className="h-full w-full" />,
      href: "/polo/painel",
      isActive: currentPath === "/polo" || currentPath.startsWith("/polo/painel"),
    },
    {
      title: "Conferência de Matrículas",
      icon: <IconFileText className="h-full w-full" />,
      href: "/polo/matriculas",
      badge: pending > 0 ? pending : null,
      badgeVariant: "warning",
      isActive: currentPath.startsWith("/polo/matriculas"),
    },
    {
      title: "Configurações",
      icon: <IconSettings className="h-full w-full" />,
      href: "/polo/configuracoes",
      isActive: currentPath.startsWith("/polo/configuracoes"),
    },
    {
      title: "Sair",
      icon: <IconDoorExit className="h-full w-full text-[var(--danger)]" />,
      onClick: onLogout,
    },
  ];
}
