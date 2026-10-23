import test from "node:test";
import assert from "node:assert/strict";
import {
  applyRgSnapshot,
  createRgCaptureState,
  deriveRgCapture,
  recordRgUpload,
  resolveRgClassification,
} from "../../src/lib/rg-capture.ts";
import { currentCandidateBlocks, identityCollectionMessage, documentFileError } from "../../src/lib/document-feedback.ts";

test("candidate identity review does not expose an older address or other identity reason", () => {
  const blocks = [{ source_type: "address_proof", description: "Old address reason" }, { source_type: "rg_photo", description: "Student RG reason" }, { source_type: "cnh_photo", description: "Current CNH reason" }];
  assert.deepEqual(currentCandidateBlocks(blocks, "documents", "cnh"), [blocks[2]]);
  assert.deepEqual(currentCandidateBlocks(blocks, "address", "cnh"), [blocks[0]]);
  assert.deepEqual(currentCandidateBlocks(blocks, "review", "cnh"), blocks);
});

test("settled identity review gives a human-review instruction without ongoing OCR text", () => {
  const text = identityCollectionMessage("review");
  assert.match(text, /polo.*revisão/);
  assert.doesNotMatch(text, /Estamos conferindo/);
  assert.match(identityCollectionMessage("pending"), /Estamos conferindo/);
});

test("decoder errors take precedence over generic document recognition rejection", () => {
  for (const code of ["PDF_PASSWORD_REQUIRED", "PDF_TOO_MANY_PAGES"]) {
    assert.throws(() => resolveRgClassification({ is_document: false, doc_type: null, is_legible: false, completeness: null, error_code: code }), { message: documentFileError(code) });
  }
  assert.equal(documentFileError("AI_UNTRUSTED_CODE"), null);
});

test("a confirmed front upload asks for the back before OCR finishes", () => {
  const state = recordRgUpload(createRgCaptureState(), "front", "documents/front-new.jpg");
  const capture = deriveRgCapture(state);

  assert.equal(capture.nextSlot, "back");
  assert.equal(capture.phase, "capture");
  assert.deepEqual(capture.received, { front: true, back: false, full: false });
});

test("a query started before upload cannot erase its confirmed receipt", () => {
  const before = createRgCaptureState();
  const request = { revision: before.revision, sequence: 1 };
  const received = recordRgUpload(before, "front", "documents/front-new.jpg");
  const reconciled = applyRgSnapshot(received, {
    analysis_status: "rejected",
    next_slot: "rg_front",
    front_photo: "documents/front-old.jpg",
    photos: { rg_front: { status: "rejected" } },
  }, request);

  const capture = deriveRgCapture(reconciled);
  assert.equal(capture.paths.front, "documents/front-new.jpg");
  assert.equal(capture.nextSlot, "back");
  assert.equal(capture.error, null);
});

test("an incomplete snapshot cannot undo a confirmed back upload or approve older media", () => {
  const state = recordRgUpload(createRgCaptureState({
    front_photo: "documents/front.jpg",
    analysis_status: "pending",
    photos: { rg_front: { status: "approved" } },
  }), "back", "documents/back-new.jpg");
  const reconciled = applyRgSnapshot(state, {
    front_photo: "documents/front.jpg",
    back_photo: "documents/back-old.jpg",
    analysis_status: "approved",
    photos: { rg_front: { status: "approved" }, rg_back: { status: "approved" } },
  }, { revision: state.revision, sequence: 1 });

  const capture = deriveRgCapture(reconciled);
  assert.equal(capture.paths.back, "documents/back-new.jpg");
  assert.equal(capture.nextSlot, null);
  assert.equal(capture.phase, "analysis");
});

test("a rejected back asks only for a new back and keeps the approved front", () => {
  const state = createRgCaptureState({
    front_photo: "documents/front-approved.jpg",
    back_photo: "documents/back-rejected.jpg",
    analysis_status: "rejected",
    analysis_reason: "Envie uma nova foto nítida do RG.",
    next_slot: "rg_back",
    photos: { rg_front: { status: "approved" }, rg_back: { status: "rejected" } },
  });
  const capture = deriveRgCapture(state);

  assert.equal(capture.nextSlot, "back");
  assert.equal(capture.phase, "capture");
  assert.equal(capture.paths.front, "documents/front-approved.jpg");
  assert.equal(capture.statuses.front, "approved");
  assert.equal(capture.error, "Envie uma nova foto nítida do RG.");
});

