import {
  API_BASE_URL,
  API_TIMEOUT_MS,
  type InstitutionalContact,
} from "@/lib/config";
import { withDeadline } from "./deadline";
import type { Pricing } from "@/lib/payment";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getLogin,
  saveLogin,
} from "@/lib/session";

/* ============================== errors ============================== */

export class ApiError extends Error {
  readonly status: number;
  readonly expectedStatus?: string;
  readonly code?: string;
  readonly extra?: Record<string, unknown>;

  constructor(
    message: string,
    status: number,
    expectedStatus?: string,
    code?: string,
    extra?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.expectedStatus = expectedStatus;
    this.code = code;
    this.extra = extra;
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.name === "AbortError") {
    return "Tempo esgotado. Verifique sua conexão e tente novamente.";
  }
  return "Não foi possível conectar. Verifique sua conexão e tente novamente.";
}

/* ============================ http core ============================= */

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH";
  json?: unknown;
  file?: File;
  fileField?: string;
  formData?: FormData;
  token?: string;
  timeoutMs?: number;
}

const RETRY_DELAYS_MS = [250, 900];

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const deadline = Date.now() + (opts.timeoutMs ?? API_TIMEOUT_MS);
  const attempt = () => {
    if (Date.now() >= deadline) {
      throw new DOMException("Tempo esgotado.", "AbortError");
    }
    return requestOnce<T>(path, { ...opts, timeoutMs: deadline - Date.now() });
  };
  const method =
    opts.method ??
    (opts.json !== undefined || opts.file || opts.formData ? "POST" : "GET");
  if (method !== "GET") return attempt();
  for (const delay of RETRY_DELAYS_MS) {
    try {
      return await attempt();
    } catch (err) {
      if (!(err instanceof TypeError)) throw err;
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(delay, Math.max(0, deadline - Date.now())))
      );
    }
  }
  return await attempt();
}

async function requestOnce<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  return withDeadline(
    async () => {
      const headers: Record<string, string> = { Accept: "application/json" };
      let body: BodyInit | undefined;
      if (opts.formData) {
        body = opts.formData;
      } else if (opts.file) {
        const form = new FormData();
        form.append(opts.fileField || "file", opts.file);
        body = form;
      } else if (opts.json !== undefined) {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(opts.json);
      }
      if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

      const res = await fetch(`${API_BASE_URL}${path}`, {
        method: opts.method ?? (body !== undefined ? "POST" : "GET"),
        headers,
        body,
        credentials: "include",
        signal: controller.signal,
      });

      const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;

      if (!res.ok) {
        const topExtra: Record<string, unknown> = {};
        if (Array.isArray(data?.missing_fields)) topExtra.missing_fields = data.missing_fields;
        for (const key of ["wait_seconds", "retry_after_s", "expected_status", "available"] as const) {
          if (data?.[key] !== undefined) topExtra[key] = data[key];
        }

        const nestedExtra =
          data?.extra && typeof data.extra === "object"
            ? (data.extra as Record<string, unknown>)
            : {};

        throw new ApiError(
          (typeof data?.error === "string" && data.error) ||
            (typeof data?.detail === "string" && data.detail) ||
            `Erro ${res.status}`,
          res.status,
          typeof data?.expected_status === "string" ? data.expected_status : undefined,
          typeof data?.code === "string" ? data.code : undefined,
          { ...topExtra, ...nestedExtra }
        );
      }

      return data as T;
    },
    opts.timeoutMs ?? API_TIMEOUT_MS,
    () => controller.abort()
  );
}

let refreshPromise: Promise<LoginResponse> | null = null;

