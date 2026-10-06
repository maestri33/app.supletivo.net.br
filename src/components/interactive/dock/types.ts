import type { AppEnvironment, StudentStatus, CandidateStatus, PromoterStatus, EnrollmentStatus } from "../../../lib/roles";

export type UserRole = AppEnvironment;

export interface AdapterContext {
  currentPath: string;
  onNavigate?: (href: string) => void;
  onLogout: () => void;
}

export type ItemHealthStatus = "pending" | "under_review" | "approved" | "rejected";

export interface StudentDockState {
  status: StudentStatus | EnrollmentStatus | string | null;
  pendingDocsCount?: number;
  hasPartnerUrl?: boolean;
  enrollmentStep?: EnrollmentStatus;
  isLocked?: boolean;
  leadPhase?: "selection" | "checkout";
  isCheckoutReady?: boolean;
  selectedModality?: "pix" | "credit_card" | null;
  rgStatus?: ItemHealthStatus;
  addressStatus?: ItemHealthStatus;
  educationStatus?: ItemHealthStatus;
  selfieStatus?: ItemHealthStatus;
  examStatus?: ItemHealthStatus;
  diplomaStatus?: ItemHealthStatus;
}

export interface PromoterDockState {
  status?: PromoterStatus | CandidateStatus | string;
  newLeadsCount?: number;
  isTrainingBlocked?: boolean;
  pendingMaterialsCount?: number;
  isCandidate?: boolean;
  onboardingStatus?: ItemHealthStatus;
  pixStatus?: ItemHealthStatus;
  termsStatus?: ItemHealthStatus;
}

export interface PoloDockState {
  status?: string;
  pendingValidationCount?: number;
  pendingExamsCount?: number;
  readyDiplomasCount?: number;
}

