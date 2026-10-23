globalThis.process ??= {};
globalThis.process.env ??= {};
import { a as ensure_array_like, c as attr, i as derived, l as clsx, r as bind_props, t as attr_class, u as escape_html, x as fallback } from "./index-server_EAeTh76q.mjs";
import { _ as requestAuth, l as getErrorMessage, r as ApiError, x as whoami } from "./RootLayout_CQOsmgn0.mjs";
import { t as PromoterReferralShare } from "./PromoterReferralShare_CQoGB84k.mjs";
import { a as identityCollectionMessage, i as documentFileError, r as currentCandidateBlocks, t as addressClassificationError } from "./address-proof_Cd4GQ25D.mjs";
import { a as recordRgUpload, i as deriveRgCapture, n as applyRgSnapshot, r as createRgCaptureState, t as IdCardIcon } from "./IdCardIcon_1iTrZy32.mjs";
import { n as fetchCities, r as fetchUfs, t as EducationDeclarationModal } from "./EducationDeclarationModal_DPx1wGaB.mjs";
import { t as LiveSelfieCamera } from "./LiveSelfieCamera_BJUodGFo.mjs";
import { n as CameraIcon, t as UploadFileIcon } from "./UploadFileIcon_3gvIkuqC.mjs";
//#region src/lib/promoter-education.ts
function educationGrades(level) {
	if (level === "fundamental") return [
		1,
		2,
		3,
		4,
		5,
		6,
		7,
		8,
		9
	];
	if (level === "medio") return [
		1,
		2,
		3
	];
	return [];
}
function candidateEducationPayload(level, completed, grade, lastCompletedGrade, qualification, options = {}) {
	const shared = {
		...options,
		declaration_accepted: true
	};
	if (level === "superior") return {
		level,
		completed,
		qualification,
		education_status: completed ? "completed" : "stopped",
		...shared
	};
	const grades = educationGrades(level);
	if (!grades.includes(grade) || !completed && (!Number.isInteger(lastCompletedGrade) || lastCompletedGrade < 0 || lastCompletedGrade >= grade)) throw new Error("Confira a última série cursada e a última série concluída.");
	return {
		level,
		completed: completed && grade === grades[grades.length - 1],
		grade,
		last_completed_grade: completed ? grade : lastCompletedGrade,
		education_status: completed ? "completed" : "stopped",
		...shared
	};
}
//#endregion
//#region src/components/icons/ReferralLinkIcon.svelte
function ReferralLinkIcon($$renderer, $$props) {
	let className = fallback($$props["className"], "size-5");
	$$renderer.push(`<svg${attr_class(clsx(className))} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.07.07l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15"></path><path d="M14 11a5 5 0 0 0-7.07-.07l-2 2A5 5 0 0 0 7 20l1.15-1.15"></path></svg>`);
	bind_props($$props, { className });
}
//#endregion
//#region src/components/interactive/PromoterCandidateView.svelte
function PromoterCandidateView($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const base = "/api/v1/collaborators";
		let candidate = null;
		let documentSection = null;
		let contract = null;
		let documentType = "rg";
		let documentCapture = createRgCaptureState();
		let snapshotSequence = 0;
		let mutationRevision = 0;
		let appliedSnapshotSequence = 0;
		let captureView = derived(() => deriveRgCapture(documentCapture));
		let pixKey = "";
		let pixKeyType = "CPF";
		let educationLevel = "medio";
		let educationCompleted = "yes";
		let educationGrade = 0;
		let lastCompletedGrade = 0;
		let qualification = "graduacao";
		let educationState = "";
		let educationCity = "";
		let educationSchool = "";
		let educationYear = null;
		let educationUfs = [];
		let educationCities = [];
		let educationLocationLoading = false;
		let educationLocationError = "";
		let educationDeclarationOpen = false;
		let relationship = "mae";
		let consentAccepted = false;
		let busy = false;
		let loading = true;
		let error = null;
		let notice = null;
		let pollTimer;
		let pollDelay = 2500;
		let pollUntil = 0;
		let pollReads = 0;
		let selectedSection = "";
		async function loadEducationCities(nextState, keepCity = false) {
			educationState = nextState;
			if (!keepCity) educationCity = "";
			educationCities = [];
			educationLocationError = "";
			if (!nextState) return;
			educationLocationLoading = true;
			try {
				educationCities = await fetchCities(nextState);
			} catch {
				educationLocationError = "Não foi possível carregar as cidades agora.";
			} finally {
				educationLocationLoading = false;
			}
		}
		let documentStatus = derived(() => documentSection?.analysis_status ?? documentSection?.validation_status);
		let selfieStatus = derived(() => candidate?.selfie?.analysis_status ?? candidate?.selfie?.status);
		let documentReady = derived(() => Boolean(documentSection?.number && !documentSection?.next_slot && documentStatus() === "approved"));
		let proofReady = derived(() => candidate?.address_proof?.status === "approved" && !candidate?.address?.missing_fields?.length && [
			"street",
			"number",
			"city",
			"state",
			"zipcode"
		].every((key) => Boolean(candidate?.address?.[key])));
		let gradeOptions = derived(() => educationGrades(educationLevel));
		let step = derived(() => {
			if (!candidate) return "loading";
			if (candidate.status === "rejected") return "rejected";
			if (!documentReady()) return "documents";
			if (!proofReady()) return "address";
			if (["completed", "approved"].includes(candidate.status)) return "review";
			if (["education", "selfie"].includes(candidate.status)) return "selfie";
			if (!candidate.pix_validated && ["documents", "pix"].includes(candidate.status)) return "pix";
			if (candidate.status === "pix" && candidate.pix_validated) return "education";
			return "review";
		});
		let educationReady = derived(() => Boolean(candidate && [
			"education",
			"selfie",
			"completed",
			"approved"
		].includes(candidate.status)));
		let displayStep = derived(() => {
			if (selectedSection === "referral") return "referral";
			if (selectedSection === "documents") return "documents";
			if (selectedSection === "address" && documentReady()) return "address";
			if (selectedSection === "education" && documentReady() && proofReady()) return candidate?.pix_validated ? "education" : "pix";
			if (selectedSection === "selfie" && educationReady()) return "selfie";
			return step();
		});
		function documentPath(slot) {
			return captureView().paths[slot];
		}
		function documentPhotoStatus(slot) {
			return captureView().statuses[slot];
		}
		let documentCaptureSlot = derived(() => captureView().nextSlot);
		let currentBlocks = derived(() => currentCandidateBlocks(candidate?.blocks ?? [], step(), documentType));
		function statusLabel(status) {
			switch (status) {
				case "approved": return "Aprovado";
				case "pending": return "Em análise";
				case "review": return "Em revisão pelo polo";
				case "rejected": return "Precisa de novo envio";
				case "needs_kinship": return "Informe o vínculo com o titular";
				default: return "Aguardando envio";
			}
		}
		function scheduleRefresh() {
			clearTimeout(pollTimer);
			if (!candidate || Date.now() >= pollUntil) return;
			if ((documentSection?.front_photo || documentSection?.back_photo || documentSection?.full_photo) && documentStatus() === "pending" || candidate.address_proof?.exists && candidate.address_proof.status === "pending" || candidate.selfie?.exists && selfieStatus() === "pending" || candidate.status === "completed") pollTimer = setTimeout(() => {
				pollReads += 1;
				if (document.visibilityState === "visible" && !busy) refresh();
				else scheduleRefresh();
			}, Math.max(pollDelay, Math.min(15e3, 2500 * (1 + Math.floor(pollReads / 4)))));
		}
		function validateUploadFile(file, kind) {
			if (!file.size) return "Selecione um arquivo para enviar.";
			if (file.size > 15728640) return "O arquivo deve ter no máximo 15 MB.";
			if (!(kind === "selfie" ? [
				"image/jpeg",
				"image/png",
				"image/webp"
			] : [
				"image/jpeg",
				"image/png",
				"image/webp",
				"application/pdf"
			]).includes(file.type)) return kind === "selfie" ? "Envie uma selfie JPG, PNG ou WebP." : "Envie JPG, PNG, WebP ou PDF.";
			return null;
		}
		async function refresh() {
			const snapshotToken = {
				revision: documentCapture.revision,
				sequence: ++snapshotSequence
			};
			const mutationSnapshot = mutationRevision;
			try {
				const status = (await whoami()).role_statuses?.promoter;
				if (status === "suspended") {
					window.location.replace("/promoter/suspended/notice");
					return;
				}
				if (status === "active" || status === "training") {
					const promoter = await requestAuth(`${base}/promoter/me`);
					window.location.replace(promoter.locked ? "/promoter/training" : "/promoter/active");
					return;
				}
				const data = await requestAuth(`${base}/candidate/me`);
				let section = null;
				try {
					section = await requestAuth(`${base}/candidate/document`);
				} catch (cause) {
					if (!(cause instanceof ApiError && cause.status === 404 && !data.documents?.rg && !data.documents?.cnh)) throw cause;
				}
				if (mutationSnapshot !== mutationRevision || snapshotToken.sequence < appliedSnapshotSequence) return;
				appliedSnapshotSequence = snapshotToken.sequence;
				candidate = data;
				if (data.address_proof?.status === "pending") {
					pollDelay = Math.max(500, Math.min(data.address_proof.poll_after_ms || 2500, 3e4));
					const expiry = Date.parse(data.address_proof.expires_at ?? "");
					if (Number.isFinite(expiry)) pollUntil = expiry + 5e3;
				}
				if (section?.doc_type === "rg" || section?.doc_type === "cnh") documentType = section.doc_type;
				if (documentCapture.revision === 0 && documentCapture.documentType !== documentType) documentCapture = createRgCaptureState(null, documentType);
				const updated = section ? applyRgSnapshot(documentCapture, section, snapshotToken) : documentCapture;
				if (updated !== documentCapture || !section) documentSection = section;
				documentCapture = updated;
				if (data.profile?.education_level) educationLevel = data.profile.education_level;
				if (data.profile?.education_completed != null) educationCompleted = (data.profile.education_status ? data.profile.education_status === "completed" : data.profile.education_completed) ? "yes" : "no";
				if (data.profile?.education_qualification) qualification = data.profile.education_qualification;
				if (data.profile?.education_grade != null) educationGrade = data.profile.education_grade;
				if (data.profile?.education_last_completed_grade != null) lastCompletedGrade = data.profile.education_last_completed_grade;
				educationSchool = data.profile?.education_school ?? "";
				educationYear = data.profile?.education_year ?? null;
				if (!educationUfs.length) try {
					educationUfs = await fetchUfs();
				} catch {
					educationLocationError = "Não foi possível carregar os estados agora.";
				}
				if (data.profile?.education_state) {
					educationState = data.profile.education_state;
					educationCity = data.profile.education_city ?? "";
					await loadEducationCities(educationState, true);
				}
				if (["education", "selfie"].includes(data.status) && !contract) contract = await requestAuth(`${base}/contract/current`);
				window.dispatchEvent(new CustomEvent("supletivo:promoter-state", { detail: { status: "candidate" } }));
				error = null;
			} catch (cause) {
				error = cause instanceof Error && !(cause instanceof ApiError) ? cause.message : getErrorMessage(cause);
			} finally {
				loading = false;
				scheduleRefresh();
			}
		}
		async function mutate(path, json) {
			busy = true;
			error = null;
			notice = null;
			mutationRevision += 1;
			try {
				candidate = await requestAuth(`${base}${path}`, {
					method: "POST",
					json
				});
				selectedSection = "";
				window.history.replaceState(null, "", window.location.pathname);
				await refresh();
			} catch (cause) {
				error = cause instanceof Error && !(cause instanceof ApiError) ? cause.message : getErrorMessage(cause);
			} finally {
				busy = false;
				scheduleRefresh();
			}
		}
		async function sendUpload(file, kind) {
			if (!file || busy) return;
			if (kind === "selfie" && true) return;
			busy = true;
			error = null;
			notice = null;
			mutationRevision += 1;
			try {
				const localError = validateUploadFile(file, kind);
				if (localError) throw new Error(localError);
				let documentSlot = null;
				if (kind === "document" || kind === "address") {
					const classification = await requestAuth(`${base}/candidate/documents/classify`, {
						method: "POST",
						file,
						timeoutMs: 6e4
					});
					if (kind === "address") {
						const addressError = addressClassificationError(classification);
						if (addressError) throw new Error(addressError);
					}
					const classificationError = documentFileError(classification.error_code) || (classification.is_document === null ? "Não foi possível analisar o arquivo agora. Tente novamente em instantes." : classification.is_document !== true ? "O arquivo não parece ser um documento. Envie uma foto nítida do documento solicitado." : classification.is_legible === false ? "A imagem está ilegível. Fotografe com boa iluminação e todas as informações visíveis." : null);
					if (classificationError) throw new Error(classificationError);
					if (kind === "document" && classification.doc_type && documentSection?.doc_type && classification.doc_type !== documentType) {
						const label = classification.doc_type === "address_proof" ? "um comprovante de residência" : classification.doc_type.toUpperCase();
						throw new Error(`O arquivo parece ser ${label}, mas o tipo selecionado é ${documentType.toUpperCase()}.`);
					}
					if (kind === "address" && classification.doc_type && classification.doc_type !== "address_proof") throw new Error("Esse arquivo parece ser um documento de identidade. Envie um comprovante de residência.");
					if (kind === "document") {
						if (!["rg", "cnh"].includes(classification.doc_type ?? "") || !classification.completeness) throw new Error("Não foi possível identificar se o documento é RG ou CNH e qual lado foi enviado. Tente outra foto.");
						documentType = classification.doc_type;
						documentSlot = `${classification.doc_type}_${classification.completeness}`;
						const side = classification.completeness;
						if (side !== "full" && documentPath(side) && documentPhotoStatus(side) !== "rejected" && captureView().nextSlot !== side) throw new Error(`Esse lado já foi recebido. Envie ${side === "front" ? "o verso" : "a frente"}.`);
					}
				}
				const path = kind === "document" ? `/candidate/documents/photo/${documentSlot}` : kind === "address" ? "/candidate/documents/address-proof" : "/candidate/selfie";
				const result = await requestAuth(`${base}${path}`, {
					method: "POST",
					file,
					timeoutMs: 3e4
				});
				if ("poll_after_ms" in result) pollDelay = Math.max(500, Math.min(result.poll_after_ms || 2500, 3e4));
				if (kind === "document" && documentSlot) {
					if (!("stored" in result) || typeof result.stored !== "string" || !result.stored) throw new Error("O servidor não confirmou o recebimento do documento.");
					const side = documentSlot.split("_").pop();
					documentCapture = recordRgUpload({
						...documentCapture,
						documentType
					}, side, result.stored);
				}
				if ("status" in result) candidate = result;
				notice = "Arquivo recebido. Acompanhe a análise abaixo.";
				const expiry = "expires_at" in result && result.expires_at ? Date.parse(result.expires_at) : NaN;
				pollUntil = Number.isFinite(expiry) ? expiry : Date.now() + 3e5;
				pollReads = 0;
				await refresh();
			} catch (cause) {
				error = cause instanceof Error && !(cause instanceof ApiError) ? cause.message : getErrorMessage(cause);
			} finally {
				busy = false;
				scheduleRefresh();
			}
		}
		function updateEducationLevel() {
			educationGrade = 0;
			lastCompletedGrade = 0;
		}
		async function confirmEducationDeclaration() {
			educationDeclarationOpen = false;
			try {
				await mutate("/candidate/education", candidateEducationPayload(educationLevel, educationCompleted === "yes", educationGrade, lastCompletedGrade, qualification, {
					city: educationCity.trim() || void 0,
					state: educationState || void 0,
					school: educationSchool.trim() || void 0,
					year: educationYear
				}));
			} catch (cause) {
				error = cause instanceof Error ? cause.message : getErrorMessage(cause);
			}
		}
		$$renderer.push(`<div class="candidate-view svelte-jo32ol" data-testid="promoter-candidate"><header class="candidate-header svelte-jo32ol"><p class="eyebrow svelte-jo32ol">Credenciamento</p> <div class="candidate-heading svelte-jo32ol"><h1 class="svelte-jo32ol">Seu cadastro</h1><a class="referral-shortcut svelte-jo32ol" href="#referral" aria-label="Comece a indicar">`);
		ReferralLinkIcon($$renderer, {});
		$$renderer.push(`<!----><span class="svelte-jo32ol">Comece a indicar</span></a></div> <p class="svelte-jo32ol">Envie seus documentos. Os dados de identidade e endereço são extraídos automaticamente.</p></header> `);
		if (error) $$renderer.push(`<!--[0--><p class="feedback error svelte-jo32ol" role="alert">${escape_html(error)}</p>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (notice) $$renderer.push(`<!--[0--><p class="feedback info svelte-jo32ol" role="status">${escape_html(notice)}</p>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (loading) $$renderer.push(`<!--[0--><p role="status" class="svelte-jo32ol">Consultando seu credenciamento…</p>`);
		else if (candidate) {
			$$renderer.push("<!--[1-->");
			if (displayStep() === "referral") {
				$$renderer.push(`<!--[0--><section id="referral" class="candidate-card candidate-referral-summary svelte-jo32ol" aria-label="Indicações"><div class="svelte-jo32ol"><p class="eyebrow svelte-jo32ol">Comissões</p> <h2 class="svelte-jo32ol">Você já pode indicar</h2> <p class="svelte-jo32ol">O cadastro é gratuito. As comissões ficam acumuladas até a ativação e entram no próximo fechamento de sexta-feira às 18h.</p></div> <div class="referral-details svelte-jo32ol"><div class="referral-heading svelte-jo32ol"><span class="referral-icon svelte-jo32ol">`);
				ReferralLinkIcon($$renderer, {});
				$$renderer.push(`<!----></span> <span class="svelte-jo32ol"><strong class="svelte-jo32ol">Link de indicação</strong><small class="svelte-jo32ol">Copiar ou compartilhar</small></span></div> <div class="referral-panel svelte-jo32ol"><label for="candidate-referral" class="svelte-jo32ol">Seu link de indicação</label> <input id="candidate-referral" aria-label="Seu link de indicação" type="url"${attr("value", candidate.ref_url)} readonly="" class="svelte-jo32ol"/> `);
				PromoterReferralShare($$renderer, { url: candidate.ref_url });
				$$renderer.push(`<!----></div></div></section> <a class="refresh-action svelte-jo32ol" href="#documents">Voltar ao cadastro</a>`);
			} else {
				$$renderer.push(`<!--[-1--><section class="candidate-card svelte-jo32ol">`);
				if (displayStep() === "documents") {
					$$renderer.push(`<!--[0--><h2 class="svelte-jo32ol">Documento de identidade</h2> <p class="svelte-jo32ol">${escape_html(statusLabel(documentStatus()))}</p> `);
					if (documentSection?.analysis_reason) $$renderer.push(`<!--[0--><p class="svelte-jo32ol">${escape_html(documentSection.analysis_reason)}</p>`);
					else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> `);
					if (documentReady()) {
						$$renderer.push(`<!--[0--><p class="svelte-jo32ol">${escape_html(documentType.toUpperCase())} conferido · número ${escape_html(documentSection?.number)}</p> `);
						if (candidate.profile?.name) $$renderer.push(`<!--[0--><p class="svelte-jo32ol">${escape_html(candidate.profile.name)}</p>`);
						else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--> <a class="btn svelte-jo32ol" href="#address">Continuar para endereço</a>`);
					} else if (documentCaptureSlot()) {
						$$renderer.push(`<!--[1--><button class="capture-space svelte-jo32ol" type="button"${attr("disabled", busy, true)}>`);
						IdCardIcon($$renderer, {});
						$$renderer.push(`<!----> <strong class="svelte-jo32ol">${escape_html(busy ? "Identificando e enviando…" : documentCaptureSlot() === "back" ? "Agora, envie o verso" : documentCaptureSlot() === "front" && captureView().received.back ? "Agora, envie a frente" : "Envie seu RG ou CNH")}</strong> <span class="svelte-jo32ol">Tirar foto ou escolher arquivo</span></button> <p class="capture-hint svelte-jo32ol">Pode começar por qualquer lado. Frente e verso na mesma imagem também valem.</p> <p class="capture-hint svelte-jo32ol">JPG, PNG, WebP ou PDF · até 15 MB</p>`);
					} else $$renderer.push(`<!--[-1--><p class="svelte-jo32ol">${escape_html(identityCollectionMessage(documentStatus()))}</p>`);
					$$renderer.push(`<!--]-->`);
				} else if (displayStep() === "address") {
					$$renderer.push(`<!--[1--><h2 class="svelte-jo32ol">Comprovante de residência</h2> <p class="svelte-jo32ol">${escape_html(statusLabel(candidate.address_proof?.status))}</p> `);
					if (candidate.address_proof?.reason) $$renderer.push(`<!--[0--><p class="svelte-jo32ol">${escape_html(candidate.address_proof.reason)}</p>`);
					else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> `);
					if (proofReady()) $$renderer.push(`<!--[0--><p class="svelte-jo32ol">${escape_html(candidate.address?.street)}, ${escape_html(candidate.address?.number)}</p> <p class="svelte-jo32ol">${escape_html(candidate.address?.city)}/${escape_html(candidate.address?.state)}</p> <a class="btn svelte-jo32ol" href="#education">Continuar para escolaridade</a>`);
					else if (candidate.address_proof?.needs_kinship) {
						$$renderer.push(`<!--[1--><form class="svelte-jo32ol"><label for="candidate-relationship" class="svelte-jo32ol">Qual seu vínculo com o titular?</label> `);
						$$renderer.select({
							id: "candidate-relationship",
							value: relationship,
							disabled: busy,
							class: ""
						}, ($$renderer) => {
							$$renderer.option({
								value: "mae",
								class: ""
							}, ($$renderer) => {
								$$renderer.push(`Mãe`);
							}, "svelte-jo32ol");
							$$renderer.option({
								value: "pai",
								class: ""
							}, ($$renderer) => {
								$$renderer.push(`Pai`);
							}, "svelte-jo32ol");
							$$renderer.option({
								value: "conjuge",
								class: ""
							}, ($$renderer) => {
								$$renderer.push(`Cônjuge`);
							}, "svelte-jo32ol");
							$$renderer.option({
								value: "filho",
								class: ""
							}, ($$renderer) => {
								$$renderer.push(`Filho(a)`);
							}, "svelte-jo32ol");
							$$renderer.option({
								value: "irmao",
								class: ""
							}, ($$renderer) => {
								$$renderer.push(`Irmão(ã)`);
							}, "svelte-jo32ol");
							$$renderer.option({
								value: "outro",
								class: ""
							}, ($$renderer) => {
								$$renderer.push(`Outro vínculo`);
							}, "svelte-jo32ol");
						}, "svelte-jo32ol");
						$$renderer.push(` <button class="btn svelte-jo32ol"${attr("disabled", busy, true)} type="submit">Confirmar vínculo</button></form>`);
					} else if (!candidate.address_proof?.exists || candidate.address_proof?.status === "rejected" || candidate.address_proof?.status === "approved") {
						$$renderer.push("<!--[2-->");
						if (candidate.address_proof?.status === "approved") $$renderer.push(`<!--[0--><p class="svelte-jo32ol">O comprovante foi conferido, mas faltam dados do endereço. Envie uma imagem completa e legível para nova leitura.</p>`);
						else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--> <p class="svelte-jo32ol">Envie uma conta de luz, água, gás ou internet. A leitura do comprovante preenche seu endereço.</p> <label class="upload-action svelte-jo32ol" for="candidate-address">${escape_html(busy ? "Enviando…" : "Anexar comprovante")}</label> <input id="candidate-address" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"${attr("disabled", busy, true)} class="svelte-jo32ol"/> <label class="upload-action svelte-jo32ol" for="candidate-address-camera">Tirar foto da conta</label> <input id="candidate-address-camera" type="file" accept="image/*" capture="environment"${attr("disabled", busy, true)} class="svelte-jo32ol"/>`);
					} else $$renderer.push(`<!--[-1--><p class="svelte-jo32ol">${escape_html(candidate.address_proof?.status === "pending" ? "A leitura do comprovante está em andamento. Acompanhe o resultado nesta tela." : "O polo está revisando o comprovante enviado.")}</p>`);
					$$renderer.push(`<!--]-->`);
				} else if (displayStep() === "pix") {
					$$renderer.push(`<!--[2--><h2 class="svelte-jo32ol">Dados de recebimento de comissões</h2> <p class="svelte-jo32ol">Informe uma chave PIX em seu nome. A titularidade será conferida.</p> <form class="svelte-jo32ol"><label for="pixType" class="svelte-jo32ol">Tipo de chave</label> `);
					$$renderer.select({
						id: "pixType",
						value: pixKeyType,
						disabled: busy,
						class: ""
					}, ($$renderer) => {
						$$renderer.option({
							value: "CPF",
							class: ""
						}, ($$renderer) => {
							$$renderer.push(`CPF`);
						}, "svelte-jo32ol");
						$$renderer.option({
							value: "PHONE",
							class: ""
						}, ($$renderer) => {
							$$renderer.push(`Telefone celular`);
						}, "svelte-jo32ol");
						$$renderer.option({
							value: "EMAIL",
							class: ""
						}, ($$renderer) => {
							$$renderer.push(`E-mail`);
						}, "svelte-jo32ol");
						$$renderer.option({
							value: "EVP",
							class: ""
						}, ($$renderer) => {
							$$renderer.push(`Chave aleatória`);
						}, "svelte-jo32ol");
					}, "svelte-jo32ol");
					$$renderer.push(` <label for="pixKey" class="svelte-jo32ol">Chave PIX</label> <input id="pixKey" type="text"${attr("value", pixKey)} required=""${attr("disabled", busy, true)} autocomplete="off" class="svelte-jo32ol"/> <button class="btn svelte-jo32ol" type="submit"${attr("disabled", busy || !pixKey.trim(), true)}>${escape_html(busy ? "Salvando…" : "Salvar e Continuar")}</button></form>`);
				} else if (displayStep() === "education") {
					$$renderer.push(`<!--[3--><h2 class="svelte-jo32ol">Sua escolaridade</h2> `);
					if (educationReady()) $$renderer.push(`<!--[0--><p class="svelte-jo32ol">Escolaridade registrada: ${escape_html(educationLevel === "superior" ? "Ensino Superior" : educationLevel === "medio" ? "Ensino Médio" : "Ensino Fundamental")}.</p> <a class="btn svelte-jo32ol" href="#selfie">Continuar para assinatura</a>`);
					else {
						$$renderer.push(`<!--[-1--><form class="svelte-jo32ol"><label for="candidate-education" class="svelte-jo32ol">Qual o seu nível de ensino?</label> `);
						$$renderer.select({
							id: "candidate-education",
							value: educationLevel,
							onchange: updateEducationLevel,
							disabled: busy,
							class: ""
						}, ($$renderer) => {
							$$renderer.option({
								value: "fundamental",
								class: ""
							}, ($$renderer) => {
								$$renderer.push(`Ensino Fundamental`);
							}, "svelte-jo32ol");
							$$renderer.option({
								value: "medio",
								class: ""
							}, ($$renderer) => {
								$$renderer.push(`Ensino Médio`);
							}, "svelte-jo32ol");
							$$renderer.option({
								value: "superior",
								class: ""
							}, ($$renderer) => {
								$$renderer.push(`Ensino Superior`);
							}, "svelte-jo32ol");
						}, "svelte-jo32ol");
						$$renderer.push(` `);
						if (educationLevel === "superior") {
							$$renderer.push(`<!--[0--><label for="candidate-qualification" class="svelte-jo32ol">Formação</label> `);
							$$renderer.select({
								id: "candidate-qualification",
								value: qualification,
								disabled: busy,
								class: ""
							}, ($$renderer) => {
								$$renderer.option({
									value: "graduacao",
									class: ""
								}, ($$renderer) => {
									$$renderer.push(`Graduação`);
								}, "svelte-jo32ol");
								$$renderer.option({
									value: "pos_graduacao",
									class: ""
								}, ($$renderer) => {
									$$renderer.push(`Pós-graduação`);
								}, "svelte-jo32ol");
								$$renderer.option({
									value: "mestrado",
									class: ""
								}, ($$renderer) => {
									$$renderer.push(`Mestrado`);
								}, "svelte-jo32ol");
								$$renderer.option({
									value: "doutorado",
									class: ""
								}, ($$renderer) => {
									$$renderer.push(`Doutorado`);
								}, "svelte-jo32ol");
							}, "svelte-jo32ol");
						} else {
							$$renderer.push(`<!--[-1--><label for="candidate-grade" class="svelte-jo32ol">Qual foi a última série ou ano cursado?</label> `);
							$$renderer.select({
								id: "candidate-grade",
								value: educationGrade,
								onchange: () => {
									lastCompletedGrade = Math.max(0, Math.min(lastCompletedGrade, educationGrade - 1));
								},
								disabled: busy,
								required: true,
								class: ""
							}, ($$renderer) => {
								$$renderer.option({
									value: 0,
									disabled: true,
									class: ""
								}, ($$renderer) => {
									$$renderer.push(`Selecione a última série cursada`);
								}, "svelte-jo32ol");
								$$renderer.push(`<!--[-->`);
								const each_array = ensure_array_like(gradeOptions());
								for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
									let grade = each_array[$$index];
									$$renderer.option({
										value: grade,
										class: ""
									}, ($$renderer) => {
										$$renderer.push(`${escape_html(grade)}º ano / série`);
									}, "svelte-jo32ol");
								}
								$$renderer.push(`<!--]-->`);
							}, "svelte-jo32ol");
						}
						$$renderer.push(`<!--]--> <label for="candidate-education-state" class="svelte-jo32ol">Estado onde estudou (opcional)</label> `);
						$$renderer.select({
							id: "candidate-education-state",
							value: educationState,
							onchange: (event) => void loadEducationCities(event.currentTarget.value),
							disabled: busy || !educationUfs.length,
							class: ""
						}, ($$renderer) => {
							$$renderer.option({
								value: "",
								class: ""
							}, ($$renderer) => {
								$$renderer.push(`Selecione o estado`);
							}, "svelte-jo32ol");
							$$renderer.push(`<!--[-->`);
							const each_array_1 = ensure_array_like(educationUfs);
							for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
								let uf = each_array_1[$$index_1];
								$$renderer.option({
									value: uf.sigla,
									class: ""
								}, ($$renderer) => {
									$$renderer.push(`${escape_html(uf.nome)} (${escape_html(uf.sigla)})`);
								}, "svelte-jo32ol");
							}
							$$renderer.push(`<!--]-->`);
						}, "svelte-jo32ol");
						$$renderer.push(` <label for="candidate-education-city" class="svelte-jo32ol">Cidade onde estudou (opcional)</label> <input id="candidate-education-city" list="candidate-education-cities"${attr("value", educationCity)}${attr("disabled", busy || !educationState || educationLocationLoading, true)}${attr("placeholder", educationLocationLoading ? "Carregando cidades…" : "Digite para buscar")} class="svelte-jo32ol"/> <datalist id="candidate-education-cities" class="svelte-jo32ol"><!--[-->`);
						const each_array_2 = ensure_array_like(educationCities);
						for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
							let municipality = each_array_2[$$index_2];
							$$renderer.option({
								value: municipality,
								class: ""
							}, ($$renderer) => {}, "svelte-jo32ol");
						}
						$$renderer.push(`<!--]--></datalist> `);
						if (educationLocationError) $$renderer.push(`<!--[0--><p class="feedback error svelte-jo32ol" role="alert">${escape_html(educationLocationError)}</p>`);
						else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--> <label for="candidate-education-year" class="svelte-jo32ol">Ano da última frequência (opcional)</label> <input id="candidate-education-year" type="number" min="1950" max="2100"${attr("value", educationYear)}${attr("disabled", busy, true)} class="svelte-jo32ol"/> <label for="candidate-education-school" class="svelte-jo32ol">Última escola (opcional)</label> <input id="candidate-education-school"${attr("value", educationSchool)} maxlength="200"${attr("disabled", busy, true)} class="svelte-jo32ol"/> <label for="candidate-completed" class="svelte-jo32ol">${escape_html(educationLevel === "superior" ? "Você concluiu essa formação?" : "Você concluiu essa série ou ano?")}</label> `);
						$$renderer.select({
							id: "candidate-completed",
							value: educationCompleted,
							disabled: busy,
							class: ""
						}, ($$renderer) => {
							$$renderer.option({
								value: "yes",
								class: ""
							}, ($$renderer) => {
								$$renderer.push(`Sim`);
							}, "svelte-jo32ol");
							$$renderer.option({
								value: "no",
								class: ""
							}, ($$renderer) => {
								$$renderer.push(`Não`);
							}, "svelte-jo32ol");
						}, "svelte-jo32ol");
						$$renderer.push(` `);
						if (educationLevel !== "superior" && educationCompleted === "no") {
							$$renderer.push(`<!--[0--><label for="candidate-last-completed" class="svelte-jo32ol">Qual foi a última série concluída?</label> `);
							$$renderer.select({
								id: "candidate-last-completed",
								value: lastCompletedGrade,
								disabled: busy,
								class: ""
							}, ($$renderer) => {
								$$renderer.option({
									value: 0,
									class: ""
								}, ($$renderer) => {
									$$renderer.push(`Nenhuma série concluída neste nível`);
								}, "svelte-jo32ol");
								$$renderer.push(`<!--[-->`);
								const each_array_3 = ensure_array_like(gradeOptions().filter((grade) => grade < educationGrade));
								for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
									let grade = each_array_3[$$index_3];
									$$renderer.option({
										value: grade,
										class: ""
									}, ($$renderer) => {
										$$renderer.push(`${escape_html(grade)}º ano / série`);
									}, "svelte-jo32ol");
								}
								$$renderer.push(`<!--]-->`);
							}, "svelte-jo32ol");
						} else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--> <button class="btn svelte-jo32ol" type="submit"${attr("disabled", busy || educationLevel !== "superior" && !gradeOptions().includes(educationGrade), true)}>Continuar para assinatura</button></form>`);
					}
					$$renderer.push(`<!--]-->`);
				} else if (displayStep() === "selfie") {
					$$renderer.push(`<!--[4--><h2 class="svelte-jo32ol">Termo de adesão e selfie</h2> <p class="svelte-jo32ol">${escape_html(statusLabel(selfieStatus()))}</p> `);
					if (selfieStatus() === "review") $$renderer.push(`<!--[0--><p class="svelte-jo32ol">Sua selfie foi recebida e precisa de conferência do polo. Você não precisa enviar outra foto agora.</p>`);
					else if (candidate.selfie?.analysis_reason) $$renderer.push(`<!--[1--><p class="svelte-jo32ol">${escape_html(candidate.selfie.analysis_reason)}</p>`);
					else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> `);
					if (!candidate.selfie?.exists || selfieStatus() === "rejected") {
						$$renderer.push("<!--[0-->");
						if (contract) {
							$$renderer.push(`<!--[0--><div class="contract-text svelte-jo32ol" tabindex="0" aria-label="Termo de adesão vigente">${escape_html(contract.text)}</div> <p class="svelte-jo32ol">Versão ${escape_html(contract.version)}</p> <label class="consent svelte-jo32ol"><input type="checkbox"${attr("checked", consentAccepted, true)}${attr("disabled", busy, true)} class="svelte-jo32ol"/> Li e aceito o termo. O envio da selfie registra minha assinatura.</label> `);
							LiveSelfieCamera($$renderer, {
								disabled: busy || true,
								onCapture: (file) => sendUpload(file, "selfie")
							});
							$$renderer.push(`<!---->`);
						} else $$renderer.push(`<!--[-1--><p class="svelte-jo32ol">Não foi possível carregar o termo vigente. Atualize o status para tentar novamente.</p>`);
						$$renderer.push(`<!--]-->`);
					} else $$renderer.push(`<!--[-1--><p class="svelte-jo32ol">Acompanhe a conferência da sua assinatura. Seu cadastro será ativado quando os requisitos forem aprovados.</p>`);
					$$renderer.push(`<!--]-->`);
				} else if (displayStep() === "rejected") $$renderer.push(`<!--[5--><h2 class="svelte-jo32ol">Credenciamento precisa de revisão</h2><p class="svelte-jo32ol">Consulte as orientações do polo sobre sua candidatura.</p>`);
				else $$renderer.push(`<!--[-1--><h2 class="svelte-jo32ol">Credenciamento em análise</h2><p class="svelte-jo32ol">A documentação e sua assinatura estão sendo conferidas. Esta tela acompanha a liberação pelo polo.</p>`);
				$$renderer.push(`<!--]--></section>`);
			}
			$$renderer.push(`<!--]--> <!--[-->`);
			const each_array_4 = ensure_array_like(currentBlocks());
			for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
				let block = each_array_4[$$index_4];
				if (block.reason || block.description) {
					$$renderer.push(`<!--[0--><p class="feedback warning svelte-jo32ol">`);
					if (block.title) $$renderer.push(`<!--[0--><strong class="svelte-jo32ol">${escape_html(block.title)}</strong>`);
					else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]-->${escape_html(block.reason ?? block.description)}</p>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]-->`);
			}
			$$renderer.push(`<!--]-->`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <button class="refresh-action svelte-jo32ol" type="button"${attr("disabled", busy || loading, true)}>Atualizar status</button></div> `);
		if (candidate && !loading) $$renderer.push(`<!--[0--><input id="candidate-document" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" hidden=""${attr("disabled", busy, true)} aria-label="Selecionar arquivo do RG ou CNH" class="svelte-jo32ol"/> <input id="candidate-document-camera" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden=""${attr("disabled", busy, true)} aria-label="Fotografar RG ou CNH" class="svelte-jo32ol"/>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <dialog class="source-dialog svelte-jo32ol" aria-labelledby="candidate-source-title"><h2 id="candidate-source-title" class="svelte-jo32ol">Como quer enviar o documento?</h2><p class="svelte-jo32ol">Uma foto, uma imagem com os dois lados ou um PDF.</p> <button type="button" class="btn source-action svelte-jo32ol">`);
		CameraIcon($$renderer, {});
		$$renderer.push(`<!----> Tirar foto</button> <button type="button" class="refresh-action source-action svelte-jo32ol">`);
		UploadFileIcon($$renderer, {});
		$$renderer.push(`<!----> Escolher arquivo</button> <button type="button" class="refresh-action svelte-jo32ol">Cancelar</button></dialog> `);
		EducationDeclarationModal($$renderer, {
			role: "promoter",
			open: educationDeclarationOpen,
			onConfirm: confirmEducationDeclaration
		});
		$$renderer.push(`<!---->`);
	});
}
//#endregion
export { PromoterCandidateView as t };