async function doRefreshAuthTokens(failedToken?: string): Promise<LoginResponse> {
  const currentAccess = getAccessToken();
  if (failedToken && currentAccess && currentAccess !== failedToken) {
    const refresh = getRefreshToken() ?? "";
    return { access_token: currentAccess, refresh_token: refresh, token_type: "Bearer" };
  }

  if (!refreshPromise) {
    const refresh = getRefreshToken();
    refreshPromise = request<LoginResponse>("/api/v1/auth/refresh", {
      json: refresh ? { refresh_token: refresh } : {},
    })
      .then((tokens) => {
        saveLogin({ ...getLogin(), ...tokens });
        return tokens;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function refreshAuthTokens(failedToken?: string): Promise<LoginResponse> {
  if (typeof navigator !== "undefined" && navigator?.locks?.request) {
    return navigator.locks.request("supletivo_auth_refresh_lock", () =>
      doRefreshAuthTokens(failedToken)
    );
  }
  return doRefreshAuthTokens(failedToken);
}

async function refreshAndRetryAuth<T>(
  path: string,
  opts: RequestOptions,
  deadline: number,
  failedToken?: string
): Promise<T> {
  let tokens: LoginResponse;
  try {
    tokens = await withDeadline(
      () => refreshAuthTokens(failedToken),
      deadline - Date.now()
    );
  } catch (failure) {
    if (failure instanceof ApiError && [400, 401, 403].includes(failure.status)) {
      clearSession();
      throw new ApiError("Sessão expirada. Entre novamente.", 401);
    }
    throw failure;
  }
  if (!tokens.access_token) {
    clearSession();
    throw new ApiError("Sessão expirada. Entre novamente.", 401);
  }
  if (Date.now() >= deadline) throw new DOMException("Tempo esgotado.", "AbortError");
  return request<T>(path, {
    ...opts,
    timeoutMs: deadline - Date.now(),
    token: tokens.access_token,
  });
}

export async function requestAuth<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const deadline = Date.now() + (opts.timeoutMs ?? API_TIMEOUT_MS);
  const token = getAccessToken();
  if (!token) {
    return refreshAndRetryAuth<T>(path, opts, deadline);
  }
  try {
    return await request<T>(path, { ...opts, token });
  } catch (error: unknown) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    return refreshAndRetryAuth<T>(path, opts, deadline, token);
  }
}

/* ============================== auth =============================== */

export interface CheckResponse {
  found: boolean;
  created?: boolean;
  registered?: boolean;
  external_id: string | null;
  otp_sent: boolean;
  otp_wait: number | null;
  whatsapp: boolean | null;
  roles: string[] | null;
  masked_phone?: string | null;
  masked_email?: string | null;
}

export function checkPhone(phone: string): Promise<CheckResponse> {
  return request<CheckResponse>("/api/v1/auth/check", {
    json: { phone, send_otp: true },
  });
}

export interface SendOtpResponse {
  sent: boolean;
  channel: string;
  masked_phone: string | null;
  masked_email: string | null;
}

export function sendOtp(
  phone: string,
  channel: "whatsapp" | "email" | "all" = "whatsapp"
): Promise<SendOtpResponse> {
  return request<SendOtpResponse>("/api/v1/auth/otp/send", {
    json: { phone, channel },
  });
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in?: number;
  user?: {
    id: string;
    phone: string;
    name?: string | null;
    roles?: string[];
    activeRole?: string;
  };
}

export function loginOtp(
  identifier: string,
  code: string,
  channel: "whatsapp" | "email" = "whatsapp"
): Promise<LoginResponse> {
  return request<LoginResponse>("/api/v1/auth/otp/verify", {
    json: { identifier, code, channel },
  });
}

export interface WhoAmI {
  authenticated: boolean;
  id: string;
  external_id: string;
  name: string | null;
  phone: string;
  email: string | null;
  cpf: string | null;
  gender?: "M" | "F" | "OTHER" | null;
  roles: string[];
  active_role: "client" | "admin" | null;
  role_statuses: Record<string, string>;
  status: string | null;
  substatus: string | null;
  paid_at: number | null;
}

export function whoami(): Promise<WhoAmI> {
  return requestAuth<WhoAmI>("/api/v1/auth/whoami");
}

/* =========================== recovery ============================== */

export interface RecoverLookupResponse {
  found: boolean;
  user_id?: string;
  first_name?: string;
  masked_phone?: string;
  masked_email?: string | null;
  has_email?: boolean;
  error?: string;
}

export function recoverLookup(cpf: string): Promise<RecoverLookupResponse> {
  return request<RecoverLookupResponse>("/api/v1/auth/recover/lookup", {
    json: { cpf },
  });
}

export interface RecoverSendOtpResponse {
  sent: boolean;
  masked_email?: string | null;
  masked_phone?: string | null;
  wait_seconds?: number;
}

export function recoverSendOtp(
  cpf: string,
  channel: "email" | "whatsapp" = "email"
): Promise<RecoverSendOtpResponse> {
  return request<RecoverSendOtpResponse>("/api/v1/auth/recover/send-otp", {
    json: { cpf, channel },
  });
}

export interface RecoverVerifyResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    name: string | null;
    new_phone: string;
    masked_new_phone: string;
  };
}

export function recoverVerifyAndLink(
  cpf: string,
  code: string,
  newPhone: string
): Promise<RecoverVerifyResponse> {
  return request<RecoverVerifyResponse>("/api/v1/auth/recover/verify-and-link", {
    json: { cpf, code, new_phone: newPhone },
  });
}

/* ========================= catalog & profile ======================= */

export async function fetchPricing(): Promise<Pricing> {
  const data = await request<
    Pricing & {
      promo_pix?: string | null;
      promo_card?: Pricing["card"] | null;
    }
  >("/api/v1/catalog/pricing");
  const pix =
    data.promo_pix ?? (data.pix === "1615.00" ? "999.00" : data.pix || "999.00");
  return {
    ...data,
    pix,
    card: data.promo_card ?? null,
  };
}

export function fetchContact(): Promise<InstitutionalContact> {
  return request<InstitutionalContact>("/api/v1/catalog/contact");
}

export interface CpfLookupResponse {
  success: boolean;
  data: {
    cpf: string;
    name: string;
    birthDate: string | null;
    gender: string | null;
    cached: boolean;
  };
  source: string;
}

export function confirmIdentity(
  cpf: string,
  turnstileToken?: string
): Promise<CpfLookupResponse> {
  return requestAuth<CpfLookupResponse>("/api/v1/auth/cpf/lookup", {
    json: {
      cpf,
      ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
    },
    timeoutMs: 30_000,
  });
}

export interface EmailOut {
  success: boolean;
  email: string;
  already_yours: boolean;
}

export function setLeadEmail(email: string): Promise<EmailOut> {
  return requestAuth<EmailOut>("/api/v1/users/me", {
    method: "PATCH",
    json: { email },
  });
}

/* ===================== checkout & payment ========================== */

export interface CheckoutCreateResponse {
  success: boolean;
  payment_id: string;
  payment_attempt_id: string;
  order_nsu: string;
  checkout_url: string;
  amount_cents: number;
  provider: "infinitepay";
  status: string;
  expires_at?: string;
  message?: string;
}

export function createCheckout(
  paymentMethod?: "pix" | "card",
  idempotencyKey?: string
): Promise<CheckoutCreateResponse> {
  return requestAuth<CheckoutCreateResponse>("/api/v1/checkout/create", {
    json: {
      provider: "infinitepay",
      ...(paymentMethod ? { payment_method: paymentMethod } : {}),
      ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
    },
    timeoutMs: 30_000,
  });
}