test("classification accepts back first without inventing a front and refuses an unknown side", () => {
  assert.equal(resolveRgClassification({
    is_document: true, doc_type: "rg", is_legible: true, completeness: "back",
  }), "back");
  assert.throws(() => resolveRgClassification({
    is_document: true, doc_type: "rg", is_legible: true, completeness: null,
  }), /Não foi possível identificar/);
});

test("a confirmed back-first upload asks for the front without waiting for analysis", () => {
  const state = recordRgUpload(createRgCaptureState(), "back", "documents/back.jpg");
  const capture = deriveRgCapture(state);
  assert.equal(capture.nextSlot, "front");
  assert.deepEqual(capture.received, { front: false, back: true, full: false });
});

test("resuming a saved pending front asks for the back despite next_slot still pointing to front", () => {
  const capture = deriveRgCapture(createRgCaptureState({
    front_photo: "documents/front.jpg", analysis_status: "pending", next_slot: "rg_front", photos: {},
  }));
  assert.equal(capture.nextSlot, "back");
  assert.equal(capture.phase, "capture");
});

test("resuming a saved pending back asks for the front", () => {
  const capture = deriveRgCapture(createRgCaptureState({
    back_photo: "documents/back.jpg", analysis_status: "pending", next_slot: "rg_front", photos: {},
  }));
  assert.equal(capture.nextSlot, "front");
  assert.equal(capture.received.back, true);
});

test("a full-file ACK replaces the capture pair and never asks for a second file", () => {
  const state = recordRgUpload(createRgCaptureState({
    front_photo: "documents/old-front.jpg", analysis_status: "pending", next_slot: "rg_back",
  }), "full", "documents/complete.jpg");
  const capture = deriveRgCapture(state);
  assert.equal(capture.nextSlot, null);
  assert.equal(capture.phase, "analysis");
  assert.deepEqual(capture.received, { front: false, back: false, full: true });
  assert.equal(capture.paths.full, "documents/complete.jpg");
});

test("resuming a complete saved file ignores the backend default front slot during pending", () => {
  const capture = deriveRgCapture(createRgCaptureState({
    full_photo: "documents/complete.jpg", analysis_status: "pending", next_slot: "rg_front", photos: {},
  }));
  assert.equal(capture.nextSlot, null);
  assert.equal(capture.complete, true);
  assert.equal(capture.phase, "analysis");
});

test("a saved back awaiting its individual verdict does not become missing again", () => {
  const state = recordRgUpload(createRgCaptureState({
    front_photo: "documents/front.jpg", analysis_status: "pending",
    photos: { rg_front: { status: "approved" } },
  }), "back", "documents/back.jpg");
  const reconciled = applyRgSnapshot(state, {
    front_photo: "documents/front.jpg", back_photo: "documents/back.jpg",
    analysis_status: "pending", next_slot: "rg_back", photos: { rg_front: { status: "approved" } },
  }, { revision: state.revision, sequence: 1 });
  const capture = deriveRgCapture(reconciled);
  assert.equal(capture.nextSlot, null);
  assert.equal(capture.phase, "analysis");
  assert.equal(capture.received.back, true);
});

test("an approved newer snapshot cannot be overwritten by an older rejected query", () => {
  const initial = createRgCaptureState({ full_photo: "documents/complete.jpg", analysis_status: "pending" });
  const approved = applyRgSnapshot(initial, {
    full_photo: "documents/complete.jpg", analysis_status: "approved", photos: { rg_full: { status: "approved" } },
  }, { revision: 0, sequence: 2 });
  const outdated = applyRgSnapshot(approved, {
    full_photo: "documents/complete.jpg", analysis_status: "rejected", next_slot: "rg_full",
  }, { revision: 0, sequence: 1 });
  assert.equal(deriveRgCapture(outdated).phase, "approved");
});

test("a matching new-media snapshot can reject the face that was just uploaded", () => {
  const received = recordRgUpload(createRgCaptureState({
    back_photo: "documents/back-approved.jpg", photos: { rg_back: { status: "approved" } },
  }), "front", "documents/front-new.jpg");
  const rejected = applyRgSnapshot(received, {
    front_photo: "documents/front-new.jpg", back_photo: "documents/back-approved.jpg",
    analysis_status: "rejected", analysis_reason: "Envie novamente uma foto legível.", next_slot: "rg_front",
    photos: { rg_front: { status: "rejected" }, rg_back: { status: "approved" } },
  }, { revision: received.revision, sequence: 1 });
  const capture = deriveRgCapture(rejected);
  assert.equal(capture.nextSlot, "front");
  assert.equal(capture.statuses.back, "approved");
  assert.equal(capture.error, "Envie novamente uma foto legível.");
});

