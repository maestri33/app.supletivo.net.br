import * as React from "react";
import { getAccessToken, clearSession } from "@/lib/session";
import { getStudentMe, whoami } from "@/lib/api";
import type {
  UserRole,
  StudentDockState,
  PromoterDockState,
  PoloDockState,
} from "./types";

// Barramento de memória tipado e seguro para desacoplamento de estado de checkout
let leadCheckoutReadyGlobal = false;

export function setLeadCheckoutReadyState(ready: boolean): void {
  leadCheckoutReadyGlobal = ready;
  if (typeof document !== "undefined" && document.documentElement) {
    document.documentElement.dataset.supletivoCheckoutReady = ready ? "true" : "false";
  }
}

export function getLeadCheckoutReadyState(): boolean {
  if (typeof document !== "undefined" && document.documentElement) {
    if (document.documentElement.dataset.supletivoCheckoutReady === "true") {
      return true;
    }
  }
  return leadCheckoutReadyGlobal;
}

export interface UseDockSyncOptions {
  initialRole?: UserRole;
  controlledRole?: UserRole;
  currentPath?: string;
  bypassAuth?: boolean;
  onLogout?: () => void;
  controlledStudentState?: Partial<StudentDockState>;
  controlledPromoterState?: Partial<PromoterDockState>;
  controlledPoloState?: Partial<PoloDockState>;
}

export interface UseDockSyncReturn {
  activeRole: UserRole;
  isAuthenticated: boolean;
  isLocked: boolean;
  studentState: StudentDockState;
  promoterState: PromoterDockState;
  poloState: PoloDockState;
  handleLogout: () => void;
}

export function useDockSync({
  initialRole = "aluno",
  controlledRole,
  currentPath = "/painel",
  bypassAuth = false,
  onLogout,
  controlledStudentState,
  controlledPromoterState,
  controlledPoloState,
}: UseDockSyncOptions): UseDockSyncReturn {
  const [internalRole, setInternalRole] = React.useState<UserRole>(initialRole);
  const activeRole = controlledRole || internalRole;
  const [isLocked, setIsLocked] = React.useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(bypassAuth || true);

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
      isCheckoutReady: getLeadCheckoutReadyState(),
      selectedModality: null,
    };
  });

  const [promoterState, setPromoterState] = React.useState<PromoterDockState>({
    status: "active",
    newLeadsCount: 0,
    isTrainingBlocked: false,
    pendingMaterialsCount: 0,
  });

  const [poloState, setPoloState] = React.useState<PoloDockState>({
    pendingValidationCount: 0,
    pendingExamsCount: 0,
    readyDiplomasCount: 0,
  });

  const handleLogout = React.useCallback(() => {
    if (onLogout) {
      onLogout();
    } else {
      clearSession();
      if (typeof window !== "undefined") {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/");
      }
    }
  }, [onLogout]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    let isMounted = true;

    // Checagem de autenticação
    if (!bypassAuth) {
      const token = getAccessToken();
      if (!token) {
        setIsAuthenticated(false);
        return;
      }
    }
    setIsAuthenticated(true);

    const handleRoleChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ role: UserRole }>;
      if (customEvent.detail?.role) {
        setInternalRole(customEvent.detail.role);
      }
    };

    const handleLockChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ isLocked: boolean }>;
      if (typeof customEvent.detail?.isLocked === "boolean") {
        setIsLocked(customEvent.detail.isLocked);
      }
    };

    const handleStudentStateChange = (e: Event) => {
      const customEvent = e as CustomEvent<StudentDockState>;
      if (customEvent.detail) {
        setStudentState((prev) => ({ ...prev, ...customEvent.detail }));
      }
    };

    const handlePromoterStateChange = (e: Event) => {
      const customEvent = e as CustomEvent<PromoterDockState>;
      if (customEvent.detail) {
        setPromoterState((prev) => ({ ...prev, ...customEvent.detail }));
      }
    };

    const handlePoloStateChange = (e: Event) => {
      const customEvent = e as CustomEvent<PoloDockState>;
      if (customEvent.detail) {
        setPoloState((prev) => ({ ...prev, ...customEvent.detail }));
      }
    };

    const handleLeadPhaseChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ phase: "selection" | "checkout" }>;
      if (customEvent.detail?.phase) {
        setStudentState((prev) => ({ ...prev, leadPhase: customEvent.detail.phase }));
      }
    };

    const handleLeadCheckoutStatus = (e: Event) => {
      const customEvent = e as CustomEvent<{
        ready: boolean;
        phase?: "selection" | "checkout";
        modality?: "pix" | "credit_card" | null;
      }>;
      if (customEvent.detail) {
        setLeadCheckoutReadyState(customEvent.detail.ready);
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

    // Hidratação proativa assíncrona com flag de montagem
    const currentToken = getAccessToken();
    if (!studentState.status && currentToken) {
      whoami()
        .then((w) => {
          if (!isMounted) return;
          const stStatus = w.role_statuses?.student;
          if (stStatus === "enrollment") {
            setStudentState((prev) => ({ ...prev, status: "enrollment" }));
          } else if (stStatus === "lead") {
            setStudentState((prev) => ({ ...prev, status: "lead" }));
          } else if (stStatus === "student" || (Array.isArray(w.roles) && w.roles.includes("student"))) {
            getStudentMe()
              .then((s) => {
                if (!isMounted) return;
                if (s) {
                  setStudentState((prev) => ({
                    ...prev,
                    status: s.status ?? prev.status ?? null,
                    pendingDocsCount: s.pendencies?.length ?? prev.pendingDocsCount ?? 0,
                    hasPartnerUrl: Boolean(s.platform?.url),
                  }));
                }
              })
              .catch((err: unknown) => {
                console.debug("[useDockSync] getStudentMe hydration fallback:", err);
              });
          }
        })
        .catch((err: unknown) => {
          console.debug("[useDockSync] whoami hydration fallback:", err);
        });
    }

    return () => {
      isMounted = false;
      window.removeEventListener("supletivo:role-change", handleRoleChange);
      window.removeEventListener("supletivo:lock-change", handleLockChange);
      window.removeEventListener("supletivo:student-state", handleStudentStateChange);
      window.removeEventListener("supletivo:lead-wizard-phase", handleLeadPhaseChange);
      window.removeEventListener("supletivo:lead-checkout-status", handleLeadCheckoutStatus);
      window.removeEventListener("supletivo:promoter-state", handlePromoterStateChange);
      window.removeEventListener("supletivo:polo-state", handlePoloStateChange);
    };
  }, [bypassAuth, studentState.status]);

  const effectiveStudentState: StudentDockState = { ...studentState, ...controlledStudentState };
  const effectivePromoterState: PromoterDockState = { ...promoterState, ...controlledPromoterState };
  const effectivePoloState: PoloDockState = { ...poloState, ...controlledPoloState };

  return {
    activeRole,
    isAuthenticated,
    isLocked,
    studentState: effectiveStudentState,
    promoterState: effectivePromoterState,
    poloState: effectivePoloState,
    handleLogout,
  };
}
