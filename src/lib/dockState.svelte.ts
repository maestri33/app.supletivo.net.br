import { getAccessToken, getLogin } from "./session";
import { whoami, getEnrollmentStatus, getStudentMe, logoutAndRedirect } from "./api";
import type { RoleIdentity } from "./roles";
import type {
  UserRole,
  StudentDockState,
  AdminDockState,
  ItemHealthStatus,
} from "../components/interactive/dock/types";

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

  studentState = $state<StudentDockState>({
    status: null,
    substatus: null,
    pendingDocsCount: 0,
    hasPartnerUrl: false,
    isCheckoutReady: false,
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

    window.addEventListener("supletivo:identity", (e: Event) => {
      const identity = (e as CustomEvent<RoleIdentity>).detail;
      if (identity) this.applyIdentity(identity);
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
    return logoutAndRedirect();
  }
}

export const dockState = new DockStateStore();
