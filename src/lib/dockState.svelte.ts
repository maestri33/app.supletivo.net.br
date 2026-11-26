import { getAccessToken, clearSession, getLogin } from "./session";
import { whoami, getEnrollmentStatus, getStudentMe } from "./api";
import type { RoleIdentity } from "./roles";
import type {
  UserRole,
  StudentDockState,
  AdminDockState,
  ItemHealthStatus,
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

function mapDocHealth(item?: { submitted?: boolean; status?: string | null; needs_manual_review?: number }): ItemHealthStatus {
  if (!item?.submitted) return "pending";
  if (item.status === "approved") return "approved";
  if (item.status === "rejected") return "rejected";
  if (item.status === "pending") return "under_review";
  return "pending";
}

class DockStateStore {
  activeRole = $state<UserRole>("student");
  isAuthenticated = $state(false);
  isLocked = $state(false);
  currentHash = $state("");
  isCheckoutReady = $state(false);

  studentState = $state<StudentDockState>({
    status: null,
    substatus: null,
    pendingDocsCount: 0,
    hasPartnerUrl: false,
    leadPhase: "selection",
    isCheckoutReady: false,
    selectedModality: null,
  });

  adminState = $state<AdminDockState>({
    pendingDocsCount: 0,
    pendingSigaCount: 0,
    pendingExamsCount: 0,
    pendingDiplomasCount: 0,
  });

  private initialized = false;

  init(initialRole: UserRole = "student", currentPath: string = "/student", bypassAuth: boolean = false) {
    if (typeof window === "undefined") return;

    const pathname = window.location.pathname || currentPath;
    this.activeRole = pathname.startsWith("/admin") ? "admin" : initialRole;
    this.currentHash = window.location.hash;

    if (pathname.startsWith("/student/lead")) {
      this.studentState.status = "lead";
    } else if (pathname.startsWith("/student/enrollment")) {
      this.studentState.status = "pre_enrolled";
    } else if (pathname.startsWith("/student/active")) {
      this.studentState.status = "enrolled";
    } else if (pathname.startsWith("/student/veteran")) {
      this.studentState.status = "graduated";
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

    window.addEventListener("hashchange", () => {
      this.currentHash = window.location.hash;
    });

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
      const detail = (e as CustomEvent<{ status?: string; substatus?: string }>).detail;
      if (detail?.substatus) {
        this.studentState.substatus = detail.substatus;
        this.studentState.enrollmentStep = detail.substatus;
      } else if (detail?.status) {
        this.studentState.enrollmentStep = detail.status;
      }
    });

    window.addEventListener("supletivo:admin-state", (e: Event) => {
      const customEvent = e as CustomEvent<Partial<AdminDockState>>;
      if (customEvent.detail) {
        Object.assign(this.adminState, customEvent.detail);
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
        if (customEvent.detail.modality !== undefined) {
          this.studentState.selectedModality = customEvent.detail.modality;
        }
      }
    });

    const login = getLogin();
    if (login) {
      this.applyIdentity(login as unknown as RoleIdentity);
    }

    if (!bypassAuth && getAccessToken() && !pathname.startsWith("/admin")) {
      whoami()
        .then((w) => {
          this.applyIdentity(w);
          const stStatus = w.role_statuses?.client ?? w.role_statuses?.student ?? w.status;
          if (stStatus === "pre_enrolled") {
            getEnrollmentStatus()
              .then((enrollment) => {
                this.studentState.substatus = enrollment.substatus;
                this.studentState.enrollmentStep = enrollment.substatus ?? undefined;
                this.studentState.rgStatus = mapDocHealth(enrollment.checklist?.rg);
                this.studentState.addressStatus = mapDocHealth(enrollment.checklist?.proof_of_residence);
                this.studentState.educationStatus = mapDocHealth(enrollment.checklist?.education_level);
                this.studentState.selfieStatus = mapDocHealth(enrollment.checklist?.selfie);
              })
              .catch(() => {});
          } else if (stStatus === "enrolled" || stStatus === "exam_scheduled") {
            getStudentMe()
              .then((s) => {
                if (s) {
                  this.studentState.status = s.role.status;
                  this.studentState.substatus = s.role.substatus;
                  this.studentState.hasPartnerUrl = Boolean(s.siga_credentials?.url);
                  const cl = s.document_progress?.checklist;
                  const docs = [
                    cl?.school_records ?? cl?.transcript,
                    s.document_progress?.military_exempt ? null : (cl?.military_certificate ?? cl?.military_service),
                  ].filter(Boolean);
                  this.studentState.pendingDocsCount = docs.filter(
                    (d) => !d?.submitted || d.status !== "approved"
                  ).length;
                  this.studentState.examStatus =
                    s.role.status === "exam_scheduled"
                      ? "under_review"
                      : s.role.substatus === "eligible_for_exam"
                      ? "approved"
                      : undefined;
                }
              })
              .catch(() => {});
          }
        })
        .catch(() => {});
    }
  }

  applyIdentity(identity: RoleIdentity) {
    const statuses = identity.role_statuses ?? {};
    const studentStatus = statuses.client ?? statuses.student ?? identity.status;
    if (studentStatus) this.studentState.status = studentStatus;
    if (identity.substatus !== undefined) {
      this.studentState.substatus = identity.substatus;
      if (identity.substatus) this.studentState.enrollmentStep = identity.substatus;
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
