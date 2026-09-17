export type UserRole = "aluno" | "promotor" | "polo" | "admin";

export interface AdapterContext {
  currentPath: string;
  onNavigate?: (href: string) => void;
  onLogout: () => void;
}

export interface StudentDockState {
  status: string | null;
  pendingDocsCount?: number;
  hasPartnerUrl?: boolean;
}

export interface PromoterDockState {
  newLeadsCount?: number;
}

export interface PoloDockState {
  pendingValidationCount?: number;
}

export interface AdminDockState {
  systemAlertsCount?: number;
}
