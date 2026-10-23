/**
 * Mapeamento Canônico de Roles e Status do Backend (supletivo.net.br / backend Django Ninja)
 * 100% aderente a AGENTS.md e aos modelos de users.roles, student, candidate, promoter, hub e staff.
 * Nomes de status estritamente em inglês e de 1 única palavra (lead, enrollment, candidate, active, training, review).
 */

// Roles canônicas emitidas pelo backend nos claims do JWT e no whoami
export type BackendRole =
  | "lead"
  | "enrollment"
  | "student"
  | "veteran"
  | "candidate"
  | "promoter"
  | "training"
  | "coordinator"
  | "hub"
  | "staff"
  | "superuser"
  | "aluno"
  | "promotor"
  | "polo"
  | "admin";

// Ambientes de UI e de navegação no frontend (Inglês canônico com aliases PT-BR)
export type CanonicalEnvironment = "student" | "promoter" | "hub";
export type AppEnvironment = CanonicalEnvironment | "aluno" | "promotor" | "polo";

// Status do estudante (1 única palavra)
export type StudentStatus =
  | "lead"
  | "enrollment"
  | "awaiting_documents"
  | "documents_under_review"
  | "exam_released"
  | "exam_scheduled"
  | "exam_failed"
  | "pending"
  | "veteran";

// Status do promotor (1 única palavra)
export type PromoterStatus = "candidate" | "active" | "training" | "suspended";

// Status do candidato a promotor
export type CandidateStatus =
  | "documents"
  | "selfie"
  | "review"
  | "approved"
  | "rejected"
  | "completed"
  | string;

// Status da matrícula / enrollment
export type EnrollmentStatus =
  | "rg"
  | "selfie"
  | "address"
  | "contract"
  | "payment"
  | "completed"
  | string;

// Status do hub (1 única palavra)
export type HubStatus = "active" | "review";

// Metadados amigáveis de cada ambiente para Tabs superiores e navegação (PT-BR)
export const ENVIRONMENT_META: Record<
  string,
  { label: string; icon: string; description: string; basePath: string }
> = {
  student: {
    label: "Aluno",
    icon: "🎓",
    description: "Ambiente de Formação e Conclusão do Ensino Médio",
    basePath: "/student",
  },
  aluno: {
    label: "Aluno",
    icon: "🎓",
    description: "Ambiente de Formação e Conclusão do Ensino Médio",
    basePath: "/student",
  },
  promoter: {
    label: "Promotor",
    icon: "💼",
    description: "Gestão de Indicações, Leads e Comissões no PIX",
    basePath: "/promoter",
  },
  promotor: {
    label: "Promotor",
    icon: "💼",
    description: "Gestão de Indicações, Leads e Comissões no PIX",
    basePath: "/promoter",
  },
  hub: {
    label: "Polo / Hub",
    icon: "🏫",
    description: "Secretaria de Polo, Validação Documental e Bancas",
    basePath: "/hub",
  },
  polo: {
    label: "Polo / Hub",
    icon: "🏫",
    description: "Secretaria de Polo, Validação Documental e Bancas",
    basePath: "/hub",
  },
};

/**
 * Identifica o ambiente primário de entrada com base na hierarquia de privilégios:
 * hub > promoter > student
 */
export function getPrimaryEnvironment(backendRoles: string[] = []): CanonicalEnvironment | null {
  const normalized = backendRoles.map((r) => r.toLowerCase().trim());

  if (normalized.some((r) => ["coordinator", "hub", "polo"].includes(r))) {
    return "hub";
  }
  if (normalized.some((r) => ["promoter", "candidate", "training", "promotor"].includes(r))) {
    return "promoter";
  }
  return normalized.some((role) => ["lead", "enrollment", "student", "veteran", "aluno"].includes(role)) ? "student" : null;
}

/**
 * Normaliza a lista de roles brutas vindas do backend para a lista de ambientes canônicos.
 */
