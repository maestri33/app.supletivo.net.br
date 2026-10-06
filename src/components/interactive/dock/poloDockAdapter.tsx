import * as React from "react";
import type { FloatingDockItem } from "@/components/ui/floating-dock";
import type { AdapterContext, PoloDockState } from "./types";
import {
  IconHome,
  IconFileCheck,
  IconDoorExit,
  IconSchool,
  IconUsers,
} from "@tabler/icons-react";

/**
 * Adapter do Ambiente do Hub Regional (Coordenador de Polo).
 * Gerencia conferência documental, aprovação de consultores e métricas operacionais.
 * Cada botão aponta estritamente para rotas padronizadas: /hub/{status}/{action}
 */
export function getPoloDockItems(
  state: PoloDockState,
  ctx: AdapterContext,
): FloatingDockItem[] {
  const { currentPath, onLogout } = ctx;
  const rawStatus = state.status || "active";
  const pendingReviews = state.pendingValidationCount ?? 0;
  const pendingExams = state.pendingExamsCount ?? 0;

  const isReviews =
    rawStatus === "review" ||
    currentPath.startsWith("/hub/review");

  if (isReviews) {
    const isStudentsActive =
      currentPath === "/hub/review/students" ||
      currentPath === "/hub/review";
    const isPromotersActive = currentPath === "/hub/review/promoters";

    return [
      {
        id: "dashboard",
        title: "Painel",
        icon: <IconHome className="h-full w-full" />,
        href: "/hub/active/dashboard",
        isActive: currentPath === "/hub/active/dashboard" || currentPath === "/hub",
        statusIndicator: "normal",
      },
      {
        id: "students",
        title: "Matrículas",
        icon: <IconFileCheck className="h-full w-full" />,
        href: "/hub/review/students",
        badge: pendingReviews > 0 ? pendingReviews : undefined,
        badgeVariant: "warning",
        statusIndicator: pendingReviews > 0 ? "warning" : "normal",
        isActive: isStudentsActive,
      },
      {
        id: "promoters",
        title: "Promotores",
        icon: <IconUsers className="h-full w-full" />,
        href: "/hub/review/promoters",
        statusIndicator: "normal",
        isActive: isPromotersActive,
      },
      {
        id: "logout",
        title: "Sair",
        icon: <IconDoorExit className="h-full w-full text-[var(--danger)]" />,
        onClick: onLogout,
      },
    ];
  }

  // ── STATUS ACTIVE: Operação Geral do Polo ──
  const isDashboardActive =
    currentPath === "/hub/active/dashboard" ||
    currentPath === "/hub/active" ||
    currentPath === "/hub";
  const isExamsActive = currentPath === "/hub/active/exams";
  const isStudentsActive =
    currentPath === "/hub/review/students" ||
    currentPath === "/hub/review";
  const isPromotersActive = currentPath === "/hub/review/promoters";

  return [
    {
      id: "dashboard",
      title: "Painel",
      icon: <IconHome className="h-full w-full" />,
      href: "/hub/active/dashboard",
      isActive: isDashboardActive,
      statusIndicator: "normal",
    },
    {
      id: "exams",
      title: "Bancas",
      icon: <IconSchool className="h-full w-full" />,
      href: "/hub/active/exams",
      badge: pendingExams > 0 ? pendingExams : undefined,
      badgeVariant: "info",
      statusIndicator: "normal",
      isActive: isExamsActive,
    },
    {
      id: "students",
      title: "Matrículas",
      icon: <IconFileCheck className="h-full w-full" />,
      href: "/hub/review/students",
      badge: pendingReviews > 0 ? pendingReviews : undefined,
      badgeVariant: "warning",
      statusIndicator: pendingReviews > 0 ? "warning" : "normal",
      isActive: isStudentsActive,
    },
    {
      id: "promoters",
      title: "Promotores",
      icon: <IconUsers className="h-full w-full" />,
      href: "/hub/review/promoters",
      statusIndicator: "normal",
      isActive: isPromotersActive,
    },
    {
      id: "logout",
      title: "Sair",
      icon: <IconDoorExit className="h-full w-full text-[var(--danger)]" />,
      onClick: onLogout,
    },
  ];
}

export const getHubDockItems = getPoloDockItems;
