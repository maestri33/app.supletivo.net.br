"use client";

import * as React from "react";
import { FloatingDock, type FloatingDockItem } from "@/components/ui/floating-dock";
import { getAccessToken, clearSession } from "@/lib/session";
import { getStudentMe } from "@/lib/api";
import {
  type UserRole,
  type StudentDockState,
  type PromoterDockState,
  type PoloDockState,
  type AdminDockState,
  type AdapterContext,
  getStudentDockItems,
  getPromoterDockItems,
  getPoloDockItems,
  getAdminDockItems,
} from "./dock";

export type { UserRole };

export interface RoleAdaptiveNavDockProps {
  initialRole?: UserRole;
  role?: UserRole;
  variant?: "bottom-bar" | "floating";
  currentPath?: string;
  onNavigate?: (href: string) => void;
  onLogout?: () => void;
  bypassAuth?: boolean;
  studentState?: Partial<StudentDockState>;
  promoterState?: Partial<PromoterDockState>;
  poloState?: Partial<PoloDockState>;
  adminState?: Partial<AdminDockState>;
}

/**
 * Componente Adaptativo Multi-Role & Multi-Estado.
 * Arquitetura em camadas:
 * 1. Casca Base Genérica (FloatingDock com animações ou Bottom Bar nativa)
 * 2. Adaptador por Perfil (aluno, promotor, polo, admin)
 * 3. Especialização por Sub-Estado Operacional (StudentStatus, PromoterStatus, PoloStatus, AdminStatus)
 *
 * 100% aderente a AGENTS.md (Código em inglês, Interface 100% PT-BR).
 */
