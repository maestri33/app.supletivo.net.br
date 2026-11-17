import { getAccessToken, clearSession, getLogin } from "./session";
import { whoami, getEnrollmentMe, getStudentMe } from "./api";
import type { RoleIdentity } from "./roles";
import type {
  UserRole,
  StudentDockState,
  PromoterDockState,
  PoloDockState,
} from "../components/interactive/dock/types";

let leadCheckoutReadyGlobal = false;

export function setLeadCheckoutReadyState(ready: boolean): void {
  leadCheckoutReadyGlobal = ready;
  dockState.isCheckoutReady = ready;
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

class DockStateStore {
  activeRole = $state<UserRole>("student");
  isAuthenticated = $state(false);
  isLocked = $state(false);
  currentHash = $state("");
  isCheckoutReady = $state(false);

  studentState = $state<StudentDockState>({
    status: null,
    pendingDocsCount: 0,
    hasPartnerUrl: false,
    leadPhase: "selection",
    isCheckoutReady: false,
    selectedModality: null,
  });

  promoterState = $state<PromoterDockState>({
    status: undefined,
    newLeadsCount: 0,
    isTrainingBlocked: false,
    pendingMaterialsCount: 0,
  });

  poloState = $state<PoloDockState>({
    pendingValidationCount: 0,
    pendingExamsCount: 0,
    readyDiplomasCount: 0,
  });

  private initialized = false;

  init(initialRole: UserRole = "student", currentPath: string = "/student", bypassAuth: boolean = false) {
    if (typeof window === "undefined") return;

    this.activeRole = initialRole;
    this.currentHash = window.location.hash;

    // Detect initial status from path
    if (window.location.pathname.startsWith("/student/lead") || currentPath.startsWith("/student/lead")) {
      this.studentState.status = "lead";
    } else if (window.location.pathname.startsWith("/student/enrollment") || currentPath.startsWith("/student/enrollment")) {
      this.studentState.status = "enrollment";
    }

    if (!bypassAuth) {
      const token = getAccessToken();
      if (!token) {
        this.isAuthenticated = false;
        return;
      }
    }
    this.isAuthenticated = true;

    if (this.initialized) return;
    this.initialized = true;

    // Sync hash
    window.addEventListener("hashchange", () => {
      this.currentHash = window.location.hash;
    });

    // Event listeners
    window.addEventListener("supletivo:role-change", (e: Event) => {
      const customEvent = e as CustomEvent<{ role: UserRole }>;
      if (customEvent.detail?.role) {
        this.activeRole = customEvent.detail.role;
      }
    });

    window.addEventListener("supletivo:lock-change", (e: Event) => {
      const customEvent = e as CustomEvent<{ isLocked: boolean }>;
      if (typeof customEvent.detail?.isLocked === "boolean") {
        this.isLocked = customEvent.detail.isLocked;
      }
    });

    window.addEventListener("supletivo:student-state", (e: Event) => {
      const customEvent = e as CustomEvent<Partial<StudentDockState>>;
      if (customEvent.detail) {
        Object.assign(this.studentState, customEvent.detail);
      }
    });

    window.addEventListener("supletivo:enrollment-state", (e: Event) => {
      const detail = (e as CustomEvent<{ status?: string }>).detail;
      if (detail?.status) {
        this.studentState.enrollmentStep = detail.status as any;
      }
    });

    window.addEventListener("supletivo:promoter-state", (e: Event) => {
      const customEvent = e as CustomEvent<Partial<PromoterDockState>>;
      if (customEvent.detail) {
        Object.assign(this.promoterState, customEvent.detail);
      }
    });

    window.addEventListener("supletivo:polo-state", (e: Event) => {
      const customEvent = e as CustomEvent<Partial<PoloDockState>>;
      if (customEvent.detail) {
        Object.assign(this.poloState, customEvent.detail);
      }
    });

    window.addEventListener("supletivo:identity", (e: Event) => {
      const identity = (e as CustomEvent<RoleIdentity>).detail;
      if (identity) this.applyIdentity(identity);
    });

    window.addEventListener("supletivo:lead-wizard-phase", (e: Event) => {
      const customEvent = e as CustomEvent<{ phase: "selection" | "checkout" }>;
      if (customEvent.detail?.phase) {
        this.studentState.leadPhase = customEvent.detail.phase;
      }
    });

    window.addEventListener("supletivo:lead-checkout-status", (e: Event) => {
      const customEvent = e as CustomEvent<{
        ready: boolean;
        phase?: "selection" | "checkout";
        modality?: "pix" | "credit_card" | null;
      }>;
      if (customEvent.detail) {
        setLeadCheckoutReadyState(customEvent.detail.ready);
        this.studentState.isCheckoutReady = customEvent.detail.ready;
        if (customEvent.detail.phase) this.studentState.leadPhase = customEvent.detail.phase;
        if (customEvent.detail.modality !== undefined) this.studentState.selectedModality = customEvent.detail.modality;
      }
    });

    // Hydrate from localStorage first for instant display
    const login = getLogin();
    if (login) {
      this.applyIdentity(login as unknown as RoleIdentity);
    }

    // Proactive background fetch
    if (!bypassAuth && getAccessToken()) {
      whoami()
        .then((w) => {
          this.applyIdentity(w);
          const stStatus = w.role_statuses?.student;
          if (stStatus === "enrollment") {
            getEnrollmentMe().then((enrollment) => {
              this.studentState.enrollmentStep = enrollment.status as any;
            }).catch(() => {});
          }
          if (stStatus === "active") {
            getStudentMe().then((s) => {
              if (s) {
                this.studentState.status = "active";
                this.studentState.pendingDocsCount = s.pendencies?.length ?? this.studentState.pendingDocsCount ?? 0;
                this.studentState.hasPartnerUrl = Boolean(s.platform?.url);
                this.studentState.examStatus = s.status === "exam_released" || s.status === "exam_scheduled" ? "under_review" : undefined;
              }
            }).catch(() => {});
          }
        })
        .catch(() => {});
    }
  }

  applyIdentity(identity: RoleIdentity) {
    const statuses = identity.role_statuses ?? {};
    if (statuses.student) this.studentState.status = statuses.student;
    if (statuses.promoter) {
      this.promoterState.status = statuses.promoter;
      this.promoterState.isCandidate = statuses.promoter === "candidate";
      this.promoterState.isTrainingBlocked = statuses.promoter === "training";
    }
    if (statuses.hub) {
      this.poloState.status = statuses.hub;
    }
  }

  logout() {
    clearSession();
    if (typeof window !== "undefined") {
      window.location.assign("/");
    }
  }
}

export const dockState = new DockStateStore();