test("global rejection after both faces passed requests a complete replacement", () => {
  const capture = deriveRgCapture(createRgCaptureState({
    front_photo: "documents/front.jpg", back_photo: "documents/back.jpg", analysis_status: "rejected", next_slot: null,
    photos: { rg_front: { status: "approved" }, rg_back: { status: "approved" } },
  }));
  assert.equal(capture.nextSlot, "full");
  assert.equal(capture.complete, false);
  assert.ok(capture.error);
});

test("rejected complete media stays a full retry even with a legacy front next_slot", () => {
  const capture = deriveRgCapture(createRgCaptureState({
    full_photo: "documents/complete.jpg", analysis_status: "rejected", next_slot: "rg_front",
    photos: { rg_full: { status: "rejected", reason: "internal criterion must not be shown" } },
  }));
  assert.equal(capture.nextSlot, "full");
  assert.doesNotMatch(capture.error!, /internal criterion/);
});

test("reviewing one saved face does not postpone collecting the other", () => {
  const capture = deriveRgCapture(createRgCaptureState({
    front_photo: "documents/front.jpg", analysis_status: "review", next_slot: null,
    photos: { rg_front: { status: "review" } },
  }));
  assert.equal(capture.nextSlot, "back");
  assert.equal(capture.phase, "capture");
});

test("complete media in human review exposes only the backend public guidance", () => {
  const capture = deriveRgCapture(createRgCaptureState({
    full_photo: "documents/complete.jpg", analysis_status: "review",
    analysis_reason: "Seu documento foi para conferência da coordenação.",
  }));
  assert.equal(capture.nextSlot, null);
  assert.equal(capture.phase, "review");
  assert.equal(capture.reason, "Seu documento foi para conferência da coordenação.");
  assert.equal(capture.error, null);
});

test("classification accepts complete RG, refuses CNH and does not guess unknown document types", () => {
  assert.equal(resolveRgClassification({
    is_document: true, doc_type: "rg", is_legible: true, completeness: "full",
  }), "full");
  assert.throws(() => resolveRgClassification({
    is_document: true, doc_type: "cnh", is_legible: true, completeness: "full",
  }), /envie seu RG/);
  assert.throws(() => resolveRgClassification({
    is_document: null, doc_type: null, is_legible: null, completeness: null,
  }), /Não foi possível identificar/);
});

test("a non-document or illegible capture never resolves to an upload slot", () => {
  assert.throws(() => resolveRgClassification({
    is_document: false, doc_type: "rg", is_legible: true, completeness: "front",
  }), /foto legível/);
  assert.throws(() => resolveRgClassification({
    is_document: true, doc_type: "rg", is_legible: false, completeness: "front",
  }), /foto legível/);
});

test("resuming an approved pair does not revive an older rejected complete file", () => {
  const capture = deriveRgCapture(createRgCaptureState({
    full_photo: "documents/old-complete.jpg",
    front_photo: "documents/current-front.jpg", back_photo: "documents/current-back.jpg",
    analysis_status: "approved", next_slot: null,
    photos: { rg_full: { status: "rejected" }, rg_front: { status: "approved" }, rg_back: { status: "approved" } },
  }));
  assert.equal(capture.phase, "approved");
  assert.equal(capture.paths.full, null);
  assert.equal(capture.nextSlot, null);
});

test("promoter CNH uses the same front/back receipt and rejection behavior", () => {
  let state = recordRgUpload(createRgCaptureState(null, "cnh"), "back", "documents/cnh-back.jpg");
  assert.equal(deriveRgCapture(state).nextSlot, "front");
  state = recordRgUpload(state, "front", "documents/cnh-front.jpg");
  assert.equal(deriveRgCapture(state).nextSlot, null);
  assert.equal(deriveRgCapture(state).phase, "analysis");
  state = applyRgSnapshot(state, {
    front_photo: "documents/cnh-front.jpg", back_photo: "documents/cnh-back.jpg",
    analysis_status: "rejected", next_slot: "cnh_full",
    photos: { cnh_front: { status: "approved" }, cnh_back: { status: "approved" } },
  }, { revision: state.revision, sequence: 1 });
  assert.equal(deriveRgCapture(state).nextSlot, "full");
});

test("rejected full CNH exposes a new capture even when its visual check passed", () => {
  const capture = deriveRgCapture(createRgCaptureState({
    full_photo: "documents/cnh.pdf", analysis_status: "rejected",
    photos: { cnh_full: { status: "approved" } },
  }, "cnh"));
  assert.equal(capture.nextSlot, "full");
  assert.ok(capture.error);
});