export const RoleAdaptiveNavDock: React.FC<RoleAdaptiveNavDockProps> = ({
  initialRole = "aluno",
  role: controlledRole,
  variant = "bottom-bar",
  currentPath = "/painel",
  onNavigate,
  onLogout,
  bypassAuth = false,
  studentState: controlledStudentState,
  promoterState: controlledPromoterState,
  poloState: controlledPoloState,
  adminState: controlledAdminState,
}) => {
  const [internalRole, setInternalRole] = React.useState<UserRole>(initialRole);
  const activeRole = controlledRole || internalRole;
  const [isLocked, setIsLocked] = React.useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(bypassAuth || true);

  // Estados operacionais de cada ambiente
  const [studentState, setStudentState] = React.useState<StudentDockState>(() => {
    let initialStatus: string | null = null;
    if (typeof window !== "undefined") {
      if (window.location.pathname.startsWith("/student/lead")) {
        initialStatus = "lead";
      } else if (window.location.pathname.startsWith("/student/enrollment")) {
        initialStatus = "enrollment";
      }
    } else if (currentPath.startsWith("/student/lead")) {
      initialStatus = "lead";
    } else if (currentPath.startsWith("/student/enrollment")) {
      initialStatus = "enrollment";
    }
    return {
      status: initialStatus,
      pendingDocsCount: 0,
      hasPartnerUrl: false,
      leadPhase: "selection",
      isCheckoutReady: false,
      selectedModality: null,
    };
  });
  const [promoterState, setPromoterState] = React.useState<PromoterDockState>({
    status: "active",
    newLeadsCount: 3,
    isTrainingBlocked: false,
    pendingMaterialsCount: 0,
  });
  const [poloState, setPoloState] = React.useState<PoloDockState>({
    pendingValidationCount: 5,
    pendingExamsCount: 2,
    readyDiplomasCount: 4,
  });
  const [adminState, setAdminState] = React.useState<AdminDockState>({
    systemAlertsCount: 0,
    hubsCount: 12,
    isOracleSynced: true,
  });

  // Logout canônico
  const handleLogout = React.useCallback(() => {
    if (onLogout) {
      onLogout();
    } else {
      clearSession();
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  }, [onLogout]);

  // Sincronização e escuta de eventos do ecossistema
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // Se não houver token ativo no navegador, dock permanece invisível (a menos que bypassAuth seja ativado)
    if (!bypassAuth) {
      const token = getAccessToken();
      if (!token) {
        setIsAuthenticated(false);
        return;
      }
    }
    setIsAuthenticated(true);

    // Escuta troca de role disparada por tabs superiores
    const handleRoleChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ role: UserRole }>;
      if (customEvent.detail?.role) {
        setInternalRole(customEvent.detail.role);
      }
    };

    // Escuta estado de bloqueio de matrícula (paywall)
    const handleLockChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ isLocked: boolean }>;
      if (typeof customEvent.detail?.isLocked === "boolean") {
        setIsLocked(customEvent.detail.isLocked);
      }
    };

    // Escuta atualização de estado operacional do aluno
    const handleStudentStateChange = (e: Event) => {
      const customEvent = e as CustomEvent<StudentDockState>;
      if (customEvent.detail) {
        setStudentState((prev) => ({ ...prev, ...customEvent.detail }));
      }
    };

    // Escuta atualização de estado operacional do promotor
    const handlePromoterStateChange = (e: Event) => {
      const customEvent = e as CustomEvent<PromoterDockState>;
      if (customEvent.detail) {
        setPromoterState((prev) => ({ ...prev, ...customEvent.detail }));
      }
    };

    // Escuta atualização de estado operacional do polo
    const handlePoloStateChange = (e: Event) => {
      const customEvent = e as CustomEvent<PoloDockState>;
      if (customEvent.detail) {
        setPoloState((prev) => ({ ...prev, ...customEvent.detail }));
      }
    };

    // Escuta atualização de estado operacional do admin
    const handleAdminStateChange = (e: Event) => {
      const customEvent = e as CustomEvent<AdminDockState>;
      if (customEvent.detail) {
        setAdminState((prev) => ({ ...prev, ...customEvent.detail }));
      }
    };

    // Escuta fase do wizard de ativação do lead (modalidade vs checkout)
    const handleLeadPhaseChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ phase: "selection" | "checkout" }>;
      if (customEvent.detail?.phase) {
        setStudentState((prev) => ({ ...prev, leadPhase: customEvent.detail.phase }));
      }
    };

    // Escuta estado de prontidão e modalidade do checkout do lead
    const handleLeadCheckoutStatus = (e: Event) => {
      const customEvent = e as CustomEvent<{
        ready: boolean;
        phase?: "selection" | "checkout";
        modality?: "pix" | "credit_card" | null;
      }>;
      if (customEvent.detail) {
        if (typeof window !== "undefined") {
          (window as any).__supletivoLeadCheckoutReady = customEvent.detail.ready;
        }
        setStudentState((prev) => ({
          ...prev,
          isCheckoutReady: customEvent.detail.ready,
          leadPhase: customEvent.detail.phase ?? prev.leadPhase,
          selectedModality:
            customEvent.detail.modality !== undefined ? customEvent.detail.modality : prev.selectedModality,
        }));
      }
    };

    window.addEventListener("supletivo:role-change", handleRoleChange);
    window.addEventListener("supletivo:lock-change", handleLockChange);
    window.addEventListener("supletivo:student-state", handleStudentStateChange);
    window.addEventListener("supletivo:lead-wizard-phase", handleLeadPhaseChange);
    window.addEventListener("supletivo:lead-checkout-status", handleLeadCheckoutStatus);
    window.addEventListener("supletivo:promoter-state", handlePromoterStateChange);
    window.addEventListener("supletivo:polo-state", handlePoloStateChange);
    window.addEventListener("supletivo:admin-state", handleAdminStateChange);

    // Hidratação proativa do status do aluno se logado
    const currentToken = getAccessToken();
    if (!studentState.status && currentToken) {
      getStudentMe()
        .then((s) => {
          if (s) {
            setStudentState((prev) => ({
              ...prev,
              status: s.status ?? prev.status ?? null,
              pendingDocsCount: s.pendencies?.length ?? prev.pendingDocsCount ?? 0,
              hasPartnerUrl: Boolean(s.platform?.url),
            }));
          }
        })
        .catch(() => {
          // Falha silenciosa em caso de rota sem acesso a studentMe
        });
    }

    return () => {
      window.removeEventListener("supletivo:role-change", handleRoleChange);
      window.removeEventListener("supletivo:lock-change", handleLockChange);
      window.removeEventListener("supletivo:student-state", handleStudentStateChange);
      window.removeEventListener("supletivo:lead-wizard-phase", handleLeadPhaseChange);
      window.removeEventListener("supletivo:lead-checkout-status", handleLeadCheckoutStatus);
      window.removeEventListener("supletivo:promoter-state", handlePromoterStateChange);
      window.removeEventListener("supletivo:polo-state", handlePoloStateChange);
      window.removeEventListener("supletivo:admin-state", handleAdminStateChange);
    };
  }, [studentState.status]);

  // Mescla estados controlados com estados internos
  const effectiveStudentState: StudentDockState = { ...studentState, ...controlledStudentState };
  const effectivePromoterState: PromoterDockState = { ...promoterState, ...controlledPromoterState };
  const effectivePoloState: PoloDockState = { ...poloState, ...controlledPoloState };

  // O status 'lead' do estudante opera como um wizard guia de 2 fases no dock
  const isLeadWizard =
    (activeRole === "student" || activeRole === "aluno") &&
    (effectiveStudentState.status === "lead" || currentPath.startsWith("/student/lead"));

  // Se não autenticado ou (bloqueado e não for o wizard do lead), suprime o dock
  if (!isAuthenticated || (isLocked && !isLeadWizard)) {
    return null;
  }

  const context: AdapterContext = {
    currentPath,
    onNavigate,
    onLogout: handleLogout,
  };

  // Mapeamento dinâmico de itens usando o adaptador do ambiente ativo
  let items: FloatingDockItem[] = [];
  switch (activeRole) {
    case "promoter":
    case "promotor":
      items = getPromoterDockItems(effectivePromoterState, context);
      break;
    case "hub":
    case "polo":
      items = getPoloDockItems(effectivePoloState, context);
      break;
    case "student":
    case "aluno":
    default:
      items = getStudentDockItems(effectiveStudentState, context);
      break;
  }

  // Renderização Opção 1: Bottom Bar Nativa (sem sobreposição de rodapé)
  if (variant === "bottom-bar") {
    return (
      <nav
        aria-label={`Navegação principal do ${activeRole}`}
        className="fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-brand-ink/90 backdrop-blur-2xl shadow-[0_-8px_32px_rgba(0,0,0,0.5)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="h-[2px] w-full bg-gradient-to-r from-brand-green via-brand-yellow to-brand-blue-bright" />
        <div className="mx-auto flex w-full max-w-lg items-center justify-around px-2 py-2">
          {items.map((item, index) => {
            const badgeBg =
              item.badgeVariant === "danger"
                ? "bg-rose-500 text-white"
                : item.badgeVariant === "success"
                ? "bg-emerald-500 text-white"
                : item.badgeVariant === "info"
                ? "bg-sky-500 text-white"
                : "bg-amber-400 text-black";

            const content = (
              <>
                <div className="relative flex h-6 w-6 items-center justify-center">
                  <div className="h-5 w-5">{item.icon}</div>
                  {item.badge !== undefined && item.badge !== null && (
                    <span
                      className={`absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-black shadow-md ${badgeBg}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight">{item.title}</span>
              </>
            );

            const commonClasses = `flex flex-col items-center gap-1 p-2 rounded-xl transition-all active:scale-95 cursor-pointer ${
              item.isActive
                ? "text-brand-yellow font-bold drop-shadow-[0_0_8px_rgba(255,204,0,0.3)]"
                : "text-white/70 hover:text-white"
            } ${item.disabled ? "opacity-40 pointer-events-none cursor-not-allowed" : ""}`;

            if (item.onClick) {
              return (
                <button
                  key={`${item.title}-${index}`}
                  type="button"
                  onClick={item.onClick}
                  disabled={item.disabled}
                  className={commonClasses}
                >
                  {content}
                </button>
              );
            }

            return (
              <a
                key={`${item.title}-${index}`}
                href={item.href || "#"}
                onClick={(e) => {
                  if (item.disabled) {
                    e.preventDefault();
                    return;
                  }
                  if (onNavigate && item.href) {
                    e.preventDefault();
                    onNavigate(item.href);
                  }
                }}
                className={commonClasses}
              >
                {content}
              </a>
            );
          })}
        </div>
      </nav>
    );
  }

  // Renderização Opção 2: Floating Dock Cápsula
  return (
    <FloatingDock
      items={items}
      desktopClassName="w-fit"
      dockAriaLabel={`Navegação principal do ${activeRole}`}
    />
  );
};

export default RoleAdaptiveNavDock;
