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
  currentPath?: string;
  onNavigate?: (href: string) => void;
  onLogout?: () => void;
}

/**
 * Componente Adaptativo Multi-Role & Multi-Estado.
 * Arquitetura em camadas:
 * 1. Casca Base Genérica (FloatingDock com animações e micro-haptics)
 * 2. Adaptador por Perfil (aluno, promotor, polo, admin)
 * 3. Especialização por Sub-Estado Operacional (StudentStatus, Leads, Conferência)
 *
 * 100% aderente a AGENTS.md (Código em inglês, Interface 100% PT-BR).
 */
export const RoleAdaptiveNavDock: React.FC<RoleAdaptiveNavDockProps> = ({
  initialRole = "aluno",
  currentPath = "/painel",
  onNavigate,
  onLogout,
}) => {
  const [role, setRole] = React.useState<UserRole>(initialRole);
  const [isLocked, setIsLocked] = React.useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(true);

  // Estados operacionais de cada ambiente
  const [studentState, setStudentState] = React.useState<StudentDockState>({
    status: null,
    pendingDocsCount: 0,
    hasPartnerUrl: false,
  });
  const [promoterState] = React.useState<PromoterDockState>({
    newLeadsCount: 3,
  });
  const [poloState] = React.useState<PoloDockState>({
    pendingValidationCount: 5,
  });
  const [adminState] = React.useState<AdminDockState>({
    systemAlertsCount: 0,
  });

  // Logout canônico
  const handleLogout = React.useCallback(() => {
    if (onLogout) {
      onLogout();
    } else {
      clearSession();
      if (typeof window !== "undefined") {
        window.location.href = "/autenticacao/login";
      }
    }
  }, [onLogout]);

  // Sincronização e escuta de eventos do ecossistema
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // Se não houver token ativo no navegador, dock permanece invisível
    const token = getAccessToken();
    if (!token) {
      setIsAuthenticated(false);
      return;
    }
    setIsAuthenticated(true);

    // Escuta troca de role disparada por tabs superiores
    const handleRoleChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ role: UserRole }>;
      if (customEvent.detail?.role) {
        setRole(customEvent.detail.role);
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
        setStudentState((prev: StudentDockState) => ({ ...prev, ...customEvent.detail }));
      }
    };

    window.addEventListener("supletivo:role-change", handleRoleChange);
    window.addEventListener("supletivo:lock-change", handleLockChange);
    window.addEventListener("supletivo:student-state", handleStudentStateChange);

    // Hidratação proativa do status do aluno se logado
    if (!studentState.status && token) {
      getStudentMe()
        .then((s) => {
          if (s) {
            setStudentState({
              status: s.status ?? null,
              pendingDocsCount: s.pendencies?.length ?? 0,
              hasPartnerUrl: !!s.platform?.url,
            });
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
    };
  }, [studentState.status]);

  // Se não autenticado ou em estado travado (paywall), suprime o dock
  if (!isAuthenticated || isLocked) {
    return null;
  }

  const context: AdapterContext = {
    currentPath,
    onNavigate,
    onLogout: handleLogout,
  };

  // Mapeamento dinâmico de itens usando o adaptador do ambiente ativo
  let items: FloatingDockItem[] = [];
  switch (role) {
    case "promotor":
      items = getPromoterDockItems(promoterState, context);
      break;
    case "polo":
      items = getPoloDockItems(poloState, context);
      break;
    case "admin":
      items = getAdminDockItems(adminState, context);
      break;
    case "aluno":
    default:
      items = getStudentDockItems(studentState, context);
      break;
  }

  return (
    <FloatingDock
      items={items}
      desktopClassName="fixed bottom-6 inset-x-0 z-50"
      mobileClassName="fixed bottom-6 right-6 z-50"
      dockAriaLabel={`Navegação principal do ${role}`}
    />
  );
};

export default RoleAdaptiveNavDock;