export interface CheckoutStatusResponse {
  payment_id: string;
  payment_attempt_id: string;
  provider: string;
  status: "pending" | "paid" | "failed" | "refunded" | string;
  amount_cents: number;
  amount: string;
  role_id: string;
  role_status?: string;
  paid_at?: number | null;
  receipt_url?: string | null;
  checkout_url?: string | null;
  order_nsu?: string;
  slug?: string | null;
}

export function getCheckoutStatus(paymentId: string): Promise<CheckoutStatusResponse> {
  return requestAuth<CheckoutStatusResponse>(
    `/api/v1/checkout/status/${encodeURIComponent(paymentId)}`
  );
}

export interface StudentCurrentPayment {
  success: boolean;
  payment_attempt_id: string;
  provider: string;
  amount_cents: number;
  amount: string;
  status: "pending" | "paid" | "failed" | "refunded" | string;
  payment_method: string | null;
  checkout_url: string | null;
  receipt_url: string | null;
  paid_at: number | null;
  created_at: number;
}

export function getCurrentPayment(): Promise<StudentCurrentPayment> {
  return requestAuth<StudentCurrentPayment>("/api/v1/student/payment/current");
}

export interface UnifiedCheckoutResponse {
  success: boolean;
  mode: "pending" | "paid";
  payment_id: string;
  payment_attempt_id: string;
  order_nsu: string;
  checkout_url: string | null;
  amount_cents: number;
  amount: string;
  provider: string;
  payment_method?: string | null;
  status: string;
  expires_at?: string | null;
  receipt_url?: string | null;
  paid_at?: number | null;
  renewed?: boolean;
  role_status?: string;
}

export function getUnifiedCheckout(): Promise<UnifiedCheckoutResponse> {
  return requestAuth<UnifiedCheckoutResponse>("/api/v1/checkout", {
    method: "GET",
    timeoutMs: 30_000,
  });
}

export function logoutSession(): Promise<{ success: boolean }> {
  return request<{ success: boolean }>("/api/v1/auth/logout", {
    method: "POST",
    json: {},
  });
}

export async function logoutAndRedirect(): Promise<void> {
  await logoutSession().catch(() => null);
  clearSession();
  if (typeof window !== "undefined") {
    window.location.assign("/");
  }
}

export function exchangeSessionLink(token: string): Promise<LoginResponse> {
  return request<LoginResponse>("/api/v1/auth/session-link/exchange", {
    method: "POST",
    json: { token },
  });
}

export interface CardPaymentReferences {
  order_nsu: string;
  transaction_nsu: string;
  slug: string;
  receipt_url?: string;
}

export interface CardConfirmationResponse {
  success: boolean;
  already_paid?: boolean;
  paid?: boolean;
  status: string;
  payment_id: string;
  order_nsu: string;
  receipt_url?: string | null;
  paid_at?: number | null;
  message?: string;
}

export function confirmCardPayment(
  references: CardPaymentReferences
): Promise<CardConfirmationResponse> {
  return requestAuth<CardConfirmationResponse>(
    "/api/v1/student/payment/card-confirmation",
    { json: references, timeoutMs: 30_000 }
  );
}

export interface StudentPaymentReceipt {
  success: boolean;
  available: boolean;
  receipt_url: string;
  amount_cents: number;
  amount: string;
  paid_at: number;
}

export function getPaymentReceipt(): Promise<StudentPaymentReceipt> {
  return requestAuth<StudentPaymentReceipt>("/api/v1/student/payment/receipt");
}

/* ====================== onboarding pre_enrolled ==================== */

export type ValidationStatus = "pending" | "approved" | "rejected" | "review";

export interface EnrollmentChecklistItem {
  submitted: boolean;
  status: string | null;
  rejection_reason: string | null;
  updated_at: number | null;
  needs_manual_review?: number;
}

export interface EnrollmentStatusResponse {
  student_role_id: string;
  current_status: string;
  substatus: string | null;
  step: number;
  missing_fields: string[];
  partner_access_ready: boolean;
  checklist: {
    rg: EnrollmentChecklistItem;
    proof_of_residence: EnrollmentChecklistItem;
    education_level: EnrollmentChecklistItem;
    contract_signature: EnrollmentChecklistItem;
    selfie: EnrollmentChecklistItem;
  };
  all_basic_docs_ready: boolean;
  message: string;
}

export function getEnrollmentStatus(): Promise<EnrollmentStatusResponse> {
  return requestAuth<EnrollmentStatusResponse>("/api/v1/enrollment/status");
}

export interface PhotoSlotStatus {
  status: string;
  reason?: string | null;
}

export interface RgSection {
  number?: string | null;
  issuing_agency?: string | null;
  front_photo?: string | null;
  back_photo?: string | null;
  full_photo?: string | null;
  analysis_status?: string | null;
  validation_status?: string | null;
  analysis_reason?: string | null;
  validation_reason?: string | null;
  blocked?: boolean;
  next_slot?: "rg_front" | "rg_back" | "rg_full" | null;
  photos?: Record<string, PhotoSlotStatus>;
  mother_name?: string | null;
  father_name?: string | null;
  name?: string | null;
}

export interface AnalysisAck {
  analysis_status?: string | null;
  analysis?: string | null;
  poll_after_ms?: number | null;
  expires_at?: string | null;
}

