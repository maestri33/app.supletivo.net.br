import type { CanonicalEnvironment, StudentStatus, StudentSubstatus } from "../../../lib/roles";

export type UserRole = CanonicalEnvironment;

export interface AdapterContext {
  currentPath: string;
  onNavigate?: (href: string) => void;
  onLogout: () => void;
}

export type ItemHealthStatus = "pending" | "under_review" | "approved" | "rejected";

export interface StudentDockState {
  status: StudentStatus | string | null;
  substatus?: StudentSubstatus | null;
  pendingDocsCount?: number;
  hasPartnerUrl?: boolean;
  enrollmentStep?: string;
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

export interface AdminDockState {
  pendingDocsCount?: number;
  pendingSigaCount?: number;
  pendingExamsCount?: number;
  pendingDiplomasCount?: number;
}
