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
  IconCreditCard,
  IconQrcode,
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
  const status = state.status || (currentPath.startsWith("/student/lead") ? "lead" : "enrollment");

  // ── WIZARD GUIA EXCLUSIVO PARA ALUNO > LEAD (Estritamente 2 Fases / 2 Botões) ──
  if (status === "lead" || currentPath.startsWith("/student/lead")) {
    const isCheckout = state.leadPhase === "checkout";
    const isCheckoutReady = Boolean(
      state.isCheckoutReady ||
      (typeof window !== "undefined" && Boolean((window as any).__supletivoLeadCheckoutReady))
    );
    return [
      {
        title: "1. Modalidade",
        icon: <IconCreditCard className="h-full w-full" />,
        onClick: () => {
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("supletivo:lead-wizard-step", { detail: { step: "selection" } })
            );
          }
        },
        isActive: !isCheckout,
      },
      {
        title: "2. Checkout",
        icon: <IconQrcode className="h-full w-full" />,
        onClick: () => {
          if (!isCheckoutReady) return;
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("supletivo:lead-wizard-step", { detail: { step: "checkout" } })
            );
          }
        },
        isActive: isCheckout,
        disabled: !isCheckoutReady,
      },
    ];
  }

  // Badges contextuais de Matrícula (enrollment)
  let docsBadge: string | number | null = null;
  let docsVariant: "warning" | "info" | "success" | "danger" | undefined = undefined;

  if (["rg", "address", "education", "selfie"].includes(status)) {
    docsBadge = status.toUpperCase();
    docsVariant = "warning";
  } else if (status === "awaiting_release") {
    docsBadge = "Polo";
    docsVariant = "info";
  }

  // Destaque ativo por status e rota
  const isLeadActive = currentPath.startsWith("/student/lead");
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
