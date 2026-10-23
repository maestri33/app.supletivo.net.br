globalThis.process ??= {};
globalThis.process.env ??= {};
import { r as __toESM, t as __commonJSMin } from "./rolldown-runtime_BDykq6kg.mjs";
import { t as require_react } from "./react_Cl8Wt3-t.mjs";
import { S as whoami, T as getAccessToken, c as getEnrollmentMe, p as getStudentMe, w as clearSession } from "./RootLayout_BZofGHHY.mjs";
//#region src/components/interactive/dock/useDockSync.ts
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
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
	const [internalRole, setInternalRole] = import_react.useState(initialRole);
	const activeRole = controlledRole || internalRole;
	const [isLocked, setIsLocked] = import_react.useState(false);
	const [isAuthenticated, setIsAuthenticated] = import_react.useState(bypassAuth);
	const [studentState, setStudentState] = import_react.useState(() => {
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
	const [promoterState, setPromoterState] = import_react.useState({
		status: void 0,
		newLeadsCount: 0,
		isTrainingBlocked: false,
		pendingMaterialsCount: 0
	});
	const [poloState, setPoloState] = import_react.useState({
		pendingValidationCount: 0,
		pendingExamsCount: 0,
		readyDiplomasCount: 0
	});
	const handleLogout = import_react.useCallback(() => {
		if (onLogout) onLogout();
		else {
			clearSession();
			if (typeof window !== "undefined") window.location.assign("/");
		}
	}, [onLogout]);
	import_react.useEffect(() => {
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
//#region node_modules/.pnpm/@tabler+icons-react@3.46.0_react@19.2.4/node_modules/@tabler/icons-react/dist/esm/defaultAttributes.mjs
/**
* @license @tabler/icons-react v3.46.0 - MIT
*
* This source code is licensed under the MIT license.
* See the LICENSE file in the root directory of this source tree.
*/
var defaultAttributes = {
	outline: {
		xmlns: "http://www.w3.org/2000/svg",
		width: 24,
		height: 24,
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 2,
		strokeLinecap: "round",
		strokeLinejoin: "round"
	},
	filled: {
		xmlns: "http://www.w3.org/2000/svg",
		width: 24,
		height: 24,
		viewBox: "0 0 24 24",
		fill: "currentColor",
		stroke: "none"
	}
};
//#endregion
//#region node_modules/.pnpm/@tabler+icons-react@3.46.0_react@19.2.4/node_modules/@tabler/icons-react/dist/esm/createReactComponent.mjs
/**
* @license @tabler/icons-react v3.46.0 - MIT
*
* This source code is licensed under the MIT license.
* See the LICENSE file in the root directory of this source tree.
*/
var createReactComponent = (type, iconName, iconNamePascal, iconNode) => {
	const Component = (0, import_react.forwardRef)(({ color = "currentColor", size = 24, stroke = 2, title, className, children, ...rest }, ref) => (0, import_react.createElement)("svg", {
		ref,
		...defaultAttributes[type],
		width: size,
		height: size,
		className: [
			`tabler-icon`,
			`tabler-icon-${iconName}`,
			className
		].join(" "),
		...type === "filled" ? { fill: color } : {
			strokeWidth: stroke,
			stroke: color
		},
		...rest
	}, [
		title && (0, import_react.createElement)("title", { key: "svg-title" }, title),
		...iconNode.map(([tag, attrs]) => (0, import_react.createElement)(tag, attrs)),
		...Array.isArray(children) ? children : [children]
	]));
	Component.displayName = `${iconNamePascal}`;
	return Component;
};
/**
* @license @tabler/icons-react v3.46.0 - MIT
*
* This source code is licensed under the MIT license.
* See the LICENSE file in the root directory of this source tree.
*/
var IconAlertTriangle = createReactComponent("outline", "alert-triangle", "AlertTriangle", [
	["path", {
		"d": "M12 9v4",
		"key": "svg-0"
	}],
	["path", {
		"d": "M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0",
		"key": "svg-1"
	}],
	["path", {
		"d": "M12 16h.01",
		"key": "svg-2"
	}]
]);
/**
* @license @tabler/icons-react v3.46.0 - MIT
*
* This source code is licensed under the MIT license.
* See the LICENSE file in the root directory of this source tree.
*/
var IconAward = createReactComponent("outline", "award", "Award", [
	["path", {
		"d": "M6 9a6 6 0 1 0 12 0a6 6 0 1 0 -12 0",
		"key": "svg-0"
	}],
	["path", {
		"d": "M12 15l3.4 5.89l1.598 -3.233l3.598 .232l-3.4 -5.889",
		"key": "svg-1"
	}],
	["path", {
		"d": "M6.802 12l-3.4 5.89l3.598 -.233l1.598 3.232l3.4 -5.889",
		"key": "svg-2"
	}]
]);
/**
* @license @tabler/icons-react v3.46.0 - MIT
*
* This source code is licensed under the MIT license.
* See the LICENSE file in the root directory of this source tree.
*/
var IconBook = createReactComponent("outline", "book", "Book", [
	["path", {
		"d": "M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0",
		"key": "svg-0"
	}],
	["path", {
		"d": "M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0",
		"key": "svg-1"
	}],
	["path", {
		"d": "M3 6l0 13",
		"key": "svg-2"
	}],
	["path", {
		"d": "M12 6l0 13",
		"key": "svg-3"
	}],
	["path", {
		"d": "M21 6l0 13",
		"key": "svg-4"
	}]
]);
/**
* @license @tabler/icons-react v3.46.0 - MIT
*
* This source code is licensed under the MIT license.
* See the LICENSE file in the root directory of this source tree.
*/
var IconCamera = createReactComponent("outline", "camera", "Camera", [["path", {
	"d": "M5 7h1a2 2 0 0 0 2 -2a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2",
	"key": "svg-0"
}], ["path", {
	"d": "M9 13a3 3 0 1 0 6 0a3 3 0 0 0 -6 0",
	"key": "svg-1"
}]]);
/**
* @license @tabler/icons-react v3.46.0 - MIT
*
* This source code is licensed under the MIT license.
* See the LICENSE file in the root directory of this source tree.
*/
var IconCash = createReactComponent("outline", "cash", "Cash", [
	["path", {
		"d": "M7 15h-3a1 1 0 0 1 -1 -1v-8a1 1 0 0 1 1 -1h12a1 1 0 0 1 1 1v3",
		"key": "svg-0"
	}],
	["path", {
		"d": "M7 10a1 1 0 0 1 1 -1h12a1 1 0 0 1 1 1v8a1 1 0 0 1 -1 1h-12a1 1 0 0 1 -1 -1l0 -8",
		"key": "svg-1"
	}],
	["path", {
		"d": "M12 14a2 2 0 1 0 4 0a2 2 0 0 0 -4 0",
		"key": "svg-2"
	}]
]);
/**
* @license @tabler/icons-react v3.46.0 - MIT
*
* This source code is licensed under the MIT license.
* See the LICENSE file in the root directory of this source tree.
*/
var IconCertificate = createReactComponent("outline", "certificate", "Certificate", [
	["path", {
		"d": "M12 15a3 3 0 1 0 6 0a3 3 0 1 0 -6 0",
		"key": "svg-0"
	}],
	["path", {
		"d": "M13 17.5v4.5l2 -1.5l2 1.5v-4.5",
		"key": "svg-1"
	}],
	["path", {
		"d": "M10 19h-5a2 2 0 0 1 -2 -2v-10c0 -1.1 .9 -2 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -1 1.73",
		"key": "svg-2"
	}],
	["path", {
		"d": "M6 9l12 0",
		"key": "svg-3"
	}],
	["path", {
		"d": "M6 12l3 0",
		"key": "svg-4"
	}],
	["path", {
		"d": "M6 15l2 0",
		"key": "svg-5"
	}]
]);
/**
* @license @tabler/icons-react v3.46.0 - MIT
*
* This source code is licensed under the MIT license.
* See the LICENSE file in the root directory of this source tree.
*/
var IconCreditCard = createReactComponent("outline", "credit-card", "CreditCard", [
	["path", {
		"d": "M3 8a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3l0 -8",
		"key": "svg-0"
	}],
	["path", {
		"d": "M3 10l18 0",
		"key": "svg-1"
	}],
	["path", {
		"d": "M7 15l.01 0",
		"key": "svg-2"
	}],
	["path", {
		"d": "M11 15l2 0",
		"key": "svg-3"
	}]
]);
/**
* @license @tabler/icons-react v3.46.0 - MIT
*
* This source code is licensed under the MIT license.
* See the LICENSE file in the root directory of this source tree.
*/
var IconDoorExit = createReactComponent("outline", "door-exit", "DoorExit", [
	["path", {
		"d": "M13 12v.01",
		"key": "svg-0"
	}],
	["path", {
		"d": "M3 21h18",
		"key": "svg-1"
	}],
	["path", {
		"d": "M5 21v-16a2 2 0 0 1 2 -2h7.5m2.5 10.5v7.5",
		"key": "svg-2"
	}],
	["path", {
		"d": "M14 7h7m-3 -3l3 3l-3 3",
		"key": "svg-3"
	}]
]);
/**
* @license @tabler/icons-react v3.46.0 - MIT
*
* This source code is licensed under the MIT license.
* See the LICENSE file in the root directory of this source tree.
*/
var IconFileCheck = createReactComponent("outline", "file-check", "FileCheck", [
	["path", {
		"d": "M14 3v4a1 1 0 0 0 1 1h4",
		"key": "svg-0"
	}],
	["path", {
		"d": "M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2",
		"key": "svg-1"
	}],
	["path", {
		"d": "M9 15l2 2l4 -4",
		"key": "svg-2"
	}]
]);
/**
* @license @tabler/icons-react v3.46.0 - MIT
*
* This source code is licensed under the MIT license.
* See the LICENSE file in the root directory of this source tree.
*/
var IconFileText = createReactComponent("outline", "file-text", "FileText", [
	["path", {
		"d": "M14 3v4a1 1 0 0 0 1 1h4",
		"key": "svg-0"
	}],
	["path", {
		"d": "M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2",
		"key": "svg-1"
	}],
	["path", {
		"d": "M9 9l1 0",
		"key": "svg-2"
	}],
	["path", {
		"d": "M9 13l6 0",
		"key": "svg-3"
	}],
	["path", {
		"d": "M9 17l6 0",
		"key": "svg-4"
	}]
]);
/**
* @license @tabler/icons-react v3.46.0 - MIT
*
* This source code is licensed under the MIT license.
* See the LICENSE file in the root directory of this source tree.
*/
var IconHeadset = createReactComponent("outline", "headset", "Headset", [
	["path", {
		"d": "M4 14v-3a8 8 0 1 1 16 0v3",
		"key": "svg-0"
	}],
	["path", {
		"d": "M18 19c0 1.657 -2.686 3 -6 3",
		"key": "svg-1"
	}],
	["path", {
		"d": "M4 14a2 2 0 0 1 2 -2h1a2 2 0 0 1 2 2v3a2 2 0 0 1 -2 2h-1a2 2 0 0 1 -2 -2v-3",
		"key": "svg-2"
	}],
	["path", {
		"d": "M15 14a2 2 0 0 1 2 -2h1a2 2 0 0 1 2 2v3a2 2 0 0 1 -2 2h-1a2 2 0 0 1 -2 -2v-3",
		"key": "svg-3"
	}]
]);
/**
* @license @tabler/icons-react v3.46.0 - MIT
*
* This source code is licensed under the MIT license.
* See the LICENSE file in the root directory of this source tree.
*/
var IconHome = createReactComponent("outline", "home", "Home", [
	["path", {
		"d": "M5 12l-2 0l9 -9l9 9l-2 0",
		"key": "svg-0"
	}],
	["path", {
		"d": "M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7",
		"key": "svg-1"
	}],
	["path", {
		"d": "M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6",
		"key": "svg-2"
	}]
]);
/**
* @license @tabler/icons-react v3.46.0 - MIT
*
* This source code is licensed under the MIT license.
* See the LICENSE file in the root directory of this source tree.
*/
var IconId = createReactComponent("outline", "id", "Id", [
	["path", {
		"d": "M3 7a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v10a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3l0 -10",
		"key": "svg-0"
	}],
	["path", {
		"d": "M7 10a2 2 0 1 0 4 0a2 2 0 1 0 -4 0",
		"key": "svg-1"
	}],
	["path", {
		"d": "M15 8l2 0",
		"key": "svg-2"
	}],
	["path", {
		"d": "M15 12l2 0",
		"key": "svg-3"
	}],
	["path", {
		"d": "M7 16l10 0",
		"key": "svg-4"
	}]
]);
/**
* @license @tabler/icons-react v3.46.0 - MIT
*
* This source code is licensed under the MIT license.
* See the LICENSE file in the root directory of this source tree.
*/
var IconLink = createReactComponent("outline", "link", "Link", [
	["path", {
		"d": "M9 15l6 -6",
		"key": "svg-0"
	}],
	["path", {
		"d": "M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464",
		"key": "svg-1"
	}],
	["path", {
		"d": "M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463",
		"key": "svg-2"
	}]
]);
/**
* @license @tabler/icons-react v3.46.0 - MIT
*
* This source code is licensed under the MIT license.
* See the LICENSE file in the root directory of this source tree.
*/
var IconLock = createReactComponent("outline", "lock", "Lock", [
	["path", {
		"d": "M5 13a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-6",
		"key": "svg-0"
	}],
	["path", {
		"d": "M11 16a1 1 0 1 0 2 0a1 1 0 0 0 -2 0",
		"key": "svg-1"
	}],
	["path", {
		"d": "M8 11v-4a4 4 0 1 1 8 0v4",
		"key": "svg-2"
	}]
]);
/**
* @license @tabler/icons-react v3.46.0 - MIT
*
* This source code is licensed under the MIT license.
* See the LICENSE file in the root directory of this source tree.
*/
var IconMessages = createReactComponent("outline", "messages", "Messages", [["path", {
	"d": "M21 14l-3 -3h-7a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1h9a1 1 0 0 1 1 1v10",
	"key": "svg-0"
}], ["path", {
	"d": "M14 15v2a1 1 0 0 1 -1 1h-7l-3 3v-10a1 1 0 0 1 1 -1h2",
	"key": "svg-1"
}]]);
/**
* @license @tabler/icons-react v3.46.0 - MIT
*
* This source code is licensed under the MIT license.
* See the LICENSE file in the root directory of this source tree.
*/
var IconProgress = createReactComponent("outline", "progress", "Progress", [
	["path", {
		"d": "M10 20.777a8.942 8.942 0 0 1 -2.48 -.969",
		"key": "svg-0"
	}],
	["path", {
		"d": "M14 3.223a9.003 9.003 0 0 1 0 17.554",
		"key": "svg-1"
	}],
	["path", {
		"d": "M4.579 17.093a8.961 8.961 0 0 1 -1.227 -2.592",
		"key": "svg-2"
	}],
	["path", {
		"d": "M3.124 10.5c.16 -.95 .468 -1.85 .9 -2.675l.169 -.305",
		"key": "svg-3"
	}],
	["path", {
		"d": "M6.907 4.579a8.954 8.954 0 0 1 3.093 -1.356",
		"key": "svg-4"
	}]
]);
/**
* @license @tabler/icons-react v3.46.0 - MIT
*
* This source code is licensed under the MIT license.
* See the LICENSE file in the root directory of this source tree.
*/
var IconQrcode = createReactComponent("outline", "qrcode", "Qrcode", [
	["path", {
		"d": "M4 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4",
		"key": "svg-0"
	}],
	["path", {
		"d": "M7 17l0 .01",
		"key": "svg-1"
	}],
	["path", {
		"d": "M14 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4",
		"key": "svg-2"
	}],
	["path", {
		"d": "M7 7l0 .01",
		"key": "svg-3"
	}],
	["path", {
		"d": "M4 15a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4",
		"key": "svg-4"
	}],
	["path", {
		"d": "M17 7l0 .01",
		"key": "svg-5"
	}],
	["path", {
		"d": "M14 14l3 0",
		"key": "svg-6"
	}],
	["path", {
		"d": "M20 14l0 .01",
		"key": "svg-7"
	}],
	["path", {
		"d": "M14 14l0 3",
		"key": "svg-8"
	}],
	["path", {
		"d": "M14 20l3 0",
		"key": "svg-9"
	}],
	["path", {
		"d": "M17 17l3 0",
		"key": "svg-10"
	}],
	["path", {
		"d": "M20 17l0 3",
		"key": "svg-11"
	}]
]);
/**
* @license @tabler/icons-react v3.46.0 - MIT
*
* This source code is licensed under the MIT license.
* See the LICENSE file in the root directory of this source tree.
*/
var IconSchool = createReactComponent("outline", "school", "School", [["path", {
	"d": "M22 9l-10 -4l-10 4l10 4l10 -4v6",
	"key": "svg-0"
}], ["path", {
	"d": "M6 10.6v5.4a6 3 0 0 0 12 0v-5.4",
	"key": "svg-1"
}]]);
/**
* @license @tabler/icons-react v3.46.0 - MIT
*
* This source code is licensed under the MIT license.
* See the LICENSE file in the root directory of this source tree.
*/
var IconUsers = createReactComponent("outline", "users", "Users", [
	["path", {
		"d": "M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0",
		"key": "svg-0"
	}],
	["path", {
		"d": "M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2",
		"key": "svg-1"
	}],
	["path", {
		"d": "M16 3.13a4 4 0 0 1 0 7.75",
		"key": "svg-2"
	}],
	["path", {
		"d": "M21 21v-2a4 4 0 0 0 -3 -3.85",
		"key": "svg-3"
	}]
]);
//#endregion
//#region node_modules/.pnpm/react@19.2.4/node_modules/react/cjs/react-jsx-runtime.production.js
/**
* @license React
* react-jsx-runtime.production.js
*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_react_jsx_runtime_production = /* @__PURE__ */ __commonJSMin(((exports) => {
	var REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element");
	var REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
	function jsxProd(type, config, maybeKey) {
		var key = null;
		void 0 !== maybeKey && (key = "" + maybeKey);
		void 0 !== config.key && (key = "" + config.key);
		if ("key" in config) {
			maybeKey = {};
			for (var propName in config) "key" !== propName && (maybeKey[propName] = config[propName]);
		} else maybeKey = config;
		config = maybeKey.ref;
		return {
			$$typeof: REACT_ELEMENT_TYPE,
			type,
			key,
			ref: void 0 !== config ? config : null,
			props: maybeKey
		};
	}
	exports.Fragment = REACT_FRAGMENT_TYPE;
	exports.jsx = jsxProd;
	exports.jsxs = jsxProd;
}));
//#endregion
//#region node_modules/.pnpm/react@19.2.4/node_modules/react/jsx-runtime.js
var require_jsx_runtime = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_react_jsx_runtime_production();
}));
//#endregion
//#region src/components/interactive/dock/identityDockItems.tsx
var import_jsx_runtime = require_jsx_runtime();
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
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-full w-full" }),
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
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconCreditCard, { className: "h-full w-full" }),
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
				icon: modality === "credit_card" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconCreditCard, { className: "h-full w-full" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconQrcode, { className: "h-full w-full" }),
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
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconDoorExit, { className: "h-full w-full text-[var(--danger)]" }),
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
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconProgress, { className: "h-full w-full" }),
				href: "/student/enrollment",
				isActive: section === "tracking",
				statusIndicator: "normal"
			},
			{
				id: "documents",
				title: "Meus documentos",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconFileText, { className: "h-full w-full" }),
				href: "/student/enrollment#documents",
				isActive: section === "documents",
				statusIndicator: "normal"
			},
			{
				id: "payment",
				title: "Pagamento",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconCreditCard, { className: "h-full w-full" }),
				href: "/student/enrollment#payment",
				isActive: section === "payment",
				statusIndicator: "normal"
			},
			{
				id: "contact",
				title: "Falar com o polo",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconMessages, { className: "h-full w-full" }),
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
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconHome, { className: "h-full w-full" }),
				href: "/student/active/dashboard",
				isActive: isDashboardActive,
				statusIndicator: "normal"
			},
			{
				id: "documents",
				title: "Documentos",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconFileText, { className: "h-full w-full" }),
				href: "/student/active/documents",
				isActive: currentPath === "/student/active/documents",
				statusIndicator: state.pendingDocsCount ? "warning" : "normal"
			},
			{
				id: "access",
				title: "Acesso",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBook, { className: "h-full w-full" }),
				href: "/student/active/access",
				isActive: isAccessActive,
				statusIndicator: "normal"
			},
			{
				id: "assessments",
				title: "Avaliações",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconAward, { className: "h-full w-full" }),
				href: "/student/active/assessments",
				isActive: isAssessmentsActive,
				badge: examBadge,
				badgeVariant: examIndicator === "success" ? "success" : "warning",
				statusIndicator: examIndicator
			},
			{
				id: "finance",
				title: "Financeiro",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconCreditCard, { className: "h-full w-full" }),
				href: "/student/active/finance",
				isActive: currentPath === "/student/active/finance",
				statusIndicator: "normal"
			},
			{
				id: "logout",
				title: "Sair",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconDoorExit, { className: "h-full w-full text-[var(--danger)]" }),
				onClick: onLogout
			}
		];
	}
	if (rawStatus === "veteran" || rawStatus === "graduated" || rawStatus === "awaiting_diploma_issuance" || currentPath.startsWith("/student/veteran")) return [
		{
			id: "dashboard",
			title: "Conclusão",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconAward, { className: "h-full w-full text-emerald-400" }),
			href: "/student/veteran/dashboard",
			isActive: currentPath === "/student/veteran/dashboard" || currentPath === "/student/veteran",
			statusIndicator: "success"
		},
		{
			id: "records",
			title: "Histórico",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconFileText, { className: "h-full w-full" }),
			href: "/student/veteran/records",
			isActive: currentPath === "/student/veteran/records",
			statusIndicator: "success"
		},
		{
			id: "diploma",
			title: "Diploma",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconCertificate, { className: "h-full w-full text-amber-400" }),
			href: "/student/veteran/diploma",
			isActive: currentPath === "/student/veteran/diploma",
			statusIndicator: mapHealthToIndicator(state.diplomaStatus)
		},
		{
			id: "assessments",
			title: "Prova",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconAward, { className: "h-full w-full" }),
			href: "/student/veteran/assessments",
			isActive: currentPath === "/student/veteran/assessments",
			statusIndicator: "normal"
		},
		{
			id: "finance",
			title: "Financeiro",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconCreditCard, { className: "h-full w-full" }),
			href: "/student/veteran/finance",
			isActive: currentPath === "/student/veteran/finance",
			statusIndicator: "normal"
		},
		{
			id: "logout",
			title: "Sair",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconDoorExit, { className: "h-full w-full text-[var(--danger)]" }),
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
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconLink, { className: "h-full w-full" }),
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
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconSchool, { className: "h-full w-full text-[var(--yellow)]" }),
				href: "/promoter/training/courses",
				badge: pending > 0 ? pending : "!",
				badgeVariant: "warning",
				isActive: currentPath === "/promoter/training/courses" || currentPath === "/promoter/training",
				statusIndicator: "warning"
			},
			{
				id: "locked",
				title: "Painel Travado",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconLock, { className: "h-full w-full opacity-50" }),
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
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconDoorExit, { className: "h-full w-full text-[var(--danger)]" }),
				onClick: onLogout
			}
		];
	}
	if (isSuspended) return [
		{
			id: "notice",
			title: "Suspenso",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconAlertTriangle, { className: "h-full w-full text-rose-400" }),
			href: "/promoter/suspended/notice",
			badge: "Suspenso",
			badgeVariant: "danger",
			isActive: currentPath === "/promoter/suspended/notice" || currentPath === "/promoter/suspended",
			statusIndicator: "danger"
		},
		{
			id: "support",
			title: "Suporte",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconHeadset, { className: "h-full w-full" }),
			href: "/promoter/suspended/support",
			isActive: currentPath === "/promoter/suspended/support",
			statusIndicator: "warning"
		},
		{
			id: "logout",
			title: "Sair",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconDoorExit, { className: "h-full w-full text-[var(--danger)]" }),
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
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconHome, { className: "h-full w-full" }),
			href: "/promoter/active/dashboard",
			isActive: isDashboardActive,
			statusIndicator: "normal"
		},
		{
			id: "referral",
			title: "Indicar",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconLink, { className: "h-full w-full" }),
			href: "/promoter/active/dashboard#referral",
			isActive: currentPath.endsWith("#referral"),
			statusIndicator: "normal"
		},
		{
			id: "leads",
			title: "Leads",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconUsers, { className: "h-full w-full" }),
			href: "/promoter/active/leads",
			badge: newLeads > 0 ? newLeads : void 0,
			badgeVariant: "success",
			isActive: isLeadsActive,
			statusIndicator: "normal"
		},
		{
			id: "commissions",
			title: "Comissões",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconCash, { className: "h-full w-full text-emerald-400" }),
			href: "/promoter/active/commissions",
			isActive: isCommissionsActive,
			statusIndicator: "success"
		},
		{
			id: "documents",
			title: "Documentos",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconFileText, { className: "h-full w-full" }),
			href: "/promoter/active/documents",
			isActive: isDocumentsActive,
			statusIndicator: "normal"
		},
		{
			id: "logout",
			title: "Sair",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconDoorExit, { className: "h-full w-full text-[var(--danger)]" }),
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
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconHome, { className: "h-full w-full" }),
			href: "/hub/active/dashboard",
			isActive: currentPath === "/hub/active/dashboard" || currentPath === "/hub",
			statusIndicator: "normal"
		},
		{
			id: "students",
			title: "Alunos",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconFileCheck, { className: "h-full w-full" }),
			href: "/hub/active/operations",
			badge: pendingReviews > 0 ? pendingReviews : void 0,
			badgeVariant: "warning",
			statusIndicator: pendingReviews > 0 ? "warning" : "normal",
			isActive: currentPath === "/hub/active/operations" || currentPath === "/hub/review/students" || currentPath === "/hub/review"
		},
		{
			id: "promoters",
			title: "Promotores",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconUsers, { className: "h-full w-full" }),
			href: "/hub/review/promoters",
			statusIndicator: "normal",
			isActive: currentPath === "/hub/review/promoters"
		},
		{
			id: "exams",
			title: "Provas",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconSchool, { className: "h-full w-full" }),
			href: "/hub/active/exams",
			statusIndicator: "normal",
			isActive: currentPath === "/hub/active/exams"
		},
		{
			id: "logout",
			title: "Sair",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconDoorExit, { className: "h-full w-full text-[var(--danger)]" }),
			onClick: onLogout
		}
	];
	return [
		{
			id: "dashboard",
			title: "Painel",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconHome, { className: "h-full w-full" }),
			href: "/hub/active/dashboard",
			isActive: currentPath === "/hub/active/dashboard" || currentPath === "/hub/active" || currentPath === "/hub",
			statusIndicator: "normal"
		},
		{
			id: "students",
			title: "Alunos",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconFileCheck, { className: "h-full w-full" }),
			href: "/hub/active/operations",
			badge: pendingReviews > 0 ? pendingReviews : void 0,
			badgeVariant: "warning",
			statusIndicator: pendingReviews > 0 ? "warning" : "normal",
			isActive: currentPath === "/hub/active/operations" || currentPath === "/hub/review/students" || currentPath === "/hub/review"
		},
		{
			id: "promoters",
			title: "Promotores",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconUsers, { className: "h-full w-full" }),
			href: "/hub/review/promoters",
			statusIndicator: "normal",
			isActive: currentPath === "/hub/review/promoters"
		},
		{
			id: "exams",
			title: "Provas",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconSchool, { className: "h-full w-full" }),
			href: "/hub/active/exams",
			statusIndicator: "normal",
			isActive: currentPath === "/hub/active/exams"
		},
		{
			id: "logout",
			title: "Sair",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconDoorExit, { className: "h-full w-full text-[var(--danger)]" }),
			onClick: onLogout
		}
	];
}
//#endregion
export { IconSchool as a, IconFileCheck as c, IconAlertTriangle as d, createReactComponent as f, require_jsx_runtime as i, IconCash as l, useDockSync as m, getPromoterDockItems as n, IconLock as o, setLeadCheckoutReadyState as p, getStudentDockItems as r, IconFileText as s, getPoloDockItems as t, IconAward as u };
