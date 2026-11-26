export function enrollmentPath(stepOrSubstatus: string | number | null | undefined): string | null {
  switch (stepOrSubstatus) {
    case 1:
    case "rg":
    case "rg_pending":
      return "/student/enrollment/rg";
    case 2:
    case "address":
    case "address_pending":
    case "needs_kinship":
      return "/student/enrollment/address";
    case 3:
    case "education":
    case "education_pending":
      return "/student/enrollment/education";
    case 4:
    case "selfie":
    case "selfie_pending":
      return "/student/enrollment/selfie";
    case 5:
    case "awaiting_release":
    case "pending_siga":
      return "/student/enrollment";
    default:
      return null;
  }
}

/** Only explicit HTTPS links may leave the app; reject embedded credentials. */
export function safePartnerUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

/** Restricts return_to redirects to same-origin relative paths without backslashes or protocol-relative prefixes. */
export function safeReturnTo(
  returnTo: string | null | undefined,
  origin = typeof window !== "undefined" ? window.location.origin : "",
): string | null {
  if (!origin || !returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//") || returnTo.includes("\\")) {
    return null;
  }
  try {
    const parsed = new URL(returnTo, origin);
    if (parsed.origin !== origin) return null;
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return null;
  }
}

export const STUDENT_STATUS_LABELS: Record<string, string> = {
  lead: "Aguardando Matrícula",
  payment_pending: "Pagamento Pendente",
  pre_enrolled: "Fase de Matrícula",
  enrolled: "Matrícula Ativa",
  exam_scheduled: "Prova Agendada",
  awaiting_pickup: "Aguardando Retirada do Diploma",
  graduated: "Concluído",
  cancelled: "Matrícula Cancelada",
  siga_active: "Acesso Liberado",
  pending_post_siga_docs: "Documentação Complementar Pendente",
  eligible_for_exam: "Liberado para Prova",
  scheduled: "Prova Agendada",
  pending_documents: "Emissão de Diploma",
  ready_for_pickup: "Pronto para Retirada",
};

export function dateLabel(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "Ainda não informado";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Data não disponível" : date.toLocaleDateString("pt-BR");
}

export function dateTimeLabel(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "Ainda não informado";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Data não disponível"
    : date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export const DEFAULT_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ADMIN_PDF_MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

function fileSizeError(file: File, maxBytes: number): string | null {
  if (file.size <= maxBytes) return null;
  const maxMb = Math.round(maxBytes / (1024 * 1024));
  return `Escolha um arquivo de até ${maxMb} MB.`;
}

export function imageError(file: File, maxBytes = DEFAULT_MAX_UPLOAD_BYTES): string | null {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return "Envie uma imagem JPG, PNG ou WebP legível.";
  }
  return fileSizeError(file, maxBytes);
}

export function documentFileError(file: File, maxBytes = DEFAULT_MAX_UPLOAD_BYTES): string | null {
  if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) {
    return "Envie uma imagem (JPG, PNG, WebP) ou arquivo PDF legível.";
  }
  return fileSizeError(file, maxBytes);
}

export function pdfFileError(file: File, maxBytes = ADMIN_PDF_MAX_UPLOAD_BYTES): string | null {
  if (file.type !== "application/pdf") {
    return "Envie um arquivo PDF válido.";
  }
  return fileSizeError(file, maxBytes);
}