export interface RgUploadAck extends AnalysisAck {
  slot: "front" | "back" | "full";
  stored: string;
  r2_key?: string;
  rg_complete: boolean;
  next_slot: "rg_front" | "rg_back" | null;
  substatus: string | null;
  status: string;
  needs_manual_review?: number;
}

function normalizeRgMediaUrl(raw?: string | null): string | null {
  if (!raw) return null;
  if (raw.startsWith("/v1/media/")) return `/media/${raw.slice("/v1/media/".length)}`;
  return raw;
}

function resolveRgAnalysisStatus(status?: string, needsManualReview?: number): string {
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  return needsManualReview ? "review" : "pending";
}

export async function getEnrollmentRg(): Promise<RgSection> {
  const res = await requestAuth<{
    submitted: boolean;
    document?: {
      r2_key?: string | null;
      status?: string;
      needs_manual_review?: number;
      rejection_reason?: string | null;
      data_payload?: string | { slots?: Record<string, string> };
      extracted_data?: Record<string, unknown>;
    } | null;
    rg_section?: RgSection | null;
  }>("/api/v1/enrollment/documents/rg");

  if (res.rg_section) {
    return {
      ...res.rg_section,
      front_photo: normalizeRgMediaUrl(res.rg_section.front_photo),
      back_photo: normalizeRgMediaUrl(res.rg_section.back_photo),
      full_photo: normalizeRgMediaUrl(res.rg_section.full_photo),
    };
  }

  if (!res.submitted || !res.document) {
    return {
      front_photo: null,
      back_photo: null,
      full_photo: null,
      next_slot: "rg_front",
      analysis_status: null,
      photos: {},
    };
  }

  let parsedPayload: { slots?: Record<string, string> } = {};
  if (typeof res.document.data_payload === "string") {
    try {
      parsedPayload = JSON.parse(res.document.data_payload);
    } catch {}
  } else if (res.document.data_payload && typeof res.document.data_payload === "object") {
    parsedPayload = res.document.data_payload;
  }

  const slots = parsedPayload.slots ?? {};
  const ext = res.document.extracted_data ?? {};
  const statusStr = resolveRgAnalysisStatus(res.document.status, res.document.needs_manual_review);

  return {
    front_photo: normalizeRgMediaUrl(slots.front ?? null),
    back_photo: normalizeRgMediaUrl(slots.back ?? null),
    full_photo: normalizeRgMediaUrl(slots.full ?? res.document.r2_key ?? null),
    analysis_status: statusStr,
    analysis_reason: res.document.rejection_reason ?? null,
    next_slot: slots.full || (slots.front && slots.back) ? null : !slots.front ? "rg_front" : "rg_back",
    photos: {
      ...(slots.front ? { rg_front: { status: statusStr } } : {}),
      ...(slots.back ? { rg_back: { status: statusStr } } : {}),
      ...(slots.full ? { rg_full: { status: statusStr } } : {}),
    },
    number: typeof ext.rg_number === "string" ? ext.rg_number : null,
    issuing_agency: typeof ext.issuing_agency === "string" ? ext.issuing_agency : null,
    name: typeof ext.name === "string" ? ext.name : null,
    mother_name: typeof ext.mother_name === "string" ? ext.mother_name : null,
    father_name: typeof ext.father_name === "string" ? ext.father_name : null,
  };
}

export async function postEnrollmentRgPhoto(
  slot: "front" | "back" | "full",
  file: File
): Promise<RgUploadAck> {
  const res = await requestAuth<{
    slot?: "front" | "back" | "full";
    stored?: string;
    r2_key?: string;
    rg_complete?: boolean;
    next_slot?: "rg_front" | "rg_back" | null;
    substatus?: string | null;
    analysis_status?: string;
    status?: string;
    needs_manual_review?: number;
  }>(`/api/v1/enrollment/documents/rg/photo/${slot}`, {
    file,
    timeoutMs: 60_000,
  });

  const analysisStatus =
    res.analysis_status ?? resolveRgAnalysisStatus(res.status, res.needs_manual_review);

  return {
    slot: res.slot ?? slot,
    stored: res.stored ?? res.r2_key ?? "",
    r2_key: res.r2_key,
    rg_complete: Boolean(res.rg_complete),
    next_slot: res.next_slot ?? null,
    substatus: res.substatus ?? null,
    analysis_status: analysisStatus,
    status: res.status ?? analysisStatus,
    needs_manual_review: res.needs_manual_review,
  };
}

export interface DocClassify {
  is_document: boolean | null;
  doc_type: "rg" | "cnh" | "other" | "address_proof" | null;
  completeness: "front" | "back" | "full" | null;
  is_legible?: boolean | null;
  reason?: string | null;
  error_code?: string | null;
  confidence: number | null;
  document_type?: string;
  readable?: boolean;
}

export async function classifyDocument(file: File): Promise<DocClassify> {
  const res = await requestAuth<DocClassify>(
    "/api/v1/enrollment/documents/classify",
    {
      file,
      timeoutMs: 60_000,
    }
  );
  const rawDocType = res.doc_type ?? (res.document_type as DocClassify["doc_type"]) ?? null;
  return {
    ...res,
    doc_type: rawDocType,
    is_document:
      res.is_document !== undefined
        ? res.is_document
        : rawDocType
        ? rawDocType !== "other"
        : null,
    is_legible:
      res.is_legible !== undefined ? res.is_legible : res.readable ?? null,
  };
}

/* address proof ----------------------------------------------------- */

