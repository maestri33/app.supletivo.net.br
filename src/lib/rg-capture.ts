import type { DocClassify, RgSection, ValidationStatus } from "./api";
import { documentFileError } from "./document-feedback.ts";

export type RgCaptureSlot = "front" | "back" | "full";
export type RgCapturePhase = "capture" | "analysis" | "review" | "approved";
export type RgCaptureSection = Pick<RgSection,
  | "front_photo" | "back_photo" | "full_photo" | "photos" | "next_slot"
  | "analysis_status" | "validation_status" | "analysis_reason" | "validation_reason" | "blocked"
>;
export type RgClassification = Pick<DocClassify,
  "is_document" | "doc_type" | "is_legible" | "completeness" | "error_code"
>;

export interface RgCaptureState {
  documentType: "rg" | "cnh";
  section: RgCaptureSection | null;
  receipts: Partial<Record<RgCaptureSlot, string>>;
  revision: number;
  sequence: number;
  mode: "sides" | "full";
}

export interface RgSnapshotToken {
  revision: number;
  sequence: number;
}

export interface RgCapture {
  phase: RgCapturePhase;
  nextSlot: RgCaptureSlot | null;
  received: Record<RgCaptureSlot, boolean>;
  paths: Record<RgCaptureSlot, string | null>;
  statuses: Record<RgCaptureSlot, ValidationStatus | null>;
  complete: boolean;
  error: string | null;
  reason: string | null;
}

const SLOTS: RgCaptureSlot[] = ["front", "back", "full"];
const PHOTO_FIELDS = { front: "front_photo", back: "back_photo", full: "full_photo" } as const;

/** Classification identifies the captured side; it never approves identity or OCR. */
export function resolveRgClassification(result: RgClassification): RgCaptureSlot {
  const fileError = documentFileError(result.error_code);
  if (fileError) throw new Error(fileError);
  if (result.is_document === false || result.is_legible === false) {
    throw new Error("Envie uma foto legível do RG, com as quatro bordas visíveis.");
  }
  if (result.doc_type && result.doc_type !== "rg") {
    throw new Error("Para a matrícula de aluno, envie seu RG.");
  }
  if (result.is_document !== true || result.doc_type !== "rg") {
    throw new Error("Não foi possível identificar o RG agora. Tente novamente em instantes; o arquivo não foi enviado para cadastro.");
  }
  if (result.completeness !== "front" && result.completeness !== "back" && result.completeness !== "full") {
    throw new Error("Não foi possível identificar o lado do RG. Tente outra foto com as quatro bordas visíveis.");
  }
  return result.completeness;
}

function validationStatus(value: string | null | undefined): ValidationStatus | null {
  return value === "pending" || value === "approved" || value === "rejected" || value === "review"
    ? value : null;
}

function captureSlot(value: string | null | undefined, type: RgCaptureState["documentType"]): RgCaptureSlot | null {
  return value === `${type}_front` ? "front" : value === `${type}_back` ? "back" : value === `${type}_full` ? "full" : null;
}

function sectionMode(section: RgCaptureSection | null, type: RgCaptureState["documentType"]): RgCaptureState["mode"] {
  const pairApproved = section?.front_photo && section.back_photo
    && section.photos?.[`${type}_front`]?.status === "approved" && section.photos?.[`${type}_back`]?.status === "approved";
  // Uploading a pair does not delete a previous full-file path on the backend.
  return section?.full_photo && !(pairApproved && section.photos?.[`${type}_full`]?.status !== "approved") ? "full" : "sides";
}

export function createRgCaptureState(section: RgCaptureSection | null = null, documentType: RgCaptureState["documentType"] = "rg"): RgCaptureState {
  return {
    documentType,
    section,
    receipts: {},
    revision: 0,
    sequence: -1,
    mode: sectionMode(section, documentType),
  };
}

