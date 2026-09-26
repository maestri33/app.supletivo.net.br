import * as React from "react";
import type { FloatingDockItem } from "@/components/ui/floating-dock";
import type { AdapterContext, PoloDockState } from "./types";
import {
  IconHome,
  IconFileCheck,
  IconSchool,
  IconAward,
  IconSettings,
  IconDoorExit,
} from "@tabler/icons-react";

/**
 * Adapter do Ambiente do Polo Regional (Coordenador de Hub).
 * Gerencia conferência documental, bancas de exames, homologações e entrega de diplomas.
 */
export function getPoloDockItems(
  state: PoloDockState,
  ctx: AdapterContext,
): FloatingDockItem[] {
  const { currentPath, onLogout } = ctx;
  const status = state.status || "pending_validation";
  const pendingReviews = state.pendingValidationCount ?? (status === "pending_validation" ? 5 : 0);
  const pendingExams = state.pendingExamsCount ?? (status === "pending_exams" ? 2 : 0);
  const readyDiplomas = state.readyDiplomasCount ?? (status === "ready_diplomas" ? 4 : 0);

  const isReviewsActive =
    currentPath.startsWith("/polo/matriculas") ||
    currentPath.startsWith("/polo/conferencia") ||
    status === "pending_validation";

  const isExamsActive =
    currentPath.startsWith("/polo/provas") ||
    status === "pending_exams";

  const isDiplomasActive =
    currentPath.startsWith("/polo/diplomas") ||
    status === "ready_diplomas";

  const isHomeActive = !isReviewsActive && !isExamsActive && !isDiplomasActive;

  return [
    {
      title: "Painel do Polo",
      icon: <IconHome className="h-full w-full" />,
      href: "/polo/painel",
      isActive: isHomeActive,
    },
    {
      title: "Fila de Conferência",
      icon: <IconFileCheck className="h-full w-full" />,
      href: "/polo/matriculas",
      badge: pendingReviews > 0 ? pendingReviews : null,
      badgeVariant: "warning",
      isActive: isReviewsActive,
    },
    {
      title: "Bancas & Provas",
      icon: <IconSchool className="h-full w-full" />,
      href: "/polo/provas",
      badge: pendingExams > 0 ? pendingExams : null,
      badgeVariant: "info",
      isActive: isExamsActive,
    },
    {
      title: "Diplomas Oficiais",
      icon: <IconAward className="h-full w-full" />,
      href: "/polo/diplomas",
      badge: readyDiplomas > 0 ? readyDiplomas : null,
      badgeVariant: "success",
      isActive: isDiplomasActive,
    },
    {
      title: "Configurações do Polo",
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
