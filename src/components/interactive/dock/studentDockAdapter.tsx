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
 * Adapter do Ambiente do Aluno.
 * Mapeia dinamicamente os itens do dock reagindo ao status curricular e documental.
 */
export function getStudentDockItems(
  state: StudentDockState,
  ctx: AdapterContext,
): FloatingDockItem[] {
  const { currentPath, onLogout } = ctx;
  const status = state.status || "pending";

  let docsBadge: string | number | null = null;
  let docsVariant: "warning" | "info" | "success" | "danger" | undefined = undefined;
  if (status === "awaiting_documents" || status === "blood_type_pending") {
    docsBadge = state.pendingDocsCount && state.pendingDocsCount > 0 ? state.pendingDocsCount : "!";
    docsVariant = "warning";
  } else if (status === "documents_under_review") {
    docsBadge = "•";
    docsVariant = "info";
  }

  let examBadge: string | number | null = null;
  let examVariant: "warning" | "info" | "success" | "danger" | undefined = undefined;
  if (status === "exam_released") {
    examBadge = "Liberada";
    examVariant = "success";
  } else if (status === "exam_scheduled") {
    examBadge = "Agendada";
    examVariant = "info";
  }

  let diplomaBadge: string | number | null = null;
  let diplomaVariant: "warning" | "info" | "success" | "danger" | undefined = undefined;
  if (status === "awaiting_pickup" || status === "veteran") {
    diplomaBadge = "Pronto";
    diplomaVariant = "success";
  }

  return [
    {
      title: "Meu Curso",
      icon: <IconHome className="h-full w-full" />,
      href: "/painel",
      isActive: currentPath === "/painel" || currentPath === "/",
    },
    {
      title: "Documentação",
      icon: <IconFileText className="h-full w-full" />,
      href: "/documentos",
      badge: docsBadge,
      badgeVariant: docsVariant,
      isActive: currentPath.startsWith("/documentos") || currentPath.startsWith("/matricula"),
    },
    {
      title: "Provas & Avaliações",
      icon: <IconSchool className="h-full w-full" />,
      href: "/provas",
      badge: examBadge,
      badgeVariant: examVariant,
      isActive: currentPath.startsWith("/provas"),
    },
    {
      title: "Certificação e Diploma",
      icon: <IconAward className="h-full w-full" />,
      href: "/aluno",
      badge: diplomaBadge,
      badgeVariant: diplomaVariant,
      isActive: currentPath.startsWith("/aluno") || currentPath.startsWith("/certificados"),
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
