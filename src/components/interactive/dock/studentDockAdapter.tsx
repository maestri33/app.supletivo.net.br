import * as React from "react";
import type { FloatingDockItem, DockStatusIndicator } from "@/components/ui/floating-dock";
import type { AdapterContext, StudentDockState, ItemHealthStatus } from "./types";
import { getLeadCheckoutReadyState } from "./useDockSync";
import {
  IconHome,
  IconFileText,
  IconSchool,
  IconDoorExit,
  IconCreditCard,
  IconQrcode,
  IconId,
  IconCamera,
  IconBook,
  IconAward,
  IconCertificate,
} from "@tabler/icons-react";

function mapHealthToIndicator(health?: ItemHealthStatus): DockStatusIndicator {
  switch (health) {
    case "rejected":
      return "danger";
    case "under_review":
      return "warning";
    case "approved":
      return "success";
    case "pending":
    default:
      return "normal";
  }
}

function getBadgeFromHealth(health?: ItemHealthStatus): { badge?: string; badgeVariant?: "danger" | "warning" | "success" } {
  switch (health) {
    case "rejected":
      return { badge: "!", badgeVariant: "danger" };
    case "under_review":
      return { badge: "Análise", badgeVariant: "warning" };
    case "approved":
      return { badge: "OK", badgeVariant: "success" };
    default:
      return {};
  }
}

/**
 * Adapter do Ambiente do Estudante.
 * Mapeia dinamicamente os itens do dock reagindo ao status (lead, enrollment, active, veteran).
 * Cada botão aponta estritamente para rota padronizada: /student/{status}/{action}
 */
