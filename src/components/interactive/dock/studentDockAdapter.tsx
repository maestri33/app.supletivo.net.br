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
 * Mapeia dinamicamente os itens do dock reagindo ao status curricular e documental (lead, enrollment, student, veteran).
 */
export function getStudentDockItems(
  state: StudentDockState,
  ctx: AdapterContext,
): FloatingDockItem[] {
  const { currentPath, onLogout } = ctx;
  const status = state.status || "pending";

  // Badges contextuais de Documentação / Matrícula
  let docsBadge: string | number | null = null;
  let docsVariant: "warning" | "info" | "success" | "danger" | undefined = undefined;

  if (["rg", "address", "education", "selfie"].includes(status)) {
    docsBadge = status.toUpperCase();
    docsVariant = "warning";
  } else if (status === "awaiting_release") {
    docsBadge = "Polo";
    docsVariant = "info";
  } else if (status === "awaiting_documents" || status === "blood_type_pending") {
    docsBadge = state.pendingDocsCount && state.pendingDocsCount > 0 ? state.pendingDocsCount : "!";
    docsVariant = "warning";
  } else if (status === "documents_under_review") {
    docsBadge = "•";
    docsVariant = "info";
  }

  // Badges contextuais de Prova
  let examBadge: string | number | null = null;
  let examVariant: "warning" | "info" | "success" | "danger" | undefined = undefined;
  if (status === "exam_released") {
    examBadge = "Liberada";
    examVariant = "success";
  } else if (status === "exam_scheduled") {
    examBadge = "Agendada";
    examVariant = "info";
  } else if (status === "exam_failed") {
    examBadge = "Refazer";
    examVariant = "danger";
  }

  // Badges contextuais de Diploma
  let diplomaBadge: string | number | null = null;
  let diplomaVariant: "warning" | "info" | "success" | "danger" | undefined = undefined;
  if (status === "awaiting_pickup") {
    diplomaBadge = "Pronto";
    diplomaVariant = "success";
  } else if (status === "awaiting_diploma_issuance") {
    diplomaBadge = "Emissão";
    diplomaVariant = "info";
  } else if (status === "veteran") {
    diplomaBadge = "Concluído";
    diplomaVariant = "success";
  }

  // Destaque ativo por status (se a rota atual não for uma subpágina específica)
  const isDocsActive =
    currentPath.startsWith("/documentos") ||
    currentPath.startsWith("/matricula") ||
    ["rg", "address", "education", "selfie", "awaiting_documents", "documents_under_review"].includes(status);

  const isExamActive =
    currentPath.startsWith("/provas") ||
    ["exam_released", "exam_scheduled", "exam_failed"].includes(status);

  const isDiplomaActive =
    currentPath.startsWith("/aluno/diploma") ||
    currentPath.startsWith("/certificados") ||
    ["awaiting_diploma_issuance", "awaiting_pickup", "veteran"].includes(status);

  const isHomeActive = !isDocsActive && !isExamActive && !isDiplomaActive;

  return [
    {
      title: "Meu Curso",
      icon: <IconHome className="h-full w-full" />,
      href: "/painel",
      isActive: isHomeActive,
    },
    {
      title: "Documentação",
      icon: <IconFileText className="h-full w-full" />,
      href: "/documentos",
      badge: docsBadge,
      badgeVariant: docsVariant,
      isActive: isDocsActive,
    },
    {
      title: "Provas & Avaliações",
      icon: <IconSchool className="h-full w-full" />,
      href: "/provas",
      badge: examBadge,
      badgeVariant: examVariant,
      isActive: isExamActive,
    },
    {
      title: "Certificação e Diploma",
      icon: <IconAward className="h-full w-full" />,
      href: "/aluno",
      badge: diplomaBadge,
      badgeVariant: diplomaVariant,
      isActive: isDiplomaActive,
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
