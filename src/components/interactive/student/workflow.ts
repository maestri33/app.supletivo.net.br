import { ApiError } from "@/lib/api";

export function enrollmentPath(status: string): string | null {
  switch (status) {
    case "rg": return "/student/enrollment/rg";
    case "address": return "/student/enrollment/address";
    case "education": return "/student/enrollment/education";
    case "selfie": return "/student/enrollment/selfie";
    case "awaiting_release": return "/student/enrollment";
    default: return null;
  }
}

export function followEnrollmentStatus(status: string): boolean {
  const target = enrollmentPath(status);
  if (target && window.location.pathname.replace(/\/$/, "") !== target) {
    window.location.replace(target);
    return true;
  }
  return false;
}

export function expectedStatus(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  const status = error.expectedStatus ?? error.extra?.expected_status;
  return typeof status === "string" ? status : null;
}

/** Only explicit HTTP(S) links may leave the app; reject embedded credentials. */
export function safePartnerUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.href;
  } catch { return null; }
}

/** Backend media paths are local files, never executable or protocol-relative URLs. */
export function safeMediaUrl(value: string | null | undefined): string | null {
  if (!value || /[\\\u0000-\u001f]/.test(value)) return null;
  if (/^https?:\/\//i.test(value)) return safePartnerUrl(value);
  if (value.startsWith("//") || /^[a-z][a-z\d+.-]*:/i.test(value)) return null;
  const path = value.replace(/^\/+/, "");
  if (!path || path.split("/").some(part => part === "." || part === "..")) return null;
  return path.startsWith("media/") ? `/${path}` : `/media/${path}`;
}

export const STUDENT_STATUS_LABELS: Record<string, string> = {
  awaiting_documents: "Aguardando documentos", documents_under_review: "Documentos em análise",
  blood_type_pending: "Tipo sanguíneo pendente", exam_released: "Prova liberada",
  exam_scheduled: "Prova agendada", exam_failed: "Nova prova necessária",
  awaiting_documentation_dispatch: "Aguardando envio da documentação", pending: "Pendências em aberto",
  awaiting_diploma_issuance: "Aguardando emissão do diploma", awaiting_pickup: "Aguardando retirada do diploma", veteran: "Concluído",
};

export function dateLabel(value: string | null | undefined): string {
  if (!value) return "Ainda não informado";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Data não disponível" : date.toLocaleDateString("pt-BR");
}

export function imageError(file: File): string | null {
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type)
    ? null : "Envie uma imagem JPG, PNG ou WebP legível.";
}
