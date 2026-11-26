/**
 * Canonical role & status mapping for API v2 (ADR-0004 D1/D2/D5).
 * Only two roles exist: `client` (rendered as `student` in the app) and `admin`.
 */

export type BackendRole = "client" | "admin";

export type CanonicalEnvironment = "student" | "admin";
export type AppEnvironment = CanonicalEnvironment;

export type StudentStatus =
  | "lead"
  | "payment_pending"
  | "pre_enrolled"
  | "enrolled"
  | "exam_scheduled"
  | "awaiting_pickup"
  | "graduated"
  | "cancelled";

export type StudentSubstatus =
  | "cpf_verified"
  | "awaiting_email"
  | "awaiting_cpf"
  | "checkout_created"
  | "completed"
  | "refunded_by_admin"
  | "rg_pending"
  | "address_pending"
  | "needs_kinship"
  | "education_pending"
  | "selfie_pending"
  | "pending_siga"
  | "siga_active"
  | "pending_post_siga_docs"
  | "eligible_for_exam"
  | "scheduled"
  | "pending_documents"
  | "ready_for_pickup"
  | "failed"
  | string;

export type EnrollmentStatus =
  | "rg_pending"
  | "address_pending"
  | "needs_kinship"
  | "education_pending"
  | "selfie_pending"
  | "pending_siga"
  | string;

export const ENVIRONMENT_META: Record<
  CanonicalEnvironment,
  { label: string; icon: string; description: string; basePath: string }
> = {
  student: {
    label: "Aluno",
    icon: "🎓",
    description: "Ambiente de Formação e Conclusão do Ensino Médio",
    basePath: "/student",
  },
  admin: {
    label: "Administrador",
    icon: "⚙️",
    description: "Painel Unificado de Secretaria, Conferência e Financeiro",
    basePath: "/admin/dashboard",
  },
};

export function normalizeUserRoles(backendRoles: string[] = []): CanonicalEnvironment[] {
  const envSet = new Set<CanonicalEnvironment>();

  for (const rawRole of backendRoles) {
    const role = String(rawRole || "").toLowerCase().trim();
    if (["client", "student", "aluno", "lead", "enrollment", "veteran"].includes(role)) {
      envSet.add("student");
    } else if (role === "admin") {
      envSet.add("admin");
    }
  }

  const order: CanonicalEnvironment[] = ["student", "admin"];
  return order.filter((env) => envSet.has(env));
}

export function getPrimaryEnvironment(backendRoles: string[] = []): CanonicalEnvironment | null {
  const envs = normalizeUserRoles(backendRoles);
  if (envs.includes("admin") && !envs.includes("student")) return "admin";
  if (envs.includes("student")) return "student";
  if (envs.includes("admin")) return "admin";
  return null;
}

export interface RoleIdentity {
  roles: string[];
  role_statuses?: Record<string, string>;
  active_role?: string | null;
  status?: string | null;
  substatus?: string | null;
}

function resolvePreEnrolledRoute(substatus?: string | null): string {
  switch ((substatus || "").toLowerCase()) {
    case "rg_pending":
      return "/student/enrollment/rg";
    case "address_pending":
    case "needs_kinship":
      return "/student/enrollment/address";
    case "education_pending":
      return "/student/enrollment/education";
    case "selfie_pending":
      return "/student/enrollment/selfie";
    case "pending_siga":
    default:
      return "/student/enrollment";
  }
}

function resolveStudentStatus(identity: RoleIdentity): string | undefined {
  return (
    identity.role_statuses?.client ??
    identity.role_statuses?.student ??
    identity.status ??
    undefined
  );
}

/** Resolves the canonical destination path for an authenticated identity. */
export function getRoleDestination(
  identity: RoleIdentity,
  requestedRole?: CanonicalEnvironment
): string | null {
  const environments = normalizeUserRoles(identity.roles);
  if (environments.length === 0) return null;

  const targetEnv: CanonicalEnvironment =
    requestedRole ??
    (identity.active_role === "admin" && environments.includes("admin")
      ? "admin"
      : environments.includes("admin") && !environments.includes("student")
      ? "admin"
      : environments[0]);

  if (!environments.includes(targetEnv)) return null;

  if (targetEnv === "admin") {
    return "/admin/dashboard";
  }

  const status = resolveStudentStatus(identity);
  if (!status) return null;

  switch (status) {
    case "lead":
    case "payment_pending":
      return "/student/lead/payment";
    case "pre_enrolled":
      return resolvePreEnrolledRoute(identity.substatus);
    case "enrolled":
      return "/student/active/dashboard";
    case "exam_scheduled":
      return "/student/active/assessments";
    case "awaiting_pickup":
    case "graduated":
      return "/student/veteran/dashboard";
    case "cancelled":
      return "/student/active/finance";
    default:
      return null;
  }
}

export function canVisitRolePath(identity: RoleIdentity, pathname: string): boolean {
  const segment = pathname.split("/")[1];
  if (segment !== "student" && segment !== "admin") return true;

  const environments = normalizeUserRoles(identity.roles);
  if (segment === "admin") {
    return environments.includes("admin");
  }

  if (!environments.includes("student")) return false;
  const status = resolveStudentStatus(identity);
  const section = pathname.split("/")[2];
  if (!section) return true;

  if (section === "lead") {
    return status === "lead" || status === "payment_pending";
  }
  if (section === "enrollment") {
    return status === "pre_enrolled";
  }
  if (section === "active") {
    return (
      status === "enrolled" ||
      status === "exam_scheduled" ||
      (status === "cancelled" && pathname.startsWith("/student/active/finance"))
    );
  }
  if (section === "veteran") {
    return status === "awaiting_pickup" || status === "graduated";
  }
  return false;
}

export function formatStudentStatus(status?: string | null): {
  label: string;
  variant: "info" | "success" | "warning" | "danger";
} {
  switch (status) {
    case "lead":
    case "payment_pending":
      return { label: "Aguardando Matrícula", variant: "warning" };
    case "pre_enrolled":
      return { label: "Fase de Matrícula", variant: "info" };
    case "enrolled":
      return { label: "Matrícula Ativa", variant: "success" };
    case "exam_scheduled":
      return { label: "Prova Agendada", variant: "info" };
    case "awaiting_pickup":
      return { label: "Aguardando Retirada", variant: "warning" };
    case "graduated":
      return { label: "Concluído / Formado", variant: "success" };
    case "cancelled":
      return { label: "Matrícula Cancelada", variant: "danger" };
    default:
      return { label: "Em Andamento", variant: "info" };
  }
}