/** Call only after the upload ACK confirms the stored media path. */
export function recordRgUpload(state: RgCaptureState, slot: RgCaptureSlot, storedPath: string): RgCaptureState {
  if (!storedPath.trim()) throw new Error("O servidor não confirmou o recebimento do RG.");
  const receipts: RgCaptureState["receipts"] = slot === "full" ? {} : { ...state.receipts };
  delete receipts.full;
  receipts[slot] = storedPath;
  return {
    ...state,
    revision: state.revision + 1,
    mode: slot === "full" ? "full" : "sides",
    receipts,
    section: {
      ...state.section,
      [PHOTO_FIELDS[slot]]: storedPath,
      analysis_status: "pending",
      validation_status: "pending",
      analysis_reason: null,
      validation_reason: null,
      blocked: false,
      photos: { ...state.section?.photos, [`${state.documentType}_${slot}`]: { status: "pending" } },
    },
  };
}

/** Stamp a GET before starting it; later uploads and newer queries invalidate it. */
export function applyRgSnapshot(state: RgCaptureState, section: RgCaptureSection, token: RgSnapshotToken): RgCaptureState {
  if (token.revision !== state.revision || token.sequence <= state.sequence) return state;
  const merged: RgCaptureSection = { ...section, photos: { ...section.photos } };
  const receipts: RgCaptureState["receipts"] = {};
  for (const slot of SLOTS) {
    const path = state.receipts[slot];
    if (!path || section[PHOTO_FIELDS[slot]] === path) continue;
    receipts[slot] = path;
    merged[PHOTO_FIELDS[slot]] = path;
    merged.photos![`${state.documentType}_${slot}`] = { status: "pending" };
  }
  // A verdict for older media cannot settle the newly acknowledged upload.
  if (Object.keys(receipts).length) {
    merged.analysis_status = "pending";
    merged.validation_status = "pending";
    merged.analysis_reason = null;
    merged.validation_reason = null;
    merged.blocked = false;
  }
  return {
    ...state,
    section: merged,
    receipts,
    sequence: token.sequence,
    mode: state.revision === 0 ? sectionMode(section, state.documentType) : state.mode,
  };
}

/** Capture completion follows saved files, independently of asynchronous OCR. */
export function deriveRgCapture(state: RgCaptureState): RgCapture {
  const section = state.section;
  const paths: RgCapture["paths"] = {
    front: state.mode === "sides" ? section?.front_photo || null : null,
    back: state.mode === "sides" ? section?.back_photo || null : null,
    full: state.mode === "full" ? section?.full_photo || null : null,
  };
  const received = { front: !!paths.front, back: !!paths.back, full: !!paths.full };
  const statuses: RgCapture["statuses"] = {
    front: paths.front ? validationStatus(section?.photos?.[`${state.documentType}_front`]?.status) : null,
    back: paths.back ? validationStatus(section?.photos?.[`${state.documentType}_back`]?.status) : null,
    full: paths.full ? validationStatus(section?.photos?.[`${state.documentType}_full`]?.status) : null,
  };
  const verdict = validationStatus(section?.analysis_status ?? section?.validation_status);
  const reason = section?.analysis_reason || section?.validation_reason || null;
  const activeSlots: RgCaptureSlot[] = state.mode === "full" ? ["full"] : ["front", "back"];
  const rejected = activeSlots.filter(slot => statuses[slot] === "rejected");
  if (rejected.length || verdict === "rejected") {
    const expected = captureSlot(section?.next_slot, state.documentType);
    const nextSlot = rejected.length
      ? expected && rejected.includes(expected) ? expected : rejected[0]
      : state.mode === "full" ? "full" : expected ?? "full";
    return {
      phase: "capture", nextSlot, received, paths, statuses, complete: false,
      error: reason || "Não foi possível conferir o RG. Envie uma nova foto nítida.",
      reason,
    };
  }
  const complete = state.mode === "full" ? received.full : received.front && received.back;
  const nextSlot = complete ? null : !received.front ? "front" : "back";
  const phase = !complete ? "capture" : verdict === "approved" ? "approved" : verdict === "review" ? "review" : "analysis";
  return { phase, nextSlot, received, paths, statuses, complete, error: null, reason };
}