export interface AddressProofUploadResponse {
  id: string;
  document_id: string;
  document_type: "proof_of_residence";
  status: string;
  ocr_confidence: number;
  needs_manual_review: number;
  r2_key: string;
  file_url: string | null;
  needs_kinship?: boolean;
  is_pdf?: boolean;
  extracted_data?: {
    street?: string | null;
    number?: string | null;
    neighborhood?: string | null;
    city?: string | null;
    state?: string | null;
    cep?: string | null;
    residentName?: string | null;
    resident_name?: string | null;
    name_matched?: boolean;
  };
  substatus: string | null;
}

export function uploadEnrollmentAddressProof(
  file: File
): Promise<AddressProofUploadResponse> {
  return requestAuth<AddressProofUploadResponse>(
    "/api/v1/enrollment/address/proof",
    {
      file,
      timeoutMs: 60_000,
    }
  );
}

export interface KinshipResponse {
  id: string;
  document_id: string;
  status: string;
  kinship: {
    relation: string;
    owner_name: string;
    declared_at: string;
  };
  substatus: string | null;
}

export function submitAddressProofKinship(
  relation: string,
  ownerName?: string
): Promise<KinshipResponse> {
  const cleanOwner = ownerName?.trim();
  return requestAuth<KinshipResponse>(
    "/api/v1/enrollment/address/proof/kinship",
    {
      json: {
        relation,
        ...(cleanOwner ? { owner_name: cleanOwner } : {}),
      },
    }
  );
}

/* education --------------------------------------------------------- */

export type EducationLevel = "fundamental" | "medio";

export interface EducationOut {
  submitted: boolean;
  status: string | null;
  data: {
    level?: EducationLevel | null;
    grade?: number | string | null;
    completed?: boolean | null;
    last_school?: string | null;
    city?: string | null;
    state?: string | null;
    last_year_when?: string | number | null;
  } | null;
  updated_at?: number | null;
}

export interface EducationIn {
  level: EducationLevel;
  grade: number;
  completed: boolean;
  last_school?: string | null;
  city: string;
  state: string;
  last_year_when?: string | number | null;
  declaration_accepted: boolean;
}

export interface EducationDeclarationResponse {
  id: string;
  document_type: "education_level";
  status: string;
  substatus?: string | null;
  message: string;
}

export function getEnrollmentEducation(): Promise<EducationOut> {
  return requestAuth<EducationOut>("/api/v1/enrollment/education");
}

export function postEnrollmentEducation(
  edu: EducationIn
): Promise<EducationDeclarationResponse> {
  return requestAuth<EducationDeclarationResponse>("/api/v1/enrollment/education", {
    json: edu,
  });
}

/* contract & selfie ------------------------------------------------- */

export interface Contract {
  version: string;
  hash: string;
  text: string;
  contract_version?: string;
  sha256_hash?: string;
}

export function getContract(): Promise<Contract> {
  return requestAuth<Contract>("/api/v1/contract/current");
}

export interface ContractSignResponse {
  id: string;
  document_type: "contract_signature";
  status: "approved";
  signed_at: number;
  substatus?: string | null;
}

export function signContract(contractVersionHash: string): Promise<ContractSignResponse> {
  return requestAuth<ContractSignResponse>("/api/v1/student/contract/sign", {
    json: {
      contract_version_hash: contractVersionHash,
      accepted: true,
    },
  });
}

export interface SelfieUploadResponse {
  id: string;
  document_id: string;
  document_type: "selfie";
  status: string;
  ocr_confidence: number;
  needs_manual_review: number;
  r2_key: string;
  file_url: string | null;
  substatus: string | null;
}

export function postEnrollmentSelfie(file: File): Promise<SelfieUploadResponse> {
  return requestAuth<SelfieUploadResponse>("/api/v1/enrollment/selfie", {
    file,
    fileField: "selfie",
    timeoutMs: 60_000,
  });
}

/* ====================== student active & veteran =================== */

export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
export type PostSigaDocType = "school_records" | "military_certificate";

export interface AcademicChecklistItem {
  submitted: boolean;
  status: string | null;
  rejection_reason: string | null;
  updated_at: number | null;
  exempt?: boolean;
}

export interface StudentMeV2 {
  user: {
    id: string;
    phone: string;
    cpf: string | null;
    name: string | null;
    full_name: string | null;
    gender: "M" | "F" | "OTHER" | null;
    blood_type: BloodType | null;
  };
  role: {
    id: string;
    role: "client" | "admin";
    status: string;
    substatus: string | null;
    paid_at?: number | null;
  };
  siga_credentials: {
    username: string;
    password?: string;
    url: string;
  } | null;
  document_progress: {
    blood_type_registered: boolean;
    military_exempt: boolean;
    academic_documents_ready: boolean;
    checklist: {
      school_records?: AcademicChecklistItem;
      transcript?: AcademicChecklistItem;
      military_certificate?: AcademicChecklistItem;
      military_service?: AcademicChecklistItem;
      birth_certificate?: AcademicChecklistItem;
    };
  };
}

export function getStudentMe(): Promise<StudentMeV2> {
  return requestAuth<StudentMeV2>("/api/v1/student/me");
}

export interface StudentDocumentItemV2 {
  id: string;
  document_type: string;
  status: string;
  file_key: string | null;
  file_url?: string | null;
  rejection_reason: string | null;
  created_at: number;
  updated_at: number;
}

export interface StudentDocumentsList {
  student_role_id: string;
  user_id: string;
  gender: string | null;
  blood_type: BloodType | null;
  military_exempt: boolean;
  is_fully_compliant: boolean;
  documents: StudentDocumentItemV2[];
  pending_requirements: string[];
}