export function getStudentDockItems(
  state: StudentDockState,
  ctx: AdapterContext,
): FloatingDockItem[] {
  const { currentPath, onLogout } = ctx;
  const rawStatus = state.status || "";

  // ── 1. STATUS LEAD: Funil de Conversão & Checkout (2 Etapas + Sair) ──
  if (
    rawStatus === "lead" ||
    currentPath.startsWith("/student/lead")
  ) {
    const isCheckoutReady = Boolean(
      state.isCheckoutReady || getLeadCheckoutReadyState()
    );
    const modality = state.selectedModality;
    const isMethodSelected = Boolean(modality && isCheckoutReady);

    const checkoutTitle =
      modality === "pix"
        ? "2. Checkout PIX"
        : modality === "credit_card"
          ? "2. Checkout Cartão"
          : "2. Checkout";

    const checkoutIcon =
      modality === "credit_card" ? (
        <IconCreditCard className="h-full w-full" />
      ) : (
        <IconQrcode className="h-full w-full" />
      );

    return [
      {
        id: "payment",
        title: "1. Forma de Pagamento",
        icon: <IconCreditCard className="h-full w-full" />,
        href: "/student/lead/payment",
        onClick: () => {
          if (isMethodSelected) return;
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("supletivo:lead-wizard-step", { detail: { step: "selection" } })
            );
          }
        },
        isActive: currentPath.endsWith("/payment") || (!isMethodSelected && currentPath.startsWith("/student/lead")),
        disabled: isMethodSelected,
        statusIndicator: isMethodSelected ? "disabled" : "normal",
      },
      {
        id: "checkout",
        title: checkoutTitle,
        icon: checkoutIcon,
        href: "/student/lead/checkout",
        onClick: () => {
          if (!isMethodSelected) return;
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("supletivo:lead-wizard-step", { detail: { step: "checkout" } })
            );
          }
        },
        isActive: currentPath.endsWith("/checkout") || (isMethodSelected && currentPath.startsWith("/student/lead")),
        disabled: !isMethodSelected,
        statusIndicator: !isMethodSelected ? "disabled" : "success",
      },
      {
        id: "logout",
        title: "Sair",
        icon: <IconDoorExit className="h-full w-full text-[var(--danger)]" />,
        onClick: onLogout,
      },
    ];
  }

  // ── 2. STATUS ACTIVE: Estudante Ativo / Cursando Módulos ──
  if (
    rawStatus === "active" ||
    rawStatus === "exam_released" ||
    rawStatus === "regular" ||
    currentPath.startsWith("/student/active")
  ) {
    const isDashboardActive = currentPath === "/student/active/dashboard" || currentPath === "/student/active" || currentPath === "/student";
    const isSubjectsActive = currentPath === "/student/active/subjects";
    const isAssessmentsActive = currentPath === "/student/active/assessments";

    const examIndicator =
      state.examStatus === "approved"
        ? "success"
        : state.examStatus === "under_review" || rawStatus === "exam_released"
          ? "warning"
          : "normal";

    const examBadge =
      state.examStatus === "approved"
        ? "Aprovado"
        : state.examStatus === "under_review" || rawStatus === "exam_released"
          ? "Liberada"
          : undefined;

    return [
      {
        id: "dashboard",
        title: "Painel",
        icon: <IconHome className="h-full w-full" />,
        href: "/student/active/dashboard",
        isActive: isDashboardActive,
        statusIndicator: "normal",
      },
      {
        id: "subjects",
        title: "Disciplinas",
        icon: <IconBook className="h-full w-full" />,
        href: "/student/active/subjects",
        isActive: isSubjectsActive,
        statusIndicator: "normal",
      },
      {
        id: "assessments",
        title: "Avaliações",
        icon: <IconAward className="h-full w-full" />,
        href: "/student/active/assessments",
        isActive: isAssessmentsActive,
        badge: examBadge,
        badgeVariant: examIndicator === "success" ? "success" : "warning",
        statusIndicator: examIndicator,
      },
      {
        id: "logout",
        title: "Sair",
        icon: <IconDoorExit className="h-full w-full text-[var(--danger)]" />,
        onClick: onLogout,
      },
    ];
  }

  // ── 3. STATUS VETERAN: Concluinte / Emissão de Diploma MEC ──
  if (
    rawStatus === "veteran" ||
    rawStatus === "graduated" ||
    rawStatus === "awaiting_diploma_issuance" ||
    currentPath.startsWith("/student/veteran")
  ) {
    const isDashboardActive = currentPath === "/student/veteran/dashboard" || currentPath === "/student/veteran";
    const isRecordsActive = currentPath === "/student/veteran/records";
    const isDiplomaActive = currentPath === "/student/veteran/diploma";

    return [
      {
        id: "dashboard",
        title: "Conclusão",
        icon: <IconAward className="h-full w-full text-emerald-400" />,
        href: "/student/veteran/dashboard",
        isActive: isDashboardActive,
        statusIndicator: "success",
      },
      {
        id: "records",
        title: "Histórico",
        icon: <IconFileText className="h-full w-full" />,
        href: "/student/veteran/records",
        isActive: isRecordsActive,
        statusIndicator: "success",
      },
      {
        id: "diploma",
        title: "Diploma MEC",
        icon: <IconCertificate className="h-full w-full text-amber-400" />,
        href: "/student/veteran/diploma",
        badge: "MEC",
        badgeVariant: "success",
        isActive: isDiplomaActive,
        statusIndicator: "success",
      },
      {
        id: "logout",
        title: "Sair",
        icon: <IconDoorExit className="h-full w-full text-[var(--danger)]" />,
        onClick: onLogout,
      },
    ];
  }

  // ── 4. STATUS ENROLLMENT: Matrícula & Documentação Obrigatória ──
  // Padrão para alunos que pagaram matrícula e estão na fase documental
  const rgHealth = getBadgeFromHealth(state.rgStatus);
  const addressHealth = getBadgeFromHealth(state.addressStatus);
  const educationHealth = getBadgeFromHealth(state.educationStatus);
  const selfieHealth = getBadgeFromHealth(state.selfieStatus);

  const isRgActive = currentPath === "/student/enrollment/rg" || currentPath === "/student/enrollment" || currentPath === "/documentos" || currentPath === "/matricula";
  const isAddressActive = currentPath === "/student/enrollment/address";
  const isEducationActive = currentPath === "/student/enrollment/education";
  const isSelfieActive = currentPath === "/student/enrollment/selfie";

  return [
    {
      id: "rg",
      title: "1. RG / CNH",
      icon: <IconId className="h-full w-full" />,
      href: "/student/enrollment/rg",
      isActive: isRgActive,
      badge: rgHealth.badge,
      badgeVariant: rgHealth.badgeVariant,
      statusIndicator: mapHealthToIndicator(state.rgStatus),
    },
    {
      id: "address",
      title: "2. Endereço",
      icon: <IconHome className="h-full w-full" />,
      href: "/student/enrollment/address",
      isActive: isAddressActive,
      badge: addressHealth.badge,
      badgeVariant: addressHealth.badgeVariant,
      statusIndicator: mapHealthToIndicator(state.addressStatus),
    },
    {
      id: "education",
      title: "3. Histórico",
      icon: <IconSchool className="h-full w-full" />,
      href: "/student/enrollment/education",
      isActive: isEducationActive,
      badge: educationHealth.badge,
      badgeVariant: educationHealth.badgeVariant,
      statusIndicator: mapHealthToIndicator(state.educationStatus),
    },
    {
      id: "selfie",
      title: "4. Selfie",
      icon: <IconCamera className="h-full w-full" />,
      href: "/student/enrollment/selfie",
      isActive: isSelfieActive,
      badge: selfieHealth.badge,
      badgeVariant: selfieHealth.badgeVariant,
      statusIndicator: mapHealthToIndicator(state.selfieStatus),
    },
    {
      id: "logout",
      title: "Sair",
      icon: <IconDoorExit className="h-full w-full text-[var(--danger)]" />,
      onClick: onLogout,
    },
  ];
}
