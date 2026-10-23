import { S as whoami, T as getAccessToken, c as getEnrollmentMe, p as getStudentMe, w as clearSession } from "./RootLayout_Ccnumr8N.mjs";
import * as React$1 from "react";
import { IconAlertTriangle, IconAward, IconBook, IconCamera, IconCash, IconCertificate, IconCreditCard, IconDoorExit, IconFileCheck, IconFileText, IconHeadset, IconHome, IconId, IconLink, IconLock, IconMessages, IconProgress, IconQrcode, IconSchool, IconUsers } from "@tabler/icons-react";
import { jsx } from "react/jsx-runtime";
//#region src/components/interactive/dock/useDockSync.ts
var leadCheckoutReadyGlobal = false;
function setLeadCheckoutReadyState(ready) {
	leadCheckoutReadyGlobal = ready;
	if (typeof document !== "undefined" && document.documentElement) document.documentElement.dataset.supletivoCheckoutReady = ready ? "true" : "false";
}
function getLeadCheckoutReadyState() {
	if (typeof document !== "undefined" && document.documentElement) {
		if (document.documentElement.dataset.supletivoCheckoutReady === "true") return true;
	}
	return leadCheckoutReadyGlobal;
}
function useDockSync({ initialRole = "aluno", controlledRole, currentPath = "/painel", bypassAuth = false, onLogout, controlledStudentState, controlledPromoterState, controlledPoloState }) {
	const [internalRole, setInternalRole] = React$1.useState(initialRole);
	const activeRole = controlledRole || internalRole;
	const [isLocked, setIsLocked] = React$1.useState(false);
	const [isAuthenticated, setIsAuthenticated] = React$1.useState(bypassAuth);
	const [studentState, setStudentState] = React$1.useState(() => {
		let initialStatus = null;
		if (typeof window !== "undefined") {
			if (window.location.pathname.startsWith("/student/lead")) initialStatus = "lead";
			else if (window.location.pathname.startsWith("/student/enrollment")) initialStatus = "enrollment";
		} else if (currentPath.startsWith("/student/lead")) initialStatus = "lead";
		else if (currentPath.startsWith("/student/enrollment")) initialStatus = "enrollment";
		return {
			status: initialStatus,
			pendingDocsCount: 0,
			hasPartnerUrl: false,
			leadPhase: "selection",
			isCheckoutReady: getLeadCheckoutReadyState(),
			selectedModality: null
		};
	});
	const [promoterState, setPromoterState] = React$1.useState({
		status: void 0,
		newLeadsCount: 0,
		isTrainingBlocked: false,
		pendingMaterialsCount: 0
	});
	const [poloState, setPoloState] = React$1.useState({
		pendingValidationCount: 0,
		pendingExamsCount: 0,
		readyDiplomasCount: 0
	});
	const handleLogout = React$1.useCallback(() => {
		if (onLogout) onLogout();
		else {
			clearSession();
			if (typeof window !== "undefined") window.location.assign("/");
		}
	}, [onLogout]);
	React$1.useEffect(() => {
		if (typeof window === "undefined") return;
		let isMounted = true;
		if (!bypassAuth) {
			if (!getAccessToken()) {
				setIsAuthenticated(false);
				return;
			}
		}
		setIsAuthenticated(true);
		const handleRoleChange = (e) => {
			const customEvent = e;
			if (customEvent.detail?.role) setInternalRole(customEvent.detail.role);
		};
		const handleLockChange = (e) => {
			const customEvent = e;
			if (typeof customEvent.detail?.isLocked === "boolean") setIsLocked(customEvent.detail.isLocked);
		};
		const handleStudentStateChange = (e) => {
			const customEvent = e;
			if (customEvent.detail) setStudentState((prev) => ({
				...prev,
				...customEvent.detail
			}));
		};
		const handleEnrollmentStateChange = (event) => {
			const detail = event.detail;
			if (detail?.status) setStudentState((prev) => ({
				...prev,
				enrollmentStep: detail.status
			}));
		};
		const handlePromoterStateChange = (e) => {
			const customEvent = e;
			if (customEvent.detail) setPromoterState((prev) => ({
				...prev,
				...customEvent.detail
			}));
		};
		const handlePoloStateChange = (e) => {
			const customEvent = e;
			if (customEvent.detail) setPoloState((prev) => ({
				...prev,
				...customEvent.detail
			}));
		};
		const applyIdentity = (identity) => {
			if (!isMounted) return;
			const statuses = identity.role_statuses ?? {};
			setStudentState((prev) => ({
				...prev,
				status: statuses.student ?? null
			}));
			setPromoterState((prev) => ({
				...prev,
				status: statuses.promoter,
				isCandidate: statuses.promoter === "candidate",
				isTrainingBlocked: statuses.promoter === "training"
			}));
			setPoloState((prev) => ({
				...prev,
				status: statuses.hub
			}));
		};
		const handleIdentity = (event) => {
			const identity = event.detail;
			if (identity) applyIdentity(identity);
		};
		const handleLeadPhaseChange = (e) => {
			const customEvent = e;
			if (customEvent.detail?.phase) setStudentState((prev) => ({
				...prev,
				leadPhase: customEvent.detail.phase
			}));
		};
		const handleLeadCheckoutStatus = (e) => {
			const customEvent = e;
			if (customEvent.detail) {
				setLeadCheckoutReadyState(customEvent.detail.ready);
				setStudentState((prev) => ({
					...prev,
					isCheckoutReady: customEvent.detail.ready,
					leadPhase: customEvent.detail.phase ?? prev.leadPhase,
					selectedModality: customEvent.detail.modality !== void 0 ? customEvent.detail.modality : prev.selectedModality
				}));
			}
		};
		window.addEventListener("supletivo:role-change", handleRoleChange);
		window.addEventListener("supletivo:lock-change", handleLockChange);
		window.addEventListener("supletivo:student-state", handleStudentStateChange);
		window.addEventListener("supletivo:enrollment-state", handleEnrollmentStateChange);
		window.addEventListener("supletivo:lead-wizard-phase", handleLeadPhaseChange);
		window.addEventListener("supletivo:lead-checkout-status", handleLeadCheckoutStatus);
		window.addEventListener("supletivo:promoter-state", handlePromoterStateChange);
		window.addEventListener("supletivo:polo-state", handlePoloStateChange);
		window.addEventListener("supletivo:identity", handleIdentity);
		window.dispatchEvent(new Event("supletivo:request-promoter-state"));
		const currentToken = getAccessToken();
		if (!bypassAuth && currentToken) whoami().then((w) => {
			if (!isMounted) return;
			applyIdentity(w);
			const stStatus = w.role_statuses?.student;
			if (stStatus === "enrollment" && (initialRole === "student" || initialRole === "aluno")) getEnrollmentMe().then((enrollment) => {
				if (isMounted) setStudentState((prev) => ({
					...prev,
					enrollmentStep: enrollment.status
				}));
			}).catch((err) => console.debug("[useDockSync] enrollment hydration fallback:", err));
			if (stStatus === "active" && (initialRole === "student" || initialRole === "aluno")) getStudentMe().then((s) => {
				if (!isMounted) return;
				if (s) setStudentState((prev) => ({
					...prev,
					status: "active",
					pendingDocsCount: s.pendencies?.length ?? prev.pendingDocsCount ?? 0,
					hasPartnerUrl: Boolean(s.platform?.url),
					examStatus: s.status === "exam_released" || s.status === "exam_scheduled" ? "under_review" : void 0
				}));
			}).catch((err) => {
				console.debug("[useDockSync] getStudentMe hydration fallback:", err);
			});
		}).catch((err) => {
			console.debug("[useDockSync] whoami hydration fallback:", err);
		});
		return () => {
			isMounted = false;
			window.removeEventListener("supletivo:role-change", handleRoleChange);
			window.removeEventListener("supletivo:lock-change", handleLockChange);
			window.removeEventListener("supletivo:student-state", handleStudentStateChange);
			window.removeEventListener("supletivo:enrollment-state", handleEnrollmentStateChange);
			window.removeEventListener("supletivo:lead-wizard-phase", handleLeadPhaseChange);
			window.removeEventListener("supletivo:lead-checkout-status", handleLeadCheckoutStatus);
			window.removeEventListener("supletivo:promoter-state", handlePromoterStateChange);
			window.removeEventListener("supletivo:polo-state", handlePoloStateChange);
			window.removeEventListener("supletivo:identity", handleIdentity);
		};
	}, [bypassAuth, initialRole]);
	return {
		activeRole,
		isAuthenticated,
		isLocked,
		studentState: {
			...studentState,
			...controlledStudentState
		},
		promoterState: {
			...promoterState,
			...controlledPromoterState
		},
		poloState: {
			...poloState,
			...controlledPoloState
		},
		handleLogout
	};
}
//#endregion
//#region src/components/interactive/dock/identityDockItems.tsx
function identityDockItems(options) {
	return [
		{
			id: "documents",
			title: options.documentTitle,
			icon: IconId
		},
		{
			id: "address",
			title: "Endereço",
			icon: IconHome
		},
		{
			id: "education",
			title: "Escolaridade",
			icon: IconSchool
		},
		{
			id: "selfie",
			title: "Selfie",
			icon: IconCamera
		}
	].map(({ id, title, icon: Icon }) => {
		const health = options.health[id];
		const disabled = options.enabled?.[id] === false;
		return {
			id,
			title,
			icon: /* @__PURE__ */ jsx(Icon, { className: "h-full w-full" }),
			href: options.paths[id],
			disabled,
			isActive: options.active === id,
			badge: health === "approved" ? "OK" : health === "rejected" ? "!" : health === "under_review" ? "Análise" : void 0,
			badgeVariant: health === "approved" ? "success" : health === "rejected" ? "danger" : "warning",
			statusIndicator: disabled ? "disabled" : health === "approved" ? "success" : health === "rejected" ? "danger" : health === "under_review" ? "warning" : "normal"
		};
	});
}
//#endregion
//#region src/components/interactive/dock/studentDockAdapter.tsx
function mapHealthToIndicator(health) {
	switch (health) {
		case "rejected": return "danger";
		case "under_review": return "warning";
		case "approved": return "success";
		default: return "normal";
	}
}
/**
* Adapter do Ambiente do Estudante.
* Mapeia dinamicamente os itens do dock reagindo ao status (lead, enrollment, active, veteran).
* Cada botão aponta estritamente para rota padronizada: /student/{status}/{action}
*/
function getStudentDockItems(state, ctx) {
	const { currentPath, onLogout } = ctx;
	const rawStatus = state.status || "";
	if (rawStatus === "lead" || currentPath.startsWith("/student/lead")) {
		const isCheckoutReady = Boolean(state.isCheckoutReady || getLeadCheckoutReadyState());
		const modality = state.selectedModality;
		const isMethodSelected = Boolean(modality && isCheckoutReady);
		const phase = state.leadPhase ?? (currentPath.endsWith("/checkout") ? "checkout" : "selection");
		return [
			{
				id: "payment",
				title: "Forma de pagamento",
				icon: /* @__PURE__ */ jsx(IconCreditCard, { className: "h-full w-full" }),
				href: "/student/lead/payment",
				onClick: () => {
					if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("supletivo:lead-wizard-step", { detail: { step: "selection" } }));
				},
				isActive: phase === "selection" || !isMethodSelected,
				disabled: false,
				statusIndicator: isMethodSelected ? "normal" : "warning"
			},
			{
				id: "checkout",
				title: modality === "pix" ? "Checkout PIX" : modality === "credit_card" ? "Checkout Cartão" : "Checkout",
				icon: modality === "credit_card" ? /* @__PURE__ */ jsx(IconCreditCard, { className: "h-full w-full" }) : /* @__PURE__ */ jsx(IconQrcode, { className: "h-full w-full" }),
				href: "/student/lead/checkout",
				onClick: () => {
					if (!isMethodSelected) return;
					if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("supletivo:lead-wizard-step", { detail: { step: "checkout" } }));
				},
				isActive: phase === "checkout" && isMethodSelected,
				disabled: !isMethodSelected,
				statusIndicator: !isMethodSelected ? "disabled" : "success"
			},
			{
				id: "logout",
				title: "Sair",
				icon: /* @__PURE__ */ jsx(IconDoorExit, { className: "h-full w-full text-[var(--danger)]" }),
				onClick: onLogout
			}
		];
	}
	const releaseStatus = state.enrollmentStep || rawStatus;
	const enrollmentPath = currentPath.split("#")[0];
	if ([
		"awaiting_release",
		"fee_paid",
		"fee_scheduled"
	].includes(releaseStatus) && enrollmentPath === "/student/enrollment") {
		const section = currentPath.split("#")[1] || "tracking";
		return [
			{
				id: "tracking",
				title: "Acompanhamento",
				icon: /* @__PURE__ */ jsx(IconProgress, { className: "h-full w-full" }),
				href: "/student/enrollment",
				isActive: section === "tracking",
				statusIndicator: "normal"
			},
			{
				id: "documents",
				title: "Meus documentos",
				icon: /* @__PURE__ */ jsx(IconFileText, { className: "h-full w-full" }),
				href: "/student/enrollment#documents",
				isActive: section === "documents",
				statusIndicator: "normal"
			},
			{
				id: "payment",
				title: "Pagamento",
				icon: /* @__PURE__ */ jsx(IconCreditCard, { className: "h-full w-full" }),
				href: "/student/enrollment#payment",
				isActive: section === "payment",
				statusIndicator: "normal"
			},
			{
				id: "contact",
				title: "Falar com o polo",
				icon: /* @__PURE__ */ jsx(IconMessages, { className: "h-full w-full" }),
				href: "/student/enrollment#contact",
				isActive: section === "contact",
				statusIndicator: "normal"
			}
		];
	}
	if (rawStatus === "active" || rawStatus === "exam_released" || rawStatus === "regular" || currentPath.startsWith("/student/active")) {
		const isDashboardActive = currentPath === "/student/active/dashboard" || currentPath === "/student/active" || currentPath === "/student";
		const isAccessActive = currentPath === "/student/active/access" || currentPath === "/student/active/subjects";
		const isAssessmentsActive = currentPath === "/student/active/assessments";
		const examIndicator = state.examStatus === "approved" ? "success" : state.examStatus === "under_review" || rawStatus === "exam_released" ? "warning" : "normal";
		const examBadge = state.examStatus === "approved" ? "Aprovado" : state.examStatus === "under_review" || rawStatus === "exam_released" ? "Liberada" : void 0;
		return [
			{
				id: "dashboard",
				title: "Painel",
				icon: /* @__PURE__ */ jsx(IconHome, { className: "h-full w-full" }),
				href: "/student/active/dashboard",
				isActive: isDashboardActive,
				statusIndicator: "normal"
			},
			{
				id: "documents",
				title: "Documentos",
				icon: /* @__PURE__ */ jsx(IconFileText, { className: "h-full w-full" }),
				href: "/student/active/documents",
				isActive: currentPath === "/student/active/documents",
				statusIndicator: state.pendingDocsCount ? "warning" : "normal"
			},
			{
				id: "access",
				title: "Acesso",
				icon: /* @__PURE__ */ jsx(IconBook, { className: "h-full w-full" }),
				href: "/student/active/access",
				isActive: isAccessActive,
				statusIndicator: "normal"
			},
			{
				id: "assessments",
				title: "Avaliações",
				icon: /* @__PURE__ */ jsx(IconAward, { className: "h-full w-full" }),
				href: "/student/active/assessments",
				isActive: isAssessmentsActive,
				badge: examBadge,
				badgeVariant: examIndicator === "success" ? "success" : "warning",
				statusIndicator: examIndicator
			},
			{
				id: "finance",
				title: "Financeiro",
				icon: /* @__PURE__ */ jsx(IconCreditCard, { className: "h-full w-full" }),
				href: "/student/active/finance",
				isActive: currentPath === "/student/active/finance",
				statusIndicator: "normal"
			},
			{
				id: "logout",
				title: "Sair",
				icon: /* @__PURE__ */ jsx(IconDoorExit, { className: "h-full w-full text-[var(--danger)]" }),
				onClick: onLogout
			}
		];
	}
	if (rawStatus === "veteran" || rawStatus === "graduated" || rawStatus === "awaiting_diploma_issuance" || currentPath.startsWith("/student/veteran")) return [
		{
			id: "dashboard",
			title: "Conclusão",
			icon: /* @__PURE__ */ jsx(IconAward, { className: "h-full w-full text-emerald-400" }),
			href: "/student/veteran/dashboard",
			isActive: currentPath === "/student/veteran/dashboard" || currentPath === "/student/veteran",
			statusIndicator: "success"
		},
		{
			id: "records",
			title: "Histórico",
			icon: /* @__PURE__ */ jsx(IconFileText, { className: "h-full w-full" }),
			href: "/student/veteran/records",
			isActive: currentPath === "/student/veteran/records",
			statusIndicator: "success"
		},
		{
			id: "diploma",
			title: "Diploma",
			icon: /* @__PURE__ */ jsx(IconCertificate, { className: "h-full w-full text-amber-400" }),
			href: "/student/veteran/diploma",
			isActive: currentPath === "/student/veteran/diploma",
			statusIndicator: mapHealthToIndicator(state.diplomaStatus)
		},
		{
			id: "assessments",
			title: "Prova",
			icon: /* @__PURE__ */ jsx(IconAward, { className: "h-full w-full" }),
			href: "/student/veteran/assessments",
			isActive: currentPath === "/student/veteran/assessments",
			statusIndicator: "normal"
		},
		{
			id: "finance",
			title: "Financeiro",
			icon: /* @__PURE__ */ jsx(IconCreditCard, { className: "h-full w-full" }),
			href: "/student/veteran/finance",
			isActive: currentPath === "/student/veteran/finance",
			statusIndicator: "normal"
		},
		{
			id: "logout",
			title: "Sair",
			icon: /* @__PURE__ */ jsx(IconDoorExit, { className: "h-full w-full text-[var(--danger)]" }),
			onClick: onLogout
		}
	];
	const documentPath = currentPath.split("#")[0];
	return identityDockItems({
		documentTitle: "RG",
		active: documentPath.endsWith("/address") ? "address" : documentPath.endsWith("/education") ? "education" : documentPath.endsWith("/selfie") ? "selfie" : "documents",
		paths: {
			documents: "/student/enrollment/rg",
			address: "/student/enrollment/address",
			education: "/student/enrollment/education",
			selfie: "/student/enrollment/selfie"
		},
		health: {
			documents: state.rgStatus,
			address: state.addressStatus,
			education: state.educationStatus,
			selfie: state.selfieStatus
		}
	});
}
//#endregion
//#region src/components/interactive/dock/promoterDockAdapter.tsx
/**
* Adapter do Ambiente do Promotor / Consultor Educacional.
* Adapta dinamicamente os itens do dock reagindo ao status (candidate, training, active, suspended).
* Cada botão aponta estritamente para rotas padronizadas: /promoter/{status}/{action}
*/
function getPromoterDockItems(state, ctx) {
	const { currentPath, onLogout } = ctx;
	const rawStatus = state.status || "";
	const isCandidate = state.isCandidate || currentPath.startsWith("/promoter/candidate") || [
		"candidate",
		"started",
		"profile",
		"address",
		"documents",
		"pix",
		"education",
		"selfie",
		"completed"
	].includes(rawStatus);
	const isTrainingBlocked = state.isTrainingBlocked || currentPath.startsWith("/promoter/training") || rawStatus === "training";
	const isSuspended = rawStatus === "suspended" || currentPath.startsWith("/promoter/suspended");
	if (isCandidate) {
		const next = state.registrationStep ?? "documents";
		return [...identityDockItems({
			documentTitle: "RG ou CNH",
			active: state.selectedSection === "pix" ? "education" : state.selectedSection ?? (next === "pix" ? "education" : next),
			paths: {
				documents: "#documents",
				address: "#address",
				education: "#education",
				selfie: "#selfie"
			},
			health: {
				documents: state.documentStatus,
				address: state.addressStatus,
				education: state.educationStatus,
				selfie: state.selfieStatus
			},
			enabled: {
				documents: true,
				address: state.documentReady === true,
				education: state.documentReady === true && state.addressReady === true,
				selfie: state.educationReady === true
			}
		}), {
			id: "referral",
			title: "Indicar",
			icon: /* @__PURE__ */ jsx(IconLink, { className: "h-full w-full" }),
			href: "#referral",
			isActive: state.selectedSection === "referral" || currentPath.endsWith("#referral"),
			statusIndicator: "normal"
		}];
	}
	if (isTrainingBlocked) {
		const pending = state.pendingMaterialsCount ?? 1;
		return [
			{
				id: "courses",
				title: "Capacitação",
				icon: /* @__PURE__ */ jsx(IconSchool, { className: "h-full w-full text-[var(--yellow)]" }),
				href: "/promoter/training/courses",
				badge: pending > 0 ? pending : "!",
				badgeVariant: "warning",
				isActive: currentPath === "/promoter/training/courses" || currentPath === "/promoter/training",
				statusIndicator: "warning"
			},
			{
				id: "locked",
				title: "Painel Travado",
				icon: /* @__PURE__ */ jsx(IconLock, { className: "h-full w-full opacity-50" }),
				href: "/promoter/training/locked",
				badge: "Travado",
				badgeVariant: "danger",
				isActive: currentPath === "/promoter/training/locked",
				disabled: true,
				statusIndicator: "disabled"
			},
			{
				id: "logout",
				title: "Sair",
				icon: /* @__PURE__ */ jsx(IconDoorExit, { className: "h-full w-full text-[var(--danger)]" }),
				onClick: onLogout
			}
		];
	}
	if (isSuspended) return [
		{
			id: "notice",
			title: "Suspenso",
			icon: /* @__PURE__ */ jsx(IconAlertTriangle, { className: "h-full w-full text-rose-400" }),
			href: "/promoter/suspended/notice",
			badge: "Suspenso",
			badgeVariant: "danger",
			isActive: currentPath === "/promoter/suspended/notice" || currentPath === "/promoter/suspended",
			statusIndicator: "danger"
		},
		{
			id: "support",
			title: "Suporte",
			icon: /* @__PURE__ */ jsx(IconHeadset, { className: "h-full w-full" }),
			href: "/promoter/suspended/support",
			isActive: currentPath === "/promoter/suspended/support",
			statusIndicator: "warning"
		},
		{
			id: "logout",
			title: "Sair",
			icon: /* @__PURE__ */ jsx(IconDoorExit, { className: "h-full w-full text-[var(--danger)]" }),
			onClick: onLogout
		}
	];
	const newLeads = state.newLeadsCount ?? 0;
	const isDashboardActive = currentPath === "/promoter/active/dashboard" || currentPath === "/promoter/active" || currentPath === "/promoter";
	const isLeadsActive = currentPath === "/promoter/active/leads" || currentPath.startsWith("/promoter/leads");
	const isCommissionsActive = currentPath === "/promoter/active/commissions" || currentPath.startsWith("/promoter/comissoes");
	const isDocumentsActive = currentPath === "/promoter/active/documents";
	return [
		{
			id: "dashboard",
			title: "Painel",
			icon: /* @__PURE__ */ jsx(IconHome, { className: "h-full w-full" }),
			href: "/promoter/active/dashboard",
			isActive: isDashboardActive,
			statusIndicator: "normal"
		},
		{
			id: "referral",
			title: "Indicar",
			icon: /* @__PURE__ */ jsx(IconLink, { className: "h-full w-full" }),
			href: "/promoter/active/dashboard#referral",
			isActive: currentPath.endsWith("#referral"),
			statusIndicator: "normal"
		},
		{
			id: "leads",
			title: "Leads",
			icon: /* @__PURE__ */ jsx(IconUsers, { className: "h-full w-full" }),
			href: "/promoter/active/leads",
			badge: newLeads > 0 ? newLeads : void 0,
			badgeVariant: "success",
			isActive: isLeadsActive,
			statusIndicator: "normal"
		},
		{
			id: "commissions",
			title: "Comissões",
			icon: /* @__PURE__ */ jsx(IconCash, { className: "h-full w-full text-emerald-400" }),
			href: "/promoter/active/commissions",
			isActive: isCommissionsActive,
			statusIndicator: "success"
		},
		{
			id: "documents",
			title: "Documentos",
			icon: /* @__PURE__ */ jsx(IconFileText, { className: "h-full w-full" }),
			href: "/promoter/active/documents",
			isActive: isDocumentsActive,
			statusIndicator: "normal"
		},
		{
			id: "logout",
			title: "Sair",
			icon: /* @__PURE__ */ jsx(IconDoorExit, { className: "h-full w-full text-[var(--danger)]" }),
			onClick: onLogout
		}
	];
}
//#endregion
//#region src/components/interactive/dock/poloDockAdapter.tsx
/**
* Adapter do Ambiente do Hub Regional (Coordenador de Polo).
* Gerencia conferência documental, aprovação de consultores e métricas operacionais.
* Cada botão aponta estritamente para rotas padronizadas: /hub/{status}/{action}
*/
function getPoloDockItems(state, ctx) {
	const { currentPath, onLogout } = ctx;
	const rawStatus = state.status || "active";
	const pendingReviews = state.pendingValidationCount ?? 0;
	if (rawStatus === "review" || currentPath.startsWith("/hub/review")) return [
		{
			id: "dashboard",
			title: "Painel",
			icon: /* @__PURE__ */ jsx(IconHome, { className: "h-full w-full" }),
			href: "/hub/active/dashboard",
			isActive: currentPath === "/hub/active/dashboard" || currentPath === "/hub",
			statusIndicator: "normal"
		},
		{
			id: "students",
			title: "Alunos",
			icon: /* @__PURE__ */ jsx(IconFileCheck, { className: "h-full w-full" }),
			href: "/hub/active/operations",
			badge: pendingReviews > 0 ? pendingReviews : void 0,
			badgeVariant: "warning",
			statusIndicator: pendingReviews > 0 ? "warning" : "normal",
			isActive: currentPath === "/hub/active/operations" || currentPath === "/hub/review/students" || currentPath === "/hub/review"
		},
		{
			id: "promoters",
			title: "Promotores",
			icon: /* @__PURE__ */ jsx(IconUsers, { className: "h-full w-full" }),
			href: "/hub/review/promoters",
			statusIndicator: "normal",
			isActive: currentPath === "/hub/review/promoters"
		},
		{
			id: "exams",
			title: "Provas",
			icon: /* @__PURE__ */ jsx(IconSchool, { className: "h-full w-full" }),
			href: "/hub/active/exams",
			statusIndicator: "normal",
			isActive: currentPath === "/hub/active/exams"
		},
		{
			id: "logout",
			title: "Sair",
			icon: /* @__PURE__ */ jsx(IconDoorExit, { className: "h-full w-full text-[var(--danger)]" }),
			onClick: onLogout
		}
	];
	return [
		{
			id: "dashboard",
			title: "Painel",
			icon: /* @__PURE__ */ jsx(IconHome, { className: "h-full w-full" }),
			href: "/hub/active/dashboard",
			isActive: currentPath === "/hub/active/dashboard" || currentPath === "/hub/active" || currentPath === "/hub",
			statusIndicator: "normal"
		},
		{
			id: "students",
			title: "Alunos",
			icon: /* @__PURE__ */ jsx(IconFileCheck, { className: "h-full w-full" }),
			href: "/hub/active/operations",
			badge: pendingReviews > 0 ? pendingReviews : void 0,
			badgeVariant: "warning",
			statusIndicator: pendingReviews > 0 ? "warning" : "normal",
			isActive: currentPath === "/hub/active/operations" || currentPath === "/hub/review/students" || currentPath === "/hub/review"
		},
		{
			id: "promoters",
			title: "Promotores",
			icon: /* @__PURE__ */ jsx(IconUsers, { className: "h-full w-full" }),
			href: "/hub/review/promoters",
			statusIndicator: "normal",
			isActive: currentPath === "/hub/review/promoters"
		},
		{
			id: "exams",
			title: "Provas",
			icon: /* @__PURE__ */ jsx(IconSchool, { className: "h-full w-full" }),
			href: "/hub/active/exams",
			statusIndicator: "normal",
			isActive: currentPath === "/hub/active/exams"
		},
		{
			id: "logout",
			title: "Sair",
			icon: /* @__PURE__ */ jsx(IconDoorExit, { className: "h-full w-full text-[var(--danger)]" }),
			onClick: onLogout
		}
	];
}
//#endregion
export { useDockSync as a, setLeadCheckoutReadyState as i, getPromoterDockItems as n, getStudentDockItems as r, getPoloDockItems as t };