export function getStudentDocuments(): Promise<StudentDocumentsList> {
  return requestAuth<StudentDocumentsList>("/api/v1/student/documents");
}

export function postStudentDocument(
  type: PostSigaDocType,
  file: File
): Promise<{ id: string; document_type: string; status: string; file_key: string }> {
  return requestAuth(`/api/v1/student/documents/${type}`, {
    file,
    timeoutMs: 60_000,
  });
}

export function postStudentBloodType(
  bloodType: BloodType
): Promise<{ success: boolean; user_id: string; blood_type: BloodType; message: string }> {
  return requestAuth("/api/v1/student/blood-type", {
    json: { blood_type: bloodType },
  });
}

export interface StudentExamItem {
  id: string;
  student_role_id: string;
  subject: string;
  scheduled_at: number;
  attempt_number: number;
  result: "passed" | "failed" | null;
  corrected_exam_file_key?: string | null;
  notes: string | null;
}

export interface StudentExamsResponse {
  student_role_id: string;
  current_status: string;
  current_substatus: string | null;
  eligibility: {
    exam_can_schedule: boolean;
    exam_available_at: string;
    exam_block_reason: string | null;
  };
  exams: StudentExamItem[];
}

export function getStudentExams(): Promise<StudentExamsResponse> {
  return requestAuth<StudentExamsResponse>("/api/v1/student/exams");
}

export function postStudentExamSchedule(input: {
  subject: string;
  scheduled_at: string;
}): Promise<{ exam: StudentExamItem; new_status: string; new_substatus: string; message: string }> {
  return requestAuth("/api/v1/student/exams/schedule", {
    json: { subject: input.subject, scheduled_at: input.scheduled_at },
  });
}

export interface StudentDiplomaResponse {
  student_role_id: string;
  status: string;
  is_graduated: boolean;
  registration: {
    registration_number: string | null;
    process_number: string | null;
    book_number: string | null;
    page_number: string | null;
    gazette_publication_date: string | null;
    issued_at: string | null;
  } | null;
  documents: {
    diploma_download_url: string | null;
    transcript_download_url: string | null;
  } | null;
  pickup: {
    hub_name: string;
    address: string | null;
    contact_phone: string | null;
    picked_up: boolean;
    picked_up_at: string | null;
  };
  message: string;
}

export function getStudentDiploma(): Promise<StudentDiplomaResponse> {
  return requestAuth<StudentDiplomaResponse>("/api/v1/student/diploma");
}

/* =========================== admin v2 ============================== */

export interface AdminStudentListItem {
  role_id: string;
  user_id: string;
  name: string | null;
  full_name: string | null;
  cpf: string | null;
  phone: string;
  email: string | null;
  gender: string | null;
  blood_type: string | null;
  status: string;
  substatus: string | null;
  paid_at: number | null;
  pending_docs_count: number;
  has_siga: boolean;
  last_payment_status: string | null;
  partner_fee_status: string | null;
  created_at: number;
  updated_at: number;
}

export interface AdminStudentsListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  items: AdminStudentListItem[];
}

export interface AdminEnrollmentItem extends AdminStudentListItem {
  ready_for_siga: boolean;
  doc_statuses: {
    rg: string | null;
    proof_of_residence: string | null;
    education_level: string | null;
    contract_signature: string | null;
    selfie: string | null;
    school_records: string | null;
    military_certificate: string | null;
  };
  fee_1_status: string | null;
  fee_2_status: string | null;
}

export interface AdminEnrollmentsListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  items: AdminEnrollmentItem[];
}

