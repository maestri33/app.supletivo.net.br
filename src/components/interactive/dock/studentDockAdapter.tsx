import * as React from "react";
import type { FloatingDockItem } from "@/components/ui/floating-dock";
import type { AdapterContext, StudentDockState } from "./types";
import { getLeadCheckoutReadyState } from "./useDockSync";
import {
  IconHome,
  IconFileText,
  IconSchool,
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
      state.isCheckoutReady || getLeadCheckoutReadyState()
    );
    const modality = state.selectedModality;
    const checkoutTitle = modality === "pix"
      ? "2. Checkout PIX"
      : modality === "credit_card"
        ? "2. Checkout Cartão"
        : "2. Checkout";

    const checkoutIcon = modality === "credit_card"
      ? <IconCreditCard className="h-full w-full" />
      : <IconQrcode className="h-full w-full" />;

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
        title: checkoutTitle,
        icon: checkoutIcon,
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

  const statusPtMap: Record<string, string> = {
    rg: "RG",
    address: "Endereço",
    education: "Histórico",
    selfie: "Selfie",
  };
  if (["rg", "address", "education", "selfie"].includes(status)) {
    docsBadge = statusPtMap[status] || "Pendente";
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
      title: "Portal do Aluno",
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
      title: "Ativação",
      icon: <IconSchool className="h-full w-full" />,
      href: "/student/lead",
      isActive: isLeadActive,
    },
    {
      title: "Sair",
      icon: <IconDoorExit className="h-full w-full text-[var(--danger)]" />,
      onClick: onLogout,
    },
  ];
}
