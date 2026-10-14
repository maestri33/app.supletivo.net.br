import * as React from "react";
import { identityDockItems } from "./identityDockItems";
import type { FloatingDockItem, DockStatusIndicator } from "@/components/ui/floating-dock";
import type { AdapterContext, StudentDockState, ItemHealthStatus } from "./types";
import { getLeadCheckoutReadyState } from "./useDockSync";
import {
  IconHome,
  IconFileText,
  IconDoorExit,
  IconCreditCard,
  IconQrcode,
  IconBook,
  IconAward,
  IconCertificate,
  IconProgress,
  IconMessages,
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
    const phase = state.leadPhase ?? (currentPath.endsWith("/checkout") ? "checkout" : "selection");

    const checkoutTitle =
      modality === "pix"
        ? "Checkout PIX"
        : modality === "credit_card"
          ? "Checkout Cartão"
          : "Checkout";

    const checkoutIcon =
      modality === "credit_card" ? (
        <IconCreditCard className="h-full w-full" />
      ) : (
        <IconQrcode className="h-full w-full" />
      );

    return [
      {
        id: "payment",
        title: "Forma de pagamento",
        icon: <IconCreditCard className="h-full w-full" />,
        href: "/student/lead/payment",
        onClick: () => {
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("supletivo:lead-wizard-step", { detail: { step: "selection" } })
            );
          }
        },
        isActive: phase === "selection" || !isMethodSelected,
        disabled: false,
        statusIndicator: isMethodSelected ? "normal" : "warning",
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
        isActive: phase === "checkout" && isMethodSelected,
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

  // Partner release is an operational enrollment step, not a new student role.
  // Explicit document routes retain their upload wizard even during release.
  const releaseStatus = state.enrollmentStep || rawStatus;
  const enrollmentPath = currentPath.split("#")[0];
  if (["awaiting_release", "fee_paid", "fee_scheduled"].includes(releaseStatus) && enrollmentPath === "/student/enrollment") {
    const section = currentPath.split("#")[1] || "tracking";
    return [
      { id: "tracking", title: "Acompanhamento", icon: <IconProgress className="h-full w-full" />, href: "/student/enrollment", isActive: section === "tracking", statusIndicator: "normal" },
      { id: "documents", title: "Meus documentos", icon: <IconFileText className="h-full w-full" />, href: "/student/enrollment#documents", isActive: section === "documents", statusIndicator: "normal" },
      { id: "payment", title: "Pagamento", icon: <IconCreditCard className="h-full w-full" />, href: "/student/enrollment#payment", isActive: section === "payment", statusIndicator: "normal" },
      { id: "contact", title: "Falar com o polo", icon: <IconMessages className="h-full w-full" />, href: "/student/enrollment#contact", isActive: section === "contact", statusIndicator: "normal" },
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
    const isAccessActive = currentPath === "/student/active/access" || currentPath === "/student/active/subjects";
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
        id: "documents",
        title: "Documentos",
        icon: <IconFileText className="h-full w-full" />,
        href: "/student/active/documents",
        isActive: currentPath === "/student/active/documents",
        statusIndicator: state.pendingDocsCount ? "warning" : "normal",
      },
      {
        id: "access",
        title: "Acesso",
        icon: <IconBook className="h-full w-full" />,
        href: "/student/active/access",
        isActive: isAccessActive,
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
        id: "finance",
        title: "Financeiro",
        icon: <IconCreditCard className="h-full w-full" />,
        href: "/student/active/finance",
        isActive: currentPath === "/student/active/finance",
        statusIndicator: "normal",
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
        title: "Diploma",
        icon: <IconCertificate className="h-full w-full text-amber-400" />,
        href: "/student/veteran/diploma",
        isActive: isDiplomaActive,
        statusIndicator: mapHealthToIndicator(state.diplomaStatus),
      },
      {
        id: "assessments",
        title: "Prova",
        icon: <IconAward className="h-full w-full" />,
        href: "/student/veteran/assessments",
        isActive: currentPath === "/student/veteran/assessments",
        statusIndicator: "normal",
      },
      {
        id: "finance",
        title: "Financeiro",
        icon: <IconCreditCard className="h-full w-full" />,
        href: "/student/veteran/finance",
        isActive: currentPath === "/student/veteran/finance",
        statusIndicator: "normal",
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
  const documentPath = currentPath.split("#")[0];
  const active = documentPath.endsWith("/address") ? "address" : documentPath.endsWith("/education") ? "education" : documentPath.endsWith("/selfie") ? "selfie" : "documents";
  return identityDockItems({
    documentTitle: "RG", active,
    paths: { documents: "/student/enrollment/rg", address: "/student/enrollment/address", education: "/student/enrollment/education", selfie: "/student/enrollment/selfie" },
    health: { documents: state.rgStatus, address: state.addressStatus, education: state.educationStatus, selfie: state.selfieStatus },
  });
}
