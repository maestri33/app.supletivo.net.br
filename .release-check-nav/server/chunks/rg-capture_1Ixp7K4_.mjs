globalThis.process ??= {};
globalThis.process.env ??= {};
//#region src/lib/rg-capture.ts
var SLOTS = [
	"front",
	"back",
	"full"
];
var PHOTO_FIELDS = {
	front: "front_photo",
	back: "back_photo",
	full: "full_photo"
};
function validationStatus(value) {
	return value === "pending" || value === "approved" || value === "rejected" || value === "review" ? value : null;
}
function captureSlot(value, type) {
	return value === `${type}_front` ? "front" : value === `${type}_back` ? "back" : value === `${type}_full` ? "full" : null;
}
function sectionMode(section, type) {
	const pairApproved = section?.front_photo && section.back_photo && section.photos?.[`${type}_front`]?.status === "approved" && section.photos?.[`${type}_back`]?.status === "approved";
	return section?.full_photo && !(pairApproved && section.photos?.[`${type}_full`]?.status !== "approved") ? "full" : "sides";
}
function createRgCaptureState(section = null, documentType = "rg") {
	return {
		documentType,
		section,
		receipts: {},
		revision: 0,
		sequence: -1,
		mode: sectionMode(section, documentType)
	};
}
/** Call only after the upload ACK confirms the stored media path. */
function recordRgUpload(state, slot, storedPath) {
	if (!storedPath.trim()) throw new Error("O servidor não confirmou o recebimento do RG.");
	const receipts = slot === "full" ? {} : { ...state.receipts };
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
			photos: {
				...state.section?.photos,
				[`${state.documentType}_${slot}`]: { status: "pending" }
			}
		}
	};
}
/** Stamp a GET before starting it; later uploads and newer queries invalidate it. */
function applyRgSnapshot(state, section, token) {
	if (token.revision !== state.revision || token.sequence <= state.sequence) return state;
	const merged = {
		...section,
		photos: { ...section.photos }
	};
	const receipts = {};
	for (const slot of SLOTS) {
		const path = state.receipts[slot];
		if (!path || section[PHOTO_FIELDS[slot]] === path) continue;
		receipts[slot] = path;
		merged[PHOTO_FIELDS[slot]] = path;
		merged.photos[`${state.documentType}_${slot}`] = { status: "pending" };
	}
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
		mode: state.revision === 0 ? sectionMode(section, state.documentType) : state.mode
	};
}
/** Capture completion follows saved files, independently of asynchronous OCR. */
function deriveRgCapture(state) {
	const section = state.section;
	const paths = {
		front: state.mode === "sides" ? section?.front_photo || null : null,
		back: state.mode === "sides" ? section?.back_photo || null : null,
		full: state.mode === "full" ? section?.full_photo || null : null
	};
	const received = {
		front: !!paths.front,
		back: !!paths.back,
		full: !!paths.full
	};
	const statuses = {
		front: paths.front ? validationStatus(section?.photos?.[`${state.documentType}_front`]?.status) : null,
		back: paths.back ? validationStatus(section?.photos?.[`${state.documentType}_back`]?.status) : null,
		full: paths.full ? validationStatus(section?.photos?.[`${state.documentType}_full`]?.status) : null
	};
	const verdict = validationStatus(section?.analysis_status ?? section?.validation_status);
	const reason = section?.analysis_reason || section?.validation_reason || null;
	const rejected = (state.mode === "full" ? ["full"] : ["front", "back"]).filter((slot) => statuses[slot] === "rejected");
	if (rejected.length || verdict === "rejected") {
		const expected = captureSlot(section?.next_slot, state.documentType);
		return {
			phase: "capture",
			nextSlot: rejected.length ? expected && rejected.includes(expected) ? expected : rejected[0] : state.mode === "full" ? "full" : expected ?? "full",
			received,
			paths,
			statuses,
			complete: false,
			error: reason || "Não foi possível conferir o RG. Envie uma nova foto nítida.",
			reason
		};
	}
	const complete = state.mode === "full" ? received.full : received.front && received.back;
	const nextSlot = complete ? null : !received.front ? "front" : "back";
	return {
		phase: !complete ? "capture" : verdict === "approved" ? "approved" : verdict === "review" ? "review" : "analysis",
		nextSlot,
		received,
		paths,
		statuses,
		complete,
		error: null,
		reason
	};
}
//#endregion
export { recordRgUpload as i, createRgCaptureState as n, deriveRgCapture as r, applyRgSnapshot as t };