export function normalizeUserRoles(backendRoles: string[] = []): CanonicalEnvironment[] {
  const envSet = new Set<CanonicalEnvironment>();

  for (const rawRole of backendRoles) {
    const role = rawRole.toLowerCase().trim();

    if (["coordinator", "hub_coordinator", "coordinator_hub", "polo", "hub"].includes(role)) {
      envSet.add("hub");
    } else if (["candidate", "promoter", "training", "promotor"].includes(role)) {
      envSet.add("promoter");
    } else if (["lead", "enrollment", "student", "veteran", "aluno"].includes(role)) {
      envSet.add("student");
    }
  }

  // Ordem canônica de exibição: Aluno, Promotor, Hub
  const order: CanonicalEnvironment[] = ["student", "promoter", "hub"];
  return order.filter((env) => envSet.has(env));
}

export interface RoleIdentity {
  roles: string[];
  role_statuses?: Record<string, string>;
}

/** A missing backend state never grants an environment or successful status. */
export function getRoleDestination(identity: RoleIdentity, requestedRole?: CanonicalEnvironment): string | null {
  const environments = normalizeUserRoles(identity.roles);
  const role = requestedRole ?? (environments.includes('hub') ? 'hub'
    : environments.includes('promoter') ? 'promoter' : environments[0]);
  if (!role) {
    return identity.roles.some((value) => ['admin', 'staff', 'superuser'].includes(value))
      ? 'https://admin.supletivo.net.br/' : null;
  }
  if (!environments.includes(role)) return null;
  const status = identity.role_statuses?.[role];
  const routes: Record<CanonicalEnvironment, Record<string, string>> = {
    student: { lead: '/student/lead/payment', enrollment: '/student/enrollment',
      active: '/student/active/dashboard', veteran: '/student/veteran/dashboard' },
    promoter: { candidate: '/promoter/candidate', training: '/promoter/training',
      active: '/promoter/active', suspended: '/promoter/suspended' },
    hub: { active: '/hub/active', review: '/hub/review' },
  };
  return status ? routes[role][status] ?? null : null;
}

export function canVisitRolePath(identity: RoleIdentity, pathname: string): boolean {
  const role = pathname.split('/')[1] as CanonicalEnvironment;
  if (!['student', 'promoter', 'hub'].includes(role)) return true;
  if (!normalizeUserRoles(identity.roles).includes(role)) return false;
  const status = identity.role_statuses?.[role];
  if (role === 'hub') return status === 'active' || status === 'review';
  const section = pathname.split('/')[2];
  if (role === 'student' && section === 'active') return status === 'active';
  if (role === 'student' && section === 'veteran') return status === 'veteran';
  if (role === 'student' && section === 'enrollment') return status === 'enrollment';
  if (role === 'student' && section === 'lead') return status === 'lead';
  if (role === 'promoter') return status === section;
  return false;
}

/**
 * Formata em PT-BR o status do estudante para exibição em badges e cabeçalhos.
 */
export function formatStudentStatus(status?: string | null): {
  label: string;
  variant: "info" | "success" | "warning" | "danger";
} {
  switch (status) {
    case "lead":
      return { label: "Aguardando Matrícula", variant: "warning" };
    case "enrollment":
      return { label: "Fase de Matrícula", variant: "info" };
    case "awaiting_documents":
      return { label: "Aguardando Documentos", variant: "warning" };
    case "documents_under_review":
      return { label: "Documentos em Análise", variant: "info" };
    case "exam_released":
      return { label: "Liberado para Prova", variant: "success" };
    case "exam_scheduled":
      return { label: "Prova Agendada", variant: "info" };
    case "exam_failed":
      return { label: "Refazer Prova", variant: "danger" };
    case "pending":
      return { label: "Com Pendência", variant: "warning" };
    case "veteran":
      return { label: "Concluído / Formado", variant: "success" };
    default:
      return { label: "Em Andamento", variant: "info" };
  }
}
