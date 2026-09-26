import * as React from "react";
import type { FloatingDockItem } from "@/components/ui/floating-dock";
import type { AdapterContext, PoloDockState } from "./types";
import {
  IconHome,
  IconFileCheck,
  IconHelpCircle,
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
  const pendingReviews = state.pendingValidationCount ?? 5;

  const isReviewsActive =
    currentPath.startsWith("/hub/review") ||
    currentPath.startsWith("/polo/matriculas") ||
    currentPath.startsWith("/polo/conferencia") ||
    status === "review";

  const isHomeActive = !isReviewsActive && (currentPath === "/hub" || currentPath.startsWith("/hub/active"));

  return [
    {
      title: "Painel do Hub",
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
      title: "Suporte Técnico",
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

export const getHubDockItems = getPoloDockItems;
