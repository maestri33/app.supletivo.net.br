import * as React from "react";
import type { FloatingDockItem } from "@/components/ui/floating-dock";
import type { AdapterContext, PoloDockState } from "./types";
import {
  IconHome,
  IconFileCheck,
  IconDoorExit,
} from "@tabler/icons-react";

/**
 * Adapter do Ambiente do Hub Regional (Coordenador de Polo).
 * Gerencia conferência documental, aprovação de consultores e métricas operacionais.
 */
export function getPoloDockItems(
  state: PoloDockState,
  ctx: AdapterContext,
): FloatingDockItem[] {
  const { currentPath, onLogout } = ctx;
  const status = state.status || "active";
  const pendingReviews = state.pendingValidationCount ?? 0;

  const isReviewsActive =
    currentPath.startsWith("/hub/review") ||
    status === "review";

  const isHomeActive = !isReviewsActive && (currentPath === "/hub" || currentPath.startsWith("/hub/active"));

  return [
    {
      title: "Painel do Polo",
      icon: <IconHome className="h-full w-full" />,
      href: "/hub/active",
      isActive: isHomeActive,
    },
    {
      title: "Fila de Revisões",
      icon: <IconFileCheck className="h-full w-full" />,
      href: "/hub/review",
      badge: pendingReviews > 0 ? pendingReviews : null,
      badgeVariant: "warning",
      isActive: isReviewsActive,
    },
    {
      title: "Sair",
      icon: <IconDoorExit className="h-full w-full text-[var(--danger)]" />,
      onClick: onLogout,
    },
  ];
}

export const getHubDockItems = getPoloDockItems;