export interface AdminStudentDetailResponse {
  success: boolean;
  student: {
    user: {
      id: string;
      phone: string;
      cpf: string | null;
      email: string | null;
      name: string | null;
      full_name: string | null;
      birth_date: string | null;
      gender: string | null;
      blood_type: string | null;
    };
    role: {
      id: string;
      role: string;
      status: string;
      substatus: string | null;
      paid_at: number | null;
      created_at: number;
      updated_at: number;
    };
    payment_attempts: Array<{
      id: string;
      provider: string;
      payment_method: string | null;
      external_id: string | null;
      amount_cents: number;
      status: string;
      paid_at: number | null;
      checkout_url: string | null;
      receipt_url: string | null;
      refund_reason: string | null;
      created_at: number;
    }>;
    documents: Array<{
      id: string;
      doc_type: string;
      status: string;
      r2_key: string | null;
      file_url: string | null;
      data_payload: Record<string, unknown>;
      ocr_confidence: number | null;
      needs_manual_review: number;
      rejection_reason: string | null;
      created_at: number;
    }>;
    siga_credentials: {
      id: string;
      student_role_id: string;
      siga_username: string;
      siga_url: string;
      registered_by: string;
      registered_at: number;
      has_password: boolean;
    } | null;
    student_exams: Array<{
      id: string;
      subject: string;
      scheduled_at: number;
      attempt_number: number;
      result: string | null;
      corrected_exam_file_key: string | null;
      corrected_exam_url: string | null;
      notes: string | null;
    }>;
    student_diplomas: {
      id: string;
      status: string;
      diploma_file_key: string | null;
      diploma_url: string | null;
      transcript_file_key: string | null;
      transcript_url: string | null;
      pickup_photo_key: string | null;
      pickup_photo_url: string | null;
      issued_at: number | null;
      picked_up_at: number | null;
    } | null;
    partner_fees: PartnerFeeRecord[];
  };
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export function getAdminStudents(
  params: { page?: number; limit?: number; status?: string; substatus?: string; search?: string } = {}
): Promise<AdminStudentsListResponse> {
  return requestAuth<AdminStudentsListResponse>(`/api/v1/admin/students${buildQuery(params)}`);
}

export function getAdminEnrollments(
  params: {
    page?: number;
    limit?: number;
    status?: string;
    substatus?: string;
    search?: string;
    ready_for_siga?: "true" | "false";
  } = {}
): Promise<AdminEnrollmentsListResponse> {
  return requestAuth<AdminEnrollmentsListResponse>(`/api/v1/admin/enrollments${buildQuery(params)}`);
}

export function getAdminStudentDetail(id: string): Promise<AdminStudentDetailResponse> {
  return requestAuth<AdminStudentDetailResponse>(`/api/v1/admin/students/${encodeURIComponent(id)}`);
}

export interface AdminPaymentsSummaryResponse {
  success: boolean;
  period: string;
  metrics: {
    total_revenue_cents: number;
    total_revenue: string;
    total_paid_count: number;
    total_pending_count: number;
    total_failed_count: number;
    total_refunded_count: number;
    total_refunded_cents: number;
    total_refunded_amount: string;
  };
}

export function getAdminPaymentsSummary(
  period: "today" | "week" | "month" | "all" = "all"
): Promise<AdminPaymentsSummaryResponse> {
  return requestAuth<AdminPaymentsSummaryResponse>(`/api/v1/admin/payments/summary?period=${period}`);
}

export interface AdminPaymentItem {
  id: string;
  user_id: string;
  role_id: string;
  student_name: string | null;
  student_cpf: string | null;
  student_phone: string | null;
  student_status: string;
  provider: string;
  payment_method: string | null;
  amount_cents: number;
  amount: string;
  status: string;
  paid_at: number | null;
  receipt_url: string | null;
  created_at: number;
}

export function getAdminPayments(
  params: { page?: number; limit?: number; status?: string; search?: string } = {}
): Promise<{ success: boolean; total: number; page: number; limit: number; total_pages: number; items: AdminPaymentItem[] }> {
  return requestAuth(`/api/v1/admin/payments${buildQuery(params)}`);
}

export function recheckAdminPayment(id: string): Promise<{
  success: boolean;
  reconciled: boolean;
  already_paid?: boolean;
  status: string;
  message: string;
}> {
  return requestAuth(`/api/v1/admin/payments/${encodeURIComponent(id)}/recheck`, {
    method: "POST",
    timeoutMs: 25_000,
  });
}

export function markAdminPaymentRefunded(
  id: string,
  body: { refund_reason: string; refund_action?: "cancel_enrollment" | "revert_to_pending" }
): Promise<{ success: boolean; status: string; message: string }> {
  return requestAuth(`/api/v1/admin/payments/${encodeURIComponent(id)}/mark-refunded`, {
    json: body,
  });
}

export interface AdminDocumentReviewDeskItem {
  id: string;
  student_role_id: string;
  student_name: string;
  student_cpf: string;
  student_phone: string;
  document_type: string;
  file_url: string | null;
  status: string;
  ai_confidence: number;
  ai_readable: boolean;
  ai_extracted_data: Record<string, unknown> | null;
  divergences: string[];
  fast_ok_eligible: boolean;
  submitted_at: number;
}

export function getAdminReviewDesk(): Promise<{
  success: boolean;
  total: number;
  documents: AdminDocumentReviewDeskItem[];
}> {
  return requestAuth("/api/v1/admin/documents/review-desk");
}

export function fastOkAdminDocument(id: string): Promise<{
  success: boolean;
  doc_id: string;
  status: string;
  message: string;
}> {
  return requestAuth(`/api/v1/admin/documents/${encodeURIComponent(id)}/fast-ok`, {
    method: "PATCH",
  });
}

export function approveAdminDocument(docId: string): Promise<{
  doc_id: string;
  status: string;
  message: string;
}> {
  return requestAuth(`/api/v1/admin/documents/${encodeURIComponent(docId)}/approve`, {
    method: "PATCH",
  });
}

export function rejectAdminDocument(
  docId: string,
  rejectionReason: string
): Promise<{ doc_id: string; status: string; rejection_reason: string }> {
  return requestAuth(`/api/v1/admin/documents/${encodeURIComponent(docId)}/reject`, {
    method: "PATCH",
    json: { rejection_reason: rejectionReason },
  });
}

export interface AdminPendingAcademicStudent {
  student_role_id: string;
  user_id: string;
  student_name: string;
  cpf: string;
  phone: string;
  gender: string | null;
  blood_type: string | null;
  current_status: string;
  submitted_at: number;
  pending_documents: Array<{
    doc_id: string;
    document_type: string;
    file_url_temporary: string;
    status: string;
    submitted_at: number;
  }>;
}

export function getAdminPendingStudentDocuments(): Promise<{
  total_students: number;
  students: AdminPendingAcademicStudent[];
}> {
  return requestAuth("/api/v1/admin/student-documents/pending");
}

export function approveAdminStudentDocument(id: string): Promise<{
  doc_id: string;
  status: string;
  student_promoted: boolean;
  message: string;
}> {
  return requestAuth(`/api/v1/admin/student-documents/${encodeURIComponent(id)}/approve`, {
    method: "PATCH",
  });
}

export function rejectAdminStudentDocument(
  id: string,
  rejectionReason: string
): Promise<{ doc_id: string; status: string; rejection_reason: string }> {
  return requestAuth(`/api/v1/admin/student-documents/${encodeURIComponent(id)}/reject`, {
    method: "PATCH",
    json: { rejection_reason: rejectionReason },
  });
}

export function registerAdminSigaCredentials(body: {
  student_role_id: string;
  siga_username: string;
  siga_password: string;
  siga_url?: string;
}): Promise<{
  id: string;
  student_role_id: string;
  siga_username: string;
  new_status: string;
  new_substatus: string;
  message: string;
}> {
  return requestAuth("/api/v1/admin/siga/credentials", {
    json: body,
  });
}

export interface PartnerFeeRecord {
  id: string;
  enrollment_id: string;
  installment_number: 1 | 2;
  kind: string;
  amount_cents: number;
  status: string;
  scheduled_for?: number | null;
  due_date?: string | null;
  paid_at?: number | null;
  receipt_url?: string | null;
  last_error?: string | null;
  asaas_transfer_id?: string | null;
  external_reference: string;
  created_at?: number;
  updated_at?: number;
}

export interface DecodedPixQrPlan {
  canBePaid: boolean;
  amount_cents: number;
  dueDate: string | null;
  scheduledFor: number | null;
  receiverName: string | null;
  receiverCpfCnpj: string | null;
  cannotBePaidReason?: string;
}

export function getAdminFeesByEnrollment(
  enrollmentId: string
): Promise<{ enrollment_id: string; fees: PartnerFeeRecord[] } | PartnerFeeRecord[]> {
  return requestAuth(`/api/v1/admin/fees/enrollments/${encodeURIComponent(enrollmentId)}`);
}

export function decodeAdminFeeQr(qrPayload: string): Promise<DecodedPixQrPlan> {
  return requestAuth<DecodedPixQrPlan>("/api/v1/admin/fees/decode-qr", {
    json: { qr_payload: qrPayload },
  });
}

export function payAdminFirstFee(
  enrollmentId: string,
  qrPayload: string
): Promise<PartnerFeeRecord> {
  return requestAuth<PartnerFeeRecord>("/api/v1/admin/fees/pay-first", {
    json: { student_role_id: enrollmentId, qr_payload: qrPayload },
    timeoutMs: 25_000,
  });
}

export function scheduleAdminSecondFee(
  enrollmentId: string,
  qrPayload: string,
  scheduleDate?: string
): Promise<PartnerFeeRecord> {
  return requestAuth<PartnerFeeRecord>("/api/v1/admin/fees/schedule-second", {
    json: {
      student_role_id: enrollmentId,
      qr_payload: qrPayload,
      ...(scheduleDate ? { schedule_date: scheduleDate } : {}),
    },
    timeoutMs: 25_000,
  });
}

export function reconcileAdminFee(feeId: string): Promise<PartnerFeeRecord> {
  return requestAuth<PartnerFeeRecord>(
    `/api/v1/admin/fees/${encodeURIComponent(feeId)}/reconcile`,
    { method: "POST", timeoutMs: 25_000 }
  );
}

export interface AdminScheduledExamItem {
  id: string;
  student_role_id: string;
  user_id: string;
  student_name: string;
  cpf: string;
  phone: string;
  subject: string;
  scheduled_at: number;
  attempt_number: number;
  result: "passed" | "failed" | null;
  corrected_exam_file_key?: string | null;
  notes: string | null;
  created_at: number;
}

export function getAdminScheduledExams(
  params: { date?: string; status?: string } = {}
): Promise<{ total: number; exams: AdminScheduledExamItem[] }> {
  return requestAuth(`/api/v1/admin/exams/scheduled${buildQuery(params)}`);
}

export function gradeAdminExam(
  id: string,
  body: { passed: boolean; notes?: string }
): Promise<{ passed: boolean; new_status: string; new_substatus: string; message: string }> {
  return requestAuth(`/api/v1/admin/exams/${encodeURIComponent(id)}/grade`, {
    json: body,
  });
}

export function uploadAdminCorrectedExamPdf(
  id: string,
  file: File
): Promise<{ success: boolean; exam_id: string; corrected_exam_file_key: string; file_url: string; message: string }> {
  return requestAuth(`/api/v1/admin/exams/${encodeURIComponent(id)}/corrected-pdf`, {
    file,
    fileField: "corrected_exam_pdf",
    timeoutMs: 60_000,
  });
}

export function getAdminStudentDiploma(id: string): Promise<{
  diploma: {
    id: string;
    student_role_id: string;
    status: string;
    diploma_file_key: string | null;
    transcript_file_key: string | null;
    pickup_photo_key: string | null;
    registration_number?: string | null;
    process_number?: string | null;
    official_gazette_date?: string | null;
    issued_at: number | null;
    picked_up_at: number | null;
  } | null;
  user: { id: string; name: string | null; full_name: string | null; cpf: string | null; phone: string };
  role: { id: string; status: string; substatus: string | null };
}> {
  return requestAuth(`/api/v1/admin/students/${encodeURIComponent(id)}/diploma`);
}

export function issueAdminDiploma(
  id: string,
  formData: FormData
): Promise<{ diploma_id: string; new_status: string; new_substatus: string; message: string }> {
  return requestAuth(`/api/v1/admin/students/${encodeURIComponent(id)}/diploma/issue`, {
    formData,
    timeoutMs: 60_000,
  });
}

export function pickupAdminDiploma(
  id: string,
  file: File
): Promise<{ diploma_id: string; new_status: string; picked_up_at: number; message: string }> {
  return requestAuth(`/api/v1/admin/students/${encodeURIComponent(id)}/diploma/pickup`, {
    file,
    fileField: "pickup_photo",
    timeoutMs: 60_000,
  });
}
