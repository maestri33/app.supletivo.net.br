import * as React from "react";
import type { FloatingDockItem } from "@/components/ui/floating-dock";
import type { AdapterContext, StudentDockState } from "./types";
import {
  IconHome,
  IconFileText,
  IconSchool,
  IconAward,
  IconHelpCircle,
  IconDoorExit,
} from "@tabler/icons-react";

/**
 * Adapter do Ambiente do Estudante.
 * Mapeia dinamicamente os itens do dock reagindo ao status (lead, enrollment).
 */
export function getStudentDockItems(
  state: StudentDockState,
  ctx: AdapterContext,
): FloatingDockItem[] {
  const { currentPath, onLogout } = ctx;
  const status = state.status || "enrollment";

  // Badges contextuais de Matrícula (enrollment)
  let docsBadge: string | number | null = null;
  let docsVariant: "warning" | "info" | "success" | "danger" | undefined = undefined;

  if (status === "lead") {
    docsBadge = "PIX";
    docsVariant = "warning";
  } else if (["rg", "address", "education", "selfie"].includes(status)) {
    docsBadge = status.toUpperCase();
    docsVariant = "warning";
  } else if (status === "awaiting_release") {
    docsBadge = "Polo";
    docsVariant = "info";
  }

  // Destaque ativo por status e rota
  const isLeadActive = currentPath.startsWith("/student/lead") || status === "lead";
  const isEnrollmentActive =
    currentPath.startsWith("/student/enrollment") ||
    currentPath.startsWith("/documentos") ||
    currentPath.startsWith("/matricula") ||
    (!isLeadActive && (status === "enrollment" || ["rg", "address", "education", "selfie"].includes(status)));

  const isHomeActive = currentPath === "/student" && !isLeadActive && !isEnrollmentActive;

  return [
    {
      title: "Meu Curso",
      icon: <IconHome className="h-full w-full" />,
      href: "/student",
      isActive: isHomeActive,
    },
    {
      title: "Fase de Matrícula",
      icon: <IconFileText className="h-full w-full" />,
      href: "/student/enrollment",
      badge: docsBadge,
      badgeVariant: docsVariant,
      isActive: isEnrollmentActive,
    },
    {
      title: "Ativação / Lead",
      icon: <IconSchool className="h-full w-full" />,
      href: "/student/lead",
      isActive: isLeadActive,
    },
    {
      title: "Ajuda e Suporte",
      icon: <IconHelpCircle className="h-full w-full" />,
      href: "/suporte",
      isActive: currentPath.startsWith("/suporte") || currentPath.startsWith("/ajuda"),
    },
    {
      title: "Sair",
      icon: <IconDoorExit className="h-full w-full text-[var(--danger)]" />,
      onClick: onLogout,
    },
  ];
}
