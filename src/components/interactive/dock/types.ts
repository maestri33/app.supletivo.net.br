import type { AppEnvironment, StudentStatus, CandidateStatus, PromoterStatus, EnrollmentStatus } from "@/lib/roles";

export type UserRole = AppEnvironment;

export interface AdapterContext {
  currentPath: string;
  onNavigate?: (href: string) => void;
  onLogout: () => void;
}

export interface StudentDockState {
  status: StudentStatus | EnrollmentStatus | string | null;
  pendingDocsCount?: number;
  hasPartnerUrl?: boolean;
  enrollmentStep?: EnrollmentStatus;
  isLocked?: boolean;
}

export interface PromoterDockState {
  status?: PromoterStatus | CandidateStatus | string;
  newLeadsCount?: number;
  isTrainingBlocked?: boolean;
  pendingMaterialsCount?: number;
  isCandidate?: boolean;
}

export interface PoloDockState {
  status?: string;
  pendingValidationCount?: number;
  pendingExamsCount?: number;
  readyDiplomasCount?: number;
}

export interface AdminDockState {
  status?: string;
  systemAlertsCount?: number;
  hubsCount?: number;
  isOracleSynced?: boolean;
}
