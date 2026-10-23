import { r as __exportAll } from "./rolldown-runtime_BMI-E3GI.mjs";
import { d as renderTemplate, f as maybeRenderHead, i as renderComponent } from "./server_ZN1nPn8N.mjs";
import { t as createComponent } from "./compiler_DJgU_Xlh.mjs";
import { t as $$RootLayout } from "./RootLayout_Ccnumr8N.mjs";
import { a as useDockSync, n as getPromoterDockItems, r as getStudentDockItems, t as getPoloDockItems } from "./dock_BOJJiLNh.mjs";
import { clsx } from "clsx";
import * as React$1 from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { IconAlertTriangle, IconAward, IconCash, IconChecklist, IconCircleCheck, IconClock, IconFileCheck, IconFileText, IconLayoutNavbar, IconLayoutNavbarCollapse, IconLock, IconSchool } from "@tabler/icons-react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { twMerge } from "tailwind-merge";
//#region src/lib/utils.ts
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
//#endregion
//#region src/components/ui/tabs.tsx
var Tabs = ({ tabs, defaultValue, value: controlledValue, onChange, onTabChange, containerClassName, tablistWrapperClassName, tablistClassName, tabClassName, activeTabClassName, contentClassName, ariaLabel = "Navegação por abas de conteúdo" }) => {
	const baseId = useId();
	const shouldReduceMotion = useReducedMotion();
	const [internalValue, setInternalValue] = useState(() => defaultValue || tabs?.[0]?.value || "");
	const activeValue = controlledValue !== void 0 ? controlledValue : internalValue;
	const tabRefs = useRef([]);
	useEffect(() => {
		if (!tabs || tabs.length === 0) return;
		if (!tabs.some((t) => t.value === activeValue)) {
			const fallback = tabs[0]?.value || "";
			setInternalValue(fallback);
			onChange?.(fallback);
		}
	}, [
		tabs,
		activeValue,
		onChange
	]);
	if (!tabs || tabs.length === 0) return null;
	const handleSelectTab = (tab) => {
		if (tab.value === activeValue) return;
		if (controlledValue === void 0) setInternalValue(tab.value);
		onChange?.(tab.value);
		onTabChange?.(tab);
	};
	const handleKeyDown = (e, currentIndex) => {
		let targetIndex = -1;
		switch (e.key) {
			case "ArrowRight":
				targetIndex = (currentIndex + 1) % tabs.length;
				break;
			case "ArrowLeft":
				targetIndex = (currentIndex - 1 + tabs.length) % tabs.length;
				break;
			case "Home":
				targetIndex = 0;
				break;
			case "End":
				targetIndex = tabs.length - 1;
				break;
			default: return;
		}
		e.preventDefault();
		const nextTab = tabs[targetIndex];
		if (nextTab) {
			handleSelectTab(nextTab);
			tabRefs.current[targetIndex]?.focus();
		}
	};
	return /* @__PURE__ */ jsxs("div", {
		className: cn("w-full flex flex-col items-center", containerClassName),
		children: [/* @__PURE__ */ jsx("div", {
			className: cn("w-full flex justify-center", tablistWrapperClassName),
			children: /* @__PURE__ */ jsx("div", {
				role: "tablist",
				"aria-label": ariaLabel,
				"aria-orientation": "horizontal",
				className: cn("relative flex flex-row items-center justify-start sm:justify-center p-1.5 rounded-full", "bg-[var(--ink)]/80 backdrop-blur-md border border-white/10 shadow-[var(--shadow-glass)]", "overflow-x-auto no-visible-scrollbar max-w-full touch-pan-x gap-1", tablistClassName),
				style: { WebkitTapHighlightColor: "transparent" },
				children: tabs.map((tab, idx) => {
					const isActive = tab.value === activeValue;
					const tabId = `${baseId}-tab-${tab.value}`;
					const panelId = `${baseId}-panel-${tab.value}`;
					return /* @__PURE__ */ jsxs("button", {
						ref: (el) => {
							tabRefs.current[idx] = el;
						},
						id: tabId,
						type: "button",
						role: "tab",
						"aria-selected": isActive,
						"aria-controls": panelId,
						tabIndex: isActive ? 0 : -1,
						onClick: () => handleSelectTab(tab),
						onKeyDown: (e) => handleKeyDown(e, idx),
						className: cn("relative z-10 px-4 sm:px-5 py-2.5 min-h-[48px] rounded-full inline-flex items-center justify-center gap-2", "font-sans text-xs sm:text-sm font-semibold tracking-wide transition-colors duration-200 select-none cursor-pointer", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--yellow)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink)]", isActive ? "text-white" : "text-[var(--muted-on-dark)] hover:text-white", tabClassName),
						style: { touchAction: "manipulation" },
						children: [
							isActive && /* @__PURE__ */ jsx(motion.div, {
								layoutId: shouldReduceMotion ? void 0 : `${baseId}-active-tab-indicator`,
								transition: shouldReduceMotion ? { duration: 0 } : {
									type: "spring",
									bounce: .18,
									duration: .45
								},
								className: cn("absolute inset-0 rounded-full bg-[var(--blue)] shadow-lg shadow-[var(--blue)]/50 border border-white/20", activeTabClassName),
								style: { zIndex: -1 }
							}),
							tab.icon && /* @__PURE__ */ jsx("span", {
								className: "shrink-0",
								children: tab.icon
							}),
							/* @__PURE__ */ jsx("span", {
								className: "relative z-10 whitespace-nowrap",
								children: tab.title
							}),
							tab.badge && /* @__PURE__ */ jsx("span", {
								className: cn("ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full", isActive ? "bg-[var(--yellow)] text-[var(--ink)]" : "bg-white/10 text-white/80"),
								children: tab.badge
							})
						]
					}, tab.value);
				})
			})
		}), /* @__PURE__ */ jsx("div", {
			className: cn("relative w-full mt-6", contentClassName),
			children: tabs.map((tab) => {
				const isActive = tab.value === activeValue;
				const tabId = `${baseId}-tab-${tab.value}`;
				const panelId = `${baseId}-panel-${tab.value}`;
				return /* @__PURE__ */ jsx("div", {
					id: panelId,
					role: "tabpanel",
					"aria-labelledby": tabId,
					tabIndex: 0,
					hidden: !isActive,
					inert: !isActive,
					className: cn("w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] rounded-3xl", !isActive && "hidden"),
					children: isActive && /* @__PURE__ */ jsx(motion.div, {
						initial: shouldReduceMotion ? { opacity: 1 } : {
							opacity: 0,
							y: 8,
							scale: .995
						},
						animate: {
							opacity: 1,
							y: 0,
							scale: 1
						},
						transition: shouldReduceMotion ? { duration: 0 } : {
							duration: .28,
							ease: [
								.16,
								1,
								.3,
								1
							]
						},
						className: "w-full",
						children: tab.content
					})
				}, tab.value);
			})
		})]
	});
};
//#endregion
//#region src/components/ui/floating-dock.tsx
function getStatusIndicatorClasses(indicator, disabled) {
	if (disabled || indicator === "disabled") return "opacity-35 grayscale contrast-75 cursor-not-allowed pointer-events-none border-dashed border-neutral-400 dark:border-neutral-600";
	switch (indicator) {
		case "danger": return "ring-2 ring-rose-500 shadow-[0_0_18px_rgba(244,63,94,0.7)] border-rose-500 text-rose-500 dark:shadow-[0_0_22px_rgba(244,63,94,0.8)]";
		case "warning": return "ring-2 ring-amber-500 shadow-[0_0_18px_rgba(245,158,11,0.7)] border-amber-500 text-amber-500 dark:shadow-[0_0_22px_rgba(245,158,11,0.8)]";
		case "success": return "ring-2 ring-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.7)] border-emerald-500 text-emerald-500 dark:shadow-[0_0_22px_rgba(16,185,129,0.8)]";
		default: return "";
	}
}
var FloatingDock = ({ items, desktopClassName, mobileClassName, dockAriaLabel = "Navegação rápida", className }) => {
	return /* @__PURE__ */ jsx("nav", {
		"aria-label": dockAriaLabel,
		"data-testid": "role-adaptive-dock",
		"data-app-dock": "true",
		"data-app-dock-mode": "floating",
		className: cn("fixed bottom-6 inset-x-0 z-50 flex justify-center items-center pointer-events-none", className),
		children: /* @__PURE__ */ jsxs("div", {
			className: "pointer-events-auto",
			children: [/* @__PURE__ */ jsx(FloatingDockDesktop, {
				items,
				className: desktopClassName
			}), /* @__PURE__ */ jsx(FloatingDockMobile, {
				items,
				className: mobileClassName
			})]
		})
	});
};
var FloatingDockMobile = ({ items, className }) => {
	const [open, setOpen] = React$1.useState(false);
	return /* @__PURE__ */ jsxs("div", {
		className: cn("relative block md:hidden", className),
		children: [/* @__PURE__ */ jsx(AnimatePresence, { children: open && /* @__PURE__ */ jsx(motion.div, {
			layoutId: "dock-mobile-menu",
			initial: {
				opacity: 0,
				scale: .92,
				y: 12
			},
			animate: {
				opacity: 1,
				scale: 1,
				y: 0
			},
			exit: {
				opacity: 0,
				scale: .92,
				y: 12
			},
			className: "absolute inset-x-0 bottom-full mb-3 flex flex-col gap-2.5 items-center z-50",
			children: items.map((item, idx) => /* @__PURE__ */ jsx(motion.div, {
				initial: {
					opacity: 0,
					y: 10
				},
				animate: {
					opacity: 1,
					y: 0
				},
				exit: {
					opacity: 0,
					y: 10,
					transition: { delay: idx * .03 }
				},
				transition: { delay: (items.length - 1 - idx) * .03 },
				children: /* @__PURE__ */ jsxs(DockButtonOrLink, {
					item,
					className: cn("flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-200 relative", "shadow-lg", item.isActive ? "bg-[var(--yellow)] text-[var(--ink)] border-[var(--ink)] ring-2 ring-[var(--yellow)]/50" : "bg-[var(--paper)] text-[var(--ink)] border-[var(--line-light)] hover:bg-[var(--paper-soft)] dark:bg-[var(--ink-soft)] dark:text-[var(--paper)] dark:border-white/10", getStatusIndicatorClasses(item.statusIndicator, item.disabled)),
					onItemClick: () => setOpen(false),
					children: [/* @__PURE__ */ jsx("div", {
						className: "h-5 w-5 flex items-center justify-center",
						children: item.icon
					}), item.badge !== void 0 && item.badge !== null && /* @__PURE__ */ jsx("span", {
						className: cn("absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold", item.badgeVariant === "danger" && "bg-[var(--danger)] text-white", item.badgeVariant === "warning" && "bg-[var(--warning)] text-white", item.badgeVariant === "success" && "bg-[var(--success)] text-white", (!item.badgeVariant || item.badgeVariant === "info") && "bg-[var(--blue)] text-white"),
						children: item.badge
					})]
				})
			}, item.id ?? item.title))
		}) }), /* @__PURE__ */ jsx("button", {
			type: "button",
			onClick: () => setOpen((prev) => !prev),
			"aria-expanded": open,
			"aria-label": "Abrir ou fechar menu de navegação flutuante",
			className: cn("flex h-12 w-12 items-center justify-center rounded-full border shadow-xl transition-all duration-200", open ? "bg-[var(--ink)] text-[var(--yellow)] border-[var(--ink)] dark:bg-[var(--paper)] dark:text-[var(--ink)]" : "bg-[var(--paper)] text-[var(--ink)] border-[var(--line-light)] active:scale-95 dark:bg-[var(--ink)] dark:text-[var(--paper)] dark:border-white/10"),
			children: /* @__PURE__ */ jsx(IconLayoutNavbarCollapse, { className: "h-5 w-5 transition-transform duration-200" })
		})]
	});
};
var FloatingDockDesktop = ({ items, className }) => {
	const mouseX = useMotionValue(Infinity);
	return /* @__PURE__ */ jsx(motion.div, {
		onMouseMove: (e) => mouseX.set(e.pageX),
		onMouseLeave: () => mouseX.set(Infinity),
		className: cn("mx-auto hidden h-16 items-end gap-3 rounded-2xl px-4 pb-3 border backdrop-blur-md transition-shadow duration-300 md:flex", "bg-[var(--paper)]/90 border-[var(--line-light)] shadow-2xl", "dark:bg-[var(--ink)]/90 dark:border-white/10 dark:shadow-2xl", className),
		children: items.map((item) => /* @__PURE__ */ jsx(IconContainer, {
			mouseX,
			item
		}, item.id ?? item.title))
	});
};
function IconContainer({ mouseX, item }) {
	const ref = React$1.useRef(null);
	const distance = useTransform(mouseX, (val) => {
		const bounds = ref.current?.getBoundingClientRect() ?? {
			x: 0,
			width: 0
		};
		return val - bounds.x - bounds.width / 2;
	});
	const widthTransform = useTransform(distance, [
		-150,
		0,
		150
	], [
		42,
		74,
		42
	]);
	const heightTransform = useTransform(distance, [
		-150,
		0,
		150
	], [
		42,
		74,
		42
	]);
	const widthTransformIcon = useTransform(distance, [
		-150,
		0,
		150
	], [
		20,
		36,
		20
	]);
	const heightTransformIcon = useTransform(distance, [
		-150,
		0,
		150
	], [
		20,
		36,
		20
	]);
	const width = useSpring(widthTransform, {
		mass: .1,
		stiffness: 150,
		damping: 12
	});
	const height = useSpring(heightTransform, {
		mass: .1,
		stiffness: 150,
		damping: 12
	});
	const widthIcon = useSpring(widthTransformIcon, {
		mass: .1,
		stiffness: 150,
		damping: 12
	});
	const heightIcon = useSpring(heightTransformIcon, {
		mass: .1,
		stiffness: 150,
		damping: 12
	});
	const [hovered, setHovered] = React$1.useState(false);
	return /* @__PURE__ */ jsx(DockButtonOrLink, {
		item,
		children: /* @__PURE__ */ jsxs(motion.div, {
			ref,
			style: {
				width,
				height
			},
			onMouseEnter: () => setHovered(true),
			onMouseLeave: () => setHovered(false),
			className: cn("relative flex aspect-square items-center justify-center rounded-full border transition-all duration-200 cursor-pointer", item.isActive ? "bg-[var(--yellow)] text-[var(--ink)] border-[var(--ink)] font-bold shadow-md ring-2 ring-[var(--yellow)]/60" : "bg-[var(--paper-soft)] border-[var(--line-light)] text-[var(--ink)] hover:border-[var(--blue)] dark:bg-[var(--ink-soft)] dark:border-white/10 dark:text-[var(--paper)]", getStatusIndicatorClasses(item.statusIndicator, item.disabled)),
			children: [
				/* @__PURE__ */ jsx(AnimatePresence, { children: hovered && /* @__PURE__ */ jsx(motion.div, {
					initial: {
						opacity: 0,
						y: 10,
						x: "-50%"
					},
					animate: {
						opacity: 1,
						y: 0,
						x: "-50%"
					},
					exit: {
						opacity: 0,
						y: 2,
						x: "-50%"
					},
					className: "pointer-events-none absolute -top-9 left-1/2 w-fit rounded-md border border-[var(--line-light)] bg-[var(--paper)] px-2.5 py-1 text-xs font-semibold whitespace-pre text-[var(--ink)] shadow-lg dark:border-white/15 dark:bg-[var(--ink)] dark:text-white z-50",
					children: item.title
				}) }),
				/* @__PURE__ */ jsx(motion.div, {
					style: {
						width: widthIcon,
						height: heightIcon
					},
					className: "flex items-center justify-center relative",
					children: item.icon
				}),
				item.badge !== void 0 && item.badge !== null && /* @__PURE__ */ jsx("span", {
					className: cn("absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold z-20 shadow-sm", item.badgeVariant === "danger" && "bg-[var(--danger)] text-white", item.badgeVariant === "warning" && "bg-[var(--warning)] text-white", item.badgeVariant === "success" && "bg-[var(--success)] text-white", (!item.badgeVariant || item.badgeVariant === "info") && "bg-[var(--blue)] text-white"),
					children: item.badge
				})
			]
		})
	});
}
/**
* Renderizador Polimórfico:
* Renderiza <a> se href existir; caso contrário, renderiza <button>.
*/
var DockButtonOrLink = ({ item, className, children, onItemClick }) => {
	const handleClick = (e) => {
		if (item.disabled) {
			e.preventDefault();
			return;
		}
		if (item.onClick) item.onClick();
		if (onItemClick) onItemClick();
	};
	const label = item["aria-label"] ?? item.title;
	if (item.href) return /* @__PURE__ */ jsx("a", {
		href: item.href,
		className,
		"aria-label": label,
		"aria-current": item.isActive ? "page" : void 0,
		onClick: handleClick,
		children
	});
	return /* @__PURE__ */ jsx("button", {
		type: "button",
		onClick: handleClick,
		className,
		disabled: item.disabled,
		"aria-label": label,
		"aria-pressed": item.isActive,
		children
	});
};
//#endregion
//#region src/components/interactive/RoleAdaptiveNavDock.tsx
/**
* Componente Adaptativo Multi-Role & Multi-Estado.
* Arquitetura em camadas desacopladas:
* 1. Hook de sincronização reativo (`useDockSync`) isolando ciclo de vida, auth e eventos
* 2. Adaptador polimórfico por Perfil (aluno, promotor, polo)
* 3. Renderizador de casca limpo (Bottom Bar Nativa ou Floating Dock Cápsula)
*
* 100% aderente a AGENTS.md e DESIGN.md (Código em inglês, Interface 100% PT-BR).
*/
var RoleAdaptiveNavDock = ({ initialRole = "aluno", role: controlledRole, variant = "bottom-bar", currentPath = "/painel", onNavigate, onLogout, bypassAuth = false, studentState: controlledStudentState, promoterState: controlledPromoterState, poloState: controlledPoloState }) => {
	const [currentHash, setCurrentHash] = React$1.useState("");
	React$1.useEffect(() => {
		const syncHash = () => setCurrentHash(window.location.hash);
		syncHash();
		window.addEventListener("hashchange", syncHash);
		return () => window.removeEventListener("hashchange", syncHash);
	}, []);
	const { activeRole, isAuthenticated, isLocked, studentState: effectiveStudentState, promoterState: effectivePromoterState, poloState: effectivePoloState, handleLogout } = useDockSync({
		initialRole,
		controlledRole,
		currentPath,
		bypassAuth,
		onLogout,
		controlledStudentState,
		controlledPromoterState,
		controlledPoloState
	});
	const isLeadWizard = (activeRole === "student" || activeRole === "aluno") && (effectiveStudentState.status === "lead" || currentPath.startsWith("/student/lead"));
	if (!isAuthenticated || isLocked && !isLeadWizard) return null;
	const context = {
		currentPath: currentPath.split("#")[0] + currentHash,
		onNavigate,
		onLogout: handleLogout
	};
	let items = [];
	switch (activeRole) {
		case "promoter":
		case "promotor":
			items = getPromoterDockItems(effectivePromoterState, context);
			break;
		case "hub":
		case "polo":
			items = getPoloDockItems(effectivePoloState, context);
			break;
		default: items = getStudentDockItems(effectiveStudentState, context);
	}
	if ([
		"student",
		"aluno",
		"promoter",
		"promotor"
	].includes(activeRole)) items = items.filter((item) => item.id !== "logout");
	if (variant === "bottom-bar") return /* @__PURE__ */ jsxs("nav", {
		"aria-label": `Navegação principal do ${activeRole}`,
		"data-app-dock": "true",
		"data-app-dock-mode": "bottom-bar",
		className: "fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-[var(--ink)]/90 backdrop-blur-2xl shadow-2xl pb-[env(safe-area-inset-bottom)]",
		children: [/* @__PURE__ */ jsx("div", { className: "h-[2px] w-full bg-gradient-to-r from-[var(--green)] via-[var(--yellow)] to-[var(--blue)]" }), /* @__PURE__ */ jsx("div", {
			className: "mx-auto flex w-full max-w-lg items-center justify-around px-2 py-2",
			children: items.map((item, index) => {
				const badgeBg = item.badgeVariant === "danger" ? "bg-[var(--danger)] text-white" : item.badgeVariant === "success" ? "bg-[var(--success)] text-white" : item.badgeVariant === "info" ? "bg-[var(--info)] text-white" : "bg-[var(--yellow)] text-[var(--ink)]";
				const indicatorClasses = getStatusIndicatorClasses(item.statusIndicator, item.disabled);
				const content = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsxs("div", {
					className: cn("relative flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200", indicatorClasses),
					children: [/* @__PURE__ */ jsx("div", {
						className: "h-5 w-5",
						children: item.icon
					}), item.badge !== void 0 && item.badge !== null && /* @__PURE__ */ jsx("span", {
						className: `absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-black shadow-md ${badgeBg}`,
						children: item.badge
					})]
				}), /* @__PURE__ */ jsx("span", {
					className: "text-[10px] tracking-tight",
					children: item.title
				})] });
				const commonClasses = `flex min-h-12 min-w-12 flex-col items-center gap-1 p-2 rounded-xl transition-all active:scale-95 cursor-pointer ${item.isActive ? "text-[var(--yellow)] font-bold drop-shadow-[0_0_8px_rgba(255,204,0,0.3)]" : "text-white/70 hover:text-white"} ${item.disabled ? "opacity-40 pointer-events-none cursor-not-allowed" : ""}`;
				if (item.onClick) return /* @__PURE__ */ jsx("button", {
					type: "button",
					onClick: item.onClick,
					disabled: item.disabled,
					"aria-current": item.isActive ? "page" : void 0,
					className: commonClasses,
					children: content
				}, `${item.title}-${index}`);
				return /* @__PURE__ */ jsx("a", {
					href: item.href || "#",
					"aria-disabled": item.disabled || void 0,
					"aria-current": item.isActive ? "page" : void 0,
					onClick: (e) => {
						if (item.disabled) {
							e.preventDefault();
							return;
						}
						if (onNavigate && item.href) {
							e.preventDefault();
							onNavigate(item.href);
						}
					},
					className: commonClasses,
					children: content
				}, `${item.title}-${index}`);
			})
		})]
	});
	return /* @__PURE__ */ jsx(FloatingDock, {
		items,
		desktopClassName: "w-fit",
		dockAriaLabel: `Navegação principal do ${activeRole}`
	});
};
//#endregion
//#region src/components/interactive/RoleStatusTabs.tsx
var RoleStatusTabs = ({ initialRole = "aluno", initialVariant = "bottom-bar" }) => {
	const [hydrated, setHydrated] = useState(false);
	const [activeRole, setActiveRole] = useState(initialRole);
	const [dockVariant, setDockVariant] = useState(initialVariant);
	useEffect(() => {
		setHydrated(true);
	}, []);
	const [studentStatus, setStudentStatus] = useState("awaiting_documents");
	const [promoterStatus, setPromoterStatus] = useState("candidate");
	const [poloStatus, setPoloStatus] = useState("pending_validation");
	const studentTabs = useMemo(() => [
		{
			title: "1. Envio de Documentos",
			value: "awaiting_documents",
			badge: "Pendente",
			content: /* @__PURE__ */ jsxs("div", {
				className: "w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ jsx("div", {
								className: "size-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400",
								children: /* @__PURE__ */ jsx(IconFileText, { className: "size-5" })
							}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
								className: "text-xs font-semibold text-amber-400 uppercase tracking-wider",
								children: "Etapa 1 • Matrícula & Documentação"
							}), /* @__PURE__ */ jsx("h3", {
								className: "text-xl font-bold text-white",
								children: "Coleta de Documentos Obrigatórios"
							})] })]
						}), /* @__PURE__ */ jsx("span", {
							className: "px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold w-fit",
							children: "Ação Requerida do Aluno"
						})]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-sm text-white/80 leading-relaxed",
						children: "O aluno concluiu o pagamento da matrícula e precisa digitalizar o RG (frente e verso), comprovante de endereço e histórico escolar anterior para liberação do ambiente pedagógico."
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-3",
						children: [/* @__PURE__ */ jsx(IconAlertTriangle, { className: "size-5 shrink-0 mt-0.5 text-amber-400" }), /* @__PURE__ */ jsxs("div", { children: [
							/* @__PURE__ */ jsx("strong", {
								className: "font-semibold block mb-0.5",
								children: "Comportamento do Dock:"
							}),
							"O ícone ",
							/* @__PURE__ */ jsx("strong", {
								className: "text-white",
								children: "Documentação"
							}),
							" fica em destaque ativo com badge de exclamação ",
							/* @__PURE__ */ jsx("span", {
								className: "bg-amber-400 text-black px-1.5 py-0.5 rounded-full font-black text-[10px]",
								children: "!"
							}),
							" para guiar imediatamente o aluno à regularização. Provas e Certificação permanecem inativos."
						] })]
					})
				]
			})
		},
		{
			title: "2. Análise da Secretaria",
			value: "documents_under_review",
			badge: "Em Análise",
			content: /* @__PURE__ */ jsxs("div", {
				className: "w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ jsx("div", {
								className: "size-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400",
								children: /* @__PURE__ */ jsx(IconClock, { className: "size-5" })
							}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
								className: "text-xs font-semibold text-sky-400 uppercase tracking-wider",
								children: "Etapa 2 • Secretaria de Polo"
							}), /* @__PURE__ */ jsx("h3", {
								className: "text-xl font-bold text-white",
								children: "Documentação em Conferência"
							})] })]
						}), /* @__PURE__ */ jsx("span", {
							className: "px-3 py-1 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 text-xs font-bold w-fit",
							children: "Aguardando Polo"
						})]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-sm text-white/80 leading-relaxed",
						children: "Os arquivos foram enviados com sucesso e estão na esteira de conferência da secretaria escolar credenciada. O polo valida a autenticidade e emite o parecer pedagógico."
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-200 flex items-start gap-3",
						children: [/* @__PURE__ */ jsx(IconClock, { className: "size-5 shrink-0 mt-0.5 text-sky-400" }), /* @__PURE__ */ jsxs("div", { children: [
							/* @__PURE__ */ jsx("strong", {
								className: "font-semibold block mb-0.5",
								children: "Comportamento do Dock:"
							}),
							"O ícone ",
							/* @__PURE__ */ jsx("strong", {
								className: "text-white",
								children: "Documentação"
							}),
							" exibe um indicador sutil ",
							/* @__PURE__ */ jsx("span", {
								className: "bg-sky-500 text-white px-1.5 py-0.5 rounded-full font-black text-[10px]",
								children: "•"
							}),
							". O aluno pode estudar as apostilas no ambiente, mas as provas continuam aguardando liberação da secretaria."
						] })]
					})
				]
			})
		},
		{
			title: "3. Prova Liberada",
			value: "exam_released",
			badge: "Liberada",
			content: /* @__PURE__ */ jsxs("div", {
				className: "w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ jsx("div", {
								className: "size-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400",
								children: /* @__PURE__ */ jsx(IconSchool, { className: "size-5" })
							}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
								className: "text-xs font-semibold text-emerald-400 uppercase tracking-wider",
								children: "Etapa 3 • Banca Avaliadora"
							}), /* @__PURE__ */ jsx("h3", {
								className: "text-xl font-bold text-white",
								children: "Avaliações Finais Disponíveis"
							})] })]
						}), /* @__PURE__ */ jsx("span", {
							className: "px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold w-fit",
							children: "Pronto para Agendar"
						})]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-sm text-white/80 leading-relaxed",
						children: "Documentação validada e carga horária integralizada. O aluno está 100% apto a realizar ou agendar sua avaliação final do Ensino Médio."
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200 flex items-start gap-3",
						children: [/* @__PURE__ */ jsx(IconCircleCheck, { className: "size-5 shrink-0 mt-0.5 text-emerald-400" }), /* @__PURE__ */ jsxs("div", { children: [
							/* @__PURE__ */ jsx("strong", {
								className: "font-semibold block mb-0.5",
								children: "Comportamento do Dock:"
							}),
							"O foco salta diretamente para ",
							/* @__PURE__ */ jsx("strong", {
								className: "text-white",
								children: "Provas & Avaliações"
							}),
							", com badge de sucesso ",
							/* @__PURE__ */ jsx("span", {
								className: "bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black text-[10px]",
								children: "Liberada"
							}),
							" e destaque ativo no menu inferior."
						] })]
					})
				]
			})
		},
		{
			title: "4. Emissão de Diploma",
			value: "awaiting_diploma_issuance",
			badge: "Emissão",
			content: /* @__PURE__ */ jsxs("div", {
				className: "w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ jsx("div", {
								className: "size-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400",
								children: /* @__PURE__ */ jsx(IconAward, { className: "size-5" })
							}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
								className: "text-xs font-semibold text-purple-400 uppercase tracking-wider",
								children: "Etapa 4 • Registro Oficial MEC"
							}), /* @__PURE__ */ jsx("h3", {
								className: "text-xl font-bold text-white",
								children: "Conferência documental da instituição"
							})] })]
						}), /* @__PURE__ */ jsx("span", {
							className: "px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold w-fit",
							children: "Emissão em Andamento"
						})]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-sm text-white/80 leading-relaxed",
						children: "Demonstração visual: em produção, o servidor informa o resultado da conferência e os registros disponíveis."
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 flex items-start gap-3",
						children: [/* @__PURE__ */ jsx(IconAward, { className: "size-5 shrink-0 mt-0.5 text-purple-400" }), /* @__PURE__ */ jsxs("div", { children: [
							/* @__PURE__ */ jsx("strong", {
								className: "font-semibold block mb-0.5",
								children: "Comportamento do Dock:"
							}),
							"O ícone ",
							/* @__PURE__ */ jsx("strong", {
								className: "text-white",
								children: "Certificação e Diploma"
							}),
							" ganha o badge ",
							/* @__PURE__ */ jsx("span", {
								className: "bg-sky-500 text-white px-2 py-0.5 rounded-full font-black text-[10px]",
								children: "Emissão"
							}),
							" e assume o destaque visual de conclusão."
						] })]
					})
				]
			})
		},
		{
			title: "5. Aluno Formado",
			value: "veteran",
			badge: "Concluído",
			content: /* @__PURE__ */ jsxs("div", {
				className: "w-full rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 backdrop-blur-md space-y-4",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ jsx("div", {
								className: "size-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400",
								children: /* @__PURE__ */ jsx(IconAward, { className: "size-5" })
							}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
								className: "text-xs font-semibold text-emerald-400 uppercase tracking-wider",
								children: "Etapa Final • Certificação Concluída"
							}), /* @__PURE__ */ jsx("h3", {
								className: "text-xl font-bold text-white",
								children: "Diploma Registrado e Disponível"
							})] })]
						}), /* @__PURE__ */ jsx("span", {
							className: "px-3 py-1 rounded-full bg-emerald-500 text-black text-xs font-black w-fit",
							children: "FORMADO 🎓"
						})]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-sm text-white/85 leading-relaxed",
						children: "Demonstração visual: o download e a retirada aparecem somente quando o servidor disponibiliza os arquivos oficiais."
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-200 flex items-start gap-3",
						children: [/* @__PURE__ */ jsx(IconCircleCheck, { className: "size-5 shrink-0 mt-0.5 text-emerald-400" }), /* @__PURE__ */ jsxs("div", { children: [
							/* @__PURE__ */ jsx("strong", {
								className: "font-semibold block mb-0.5",
								children: "Comportamento do Dock:"
							}),
							"Badge verde ",
							/* @__PURE__ */ jsx("span", {
								className: "bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black text-[10px]",
								children: "Concluído"
							}),
							" com acesso direto à via digital do diploma e opção de indicação de novos alunos como promotor parceiro."
						] })]
					})
				]
			})
		}
	], []);
	const promoterTabs = useMemo(() => [
		{
			title: "1. Credenciamento",
			value: "candidate",
			badge: "Onboarding",
			content: /* @__PURE__ */ jsxs("div", {
				className: "w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ jsx("div", {
								className: "size-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400",
								children: /* @__PURE__ */ jsx(IconChecklist, { className: "size-5" })
							}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
								className: "text-xs font-semibold text-amber-400 uppercase tracking-wider",
								children: "Candidato a Promotor"
							}), /* @__PURE__ */ jsx("h3", {
								className: "text-xl font-bold text-white",
								children: "Onboarding & Cadastro de Chave PIX"
							})] })]
						}), /* @__PURE__ */ jsx("span", {
							className: "px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold w-fit",
							children: "Etapa Inicial"
						})]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-sm text-white/80 leading-relaxed",
						children: "O consultor está finalizando sua ficha cadastral, termo de adesão ao programa de indicação e inserção da chave PIX para repasse automático de bonificações."
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-3",
						children: [/* @__PURE__ */ jsx(IconAlertTriangle, { className: "size-5 shrink-0 mt-0.5 text-amber-400" }), /* @__PURE__ */ jsxs("div", { children: [
							/* @__PURE__ */ jsx("strong", {
								className: "font-semibold block mb-0.5",
								children: "Comportamento do Dock:"
							}),
							"O Dock fica restrito a ",
							/* @__PURE__ */ jsx("strong", {
								className: "text-white",
								children: "Credenciamento"
							}),
							" e Sair. As abas de Leads e Comissões ficam ocultas até a homologação."
						] })]
					})
				]
			})
		},
		{
			title: "2. Treinamento",
			value: "training",
			badge: "Travado",
			content: /* @__PURE__ */ jsxs("div", {
				className: "w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ jsx("div", {
								className: "size-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400",
								children: /* @__PURE__ */ jsx(IconLock, { className: "size-5" })
							}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
								className: "text-xs font-semibold text-amber-400 uppercase tracking-wider",
								children: "Capacitação Obrigatória"
							}), /* @__PURE__ */ jsx("h3", {
								className: "text-xl font-bold text-white",
								children: "Módulos de Conformidade & Ética"
							})] })]
						}), /* @__PURE__ */ jsx("span", {
							className: "px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold w-fit",
							children: "Painel Travado"
						})]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-sm text-white/80 leading-relaxed",
						children: "Regra regulatória: antes de gerar links de indicação, o promotor deve assistir aos vídeos curtos de conformidade do MEC e práticas autorizadas de divulgação."
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200 flex items-start gap-3",
						children: [/* @__PURE__ */ jsx(IconLock, { className: "size-5 shrink-0 mt-0.5 text-rose-400" }), /* @__PURE__ */ jsxs("div", { children: [
							/* @__PURE__ */ jsx("strong", {
								className: "font-semibold block mb-0.5",
								children: "Comportamento do Dock:"
							}),
							"Exibe o item ",
							/* @__PURE__ */ jsx("strong", {
								className: "text-white",
								children: "Treinamento Obrigatório"
							}),
							" com badge de atenção, e o ",
							/* @__PURE__ */ jsx("strong", {
								className: "text-white",
								children: "Painel Bloqueado"
							}),
							" com cadeado e badge ",
							/* @__PURE__ */ jsx("span", {
								className: "bg-rose-500 text-white px-1.5 py-0.5 rounded-full font-black text-[10px]",
								children: "Travado"
							}),
							"."
						] })]
					})
				]
			})
		},
		{
			title: "3. Promotor Ativo",
			value: "active",
			badge: "Liberado",
			content: /* @__PURE__ */ jsxs("div", {
				className: "w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ jsx("div", {
								className: "size-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400",
								children: /* @__PURE__ */ jsx(IconCash, { className: "size-5" })
							}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
								className: "text-xs font-semibold text-emerald-400 uppercase tracking-wider",
								children: "Operação Ativa"
							}), /* @__PURE__ */ jsx("h3", {
								className: "text-xl font-bold text-white",
								children: "Gestão Completa de Leads e Comissões"
							})] })]
						}), /* @__PURE__ */ jsx("span", {
							className: "px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold w-fit",
							children: "Acesso Total"
						})]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-sm text-white/80 leading-relaxed",
						children: "Promotor 100% ativo! Pode divulgar seu link personalizado, cadastrar candidatos pelo WhatsApp e acompanhar os repasses financeiros no PIX."
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200 flex items-start gap-3",
						children: [/* @__PURE__ */ jsx(IconCircleCheck, { className: "size-5 shrink-0 mt-0.5 text-emerald-400" }), /* @__PURE__ */ jsxs("div", { children: [
							/* @__PURE__ */ jsx("strong", {
								className: "font-semibold block mb-0.5",
								children: "Comportamento do Dock:"
							}),
							"O Dock libera todos os itens operacionais: ",
							/* @__PURE__ */ jsx("strong", {
								className: "text-white",
								children: "Painel"
							}),
							", ",
							/* @__PURE__ */ jsx("strong", {
								className: "text-white",
								children: "Leads"
							}),
							", ",
							/* @__PURE__ */ jsx("strong", {
								className: "text-white",
								children: "Comissões & PIX"
							}),
							", ",
							/* @__PURE__ */ jsx("strong", {
								className: "text-white",
								children: "Treinamento"
							}),
							" e Logout."
						] })]
					})
				]
			})
		},
		{
			title: "4. Acesso Suspenso",
			value: "suspended",
			badge: "Bloqueado",
			content: /* @__PURE__ */ jsxs("div", {
				className: "w-full rounded-2xl border border-rose-500/30 bg-rose-950/20 p-6 backdrop-blur-md space-y-4",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ jsx("div", {
								className: "size-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400",
								children: /* @__PURE__ */ jsx(IconAlertTriangle, { className: "size-5" })
							}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
								className: "text-xs font-semibold text-rose-400 uppercase tracking-wider",
								children: "Segurança & Auditoria"
							}), /* @__PURE__ */ jsx("h3", {
								className: "text-xl font-bold text-white",
								children: "Conta Temporariamente Suspensa"
							})] })]
						}), /* @__PURE__ */ jsx("span", {
							className: "px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-bold w-fit",
							children: "Suspenso"
						})]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-sm text-white/80 leading-relaxed",
						children: "A conta foi pausada preventivamente para conferência de conformidade pedagógica ou regularização cadastral da chave bancária."
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-200 flex items-start gap-3",
						children: [/* @__PURE__ */ jsx(IconAlertTriangle, { className: "size-5 shrink-0 mt-0.5 text-rose-400" }), /* @__PURE__ */ jsxs("div", { children: [
							/* @__PURE__ */ jsx("strong", {
								className: "font-semibold block mb-0.5",
								children: "Comportamento do Dock:"
							}),
							"Todas as ações de captação são desativadas. O Dock exibe ",
							/* @__PURE__ */ jsx("strong", {
								className: "text-white",
								children: "Acesso Suspenso"
							}),
							" em vermelho, Falar com Coordenação e Logout."
						] })]
					})
				]
			})
		}
	], []);
	const poloTabs = useMemo(() => [
		{
			title: "1. Fila Documental",
			value: "pending_validation",
			badge: "5 Pendentes",
			content: /* @__PURE__ */ jsxs("div", {
				className: "w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ jsx("div", {
								className: "size-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400",
								children: /* @__PURE__ */ jsx(IconFileCheck, { className: "size-5" })
							}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
								className: "text-xs font-semibold text-amber-400 uppercase tracking-wider",
								children: "Secretaria do Polo"
							}), /* @__PURE__ */ jsx("h3", {
								className: "text-xl font-bold text-white",
								children: "Conferência de Matrículas e Documentos"
							})] })]
						}), /* @__PURE__ */ jsx("span", {
							className: "px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold w-fit",
							children: "5 Documentos Aguardando"
						})]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-sm text-white/80 leading-relaxed",
						children: "Fila prioritária da secretaria para validação de legibilidade de RG, histórico escolar do Ensino Fundamental e comprovantes de endereço."
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-3",
						children: [/* @__PURE__ */ jsx(IconChecklist, { className: "size-5 shrink-0 mt-0.5 text-amber-400" }), /* @__PURE__ */ jsxs("div", { children: [
							/* @__PURE__ */ jsx("strong", {
								className: "font-semibold block mb-0.5",
								children: "Comportamento do Dock:"
							}),
							"O item ",
							/* @__PURE__ */ jsx("strong", {
								className: "text-white",
								children: "Fila de Conferência"
							}),
							" é ativado com badge de contagem ",
							/* @__PURE__ */ jsx("span", {
								className: "bg-amber-400 text-black px-1.5 py-0.5 rounded-full font-black text-[10px]",
								children: "5"
							}),
							" para o coordenador auditar os anexos."
						] })]
					})
				]
			})
		},
		{
			title: "2. Bancas & Provas",
			value: "pending_exams",
			badge: "2 Agendadas",
			content: /* @__PURE__ */ jsxs("div", {
				className: "w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ jsx("div", {
								className: "size-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400",
								children: /* @__PURE__ */ jsx(IconSchool, { className: "size-5" })
							}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
								className: "text-xs font-semibold text-sky-400 uppercase tracking-wider",
								children: "Banca Examinadora"
							}), /* @__PURE__ */ jsx("h3", {
								className: "text-xl font-bold text-white",
								children: "Agendamento & Aplicação Presencial"
							})] })]
						}), /* @__PURE__ */ jsx("span", {
							className: "px-3 py-1 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 text-xs font-bold w-fit",
							children: "2 Sessões Ativas"
						})]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-sm text-white/80 leading-relaxed",
						children: "Gestão das bancas de provas presenciais no polo credenciado, lançamento de atas de avaliação e confirmação de presença com biometria facial."
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-200 flex items-start gap-3",
						children: [/* @__PURE__ */ jsx(IconSchool, { className: "size-5 shrink-0 mt-0.5 text-sky-400" }), /* @__PURE__ */ jsxs("div", { children: [
							/* @__PURE__ */ jsx("strong", {
								className: "font-semibold block mb-0.5",
								children: "Comportamento do Dock:"
							}),
							"O item ",
							/* @__PURE__ */ jsx("strong", {
								className: "text-white",
								children: "Bancas & Provas"
							}),
							" fica ativo com badge azul ",
							/* @__PURE__ */ jsx("span", {
								className: "bg-sky-500 text-white px-1.5 py-0.5 rounded-full font-black text-[10px]",
								children: "2"
							}),
							"."
						] })]
					})
				]
			})
		},
		{
			title: "3. Entrega de Diplomas",
			value: "ready_diplomas",
			badge: "4 Prontos",
			content: /* @__PURE__ */ jsxs("div", {
				className: "w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ jsx("div", {
								className: "size-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400",
								children: /* @__PURE__ */ jsx(IconAward, { className: "size-5" })
							}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
								className: "text-xs font-semibold text-emerald-400 uppercase tracking-wider",
								children: "Expedição & Retirada"
							}), /* @__PURE__ */ jsx("h3", {
								className: "text-xl font-bold text-white",
								children: "Livro de Registro e Entrega de Diplomas"
							})] })]
						}), /* @__PURE__ */ jsx("span", {
							className: "px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold w-fit",
							children: "4 Diplomas Físicos"
						})]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-sm text-white/80 leading-relaxed",
						children: "Diplomas com selo MEC e publicação oficial prontos para coleta de assinatura do concluinte no livro de registro do polo."
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200 flex items-start gap-3",
						children: [/* @__PURE__ */ jsx(IconAward, { className: "size-5 shrink-0 mt-0.5 text-emerald-400" }), /* @__PURE__ */ jsxs("div", { children: [
							/* @__PURE__ */ jsx("strong", {
								className: "font-semibold block mb-0.5",
								children: "Comportamento do Dock:"
							}),
							"O item ",
							/* @__PURE__ */ jsx("strong", {
								className: "text-white",
								children: "Diplomas Oficiais"
							}),
							" é ativado com badge verde ",
							/* @__PURE__ */ jsx("span", {
								className: "bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-black text-[10px]",
								children: "4"
							}),
							"."
						] })]
					})
				]
			})
		}
	], []);
	return /* @__PURE__ */ jsxs("div", {
		"data-testid": "role-status-tabs-root",
		"data-hydrated": hydrated ? "true" : "false",
		className: "w-full flex flex-col items-center pb-32",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "w-full max-w-4xl px-4 py-4 space-y-4",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--ink)]/80 border border-white/15 backdrop-blur-xl",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ jsx("span", {
						className: "text-xs font-bold uppercase tracking-wider text-white/60",
						children: "Perfil:"
					}), /* @__PURE__ */ jsxs("div", {
						className: "inline-flex rounded-xl bg-white/5 p-1 border border-white/10",
						children: [
							/* @__PURE__ */ jsx("button", {
								type: "button",
								onClick: () => setActiveRole("aluno"),
								className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeRole === "aluno" ? "bg-[var(--blue)] text-white shadow-md" : "text-white/70 hover:text-white"}`,
								children: "🎓 Aluno"
							}),
							/* @__PURE__ */ jsx("button", {
								type: "button",
								onClick: () => setActiveRole("promotor"),
								className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeRole === "promotor" ? "bg-[var(--blue)] text-white shadow-md" : "text-white/70 hover:text-white"}`,
								children: "💼 Promotor"
							}),
							/* @__PURE__ */ jsx("button", {
								type: "button",
								onClick: () => setActiveRole("polo"),
								className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeRole === "polo" ? "bg-[var(--blue)] text-white shadow-md" : "text-white/70 hover:text-white"}`,
								children: "🏫 Polo"
							})
						]
					})]
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ jsx("span", {
						className: "text-xs font-bold uppercase tracking-wider text-white/60",
						children: "Estilo do Dock:"
					}), /* @__PURE__ */ jsxs("div", {
						className: "inline-flex rounded-xl bg-white/5 p-1 border border-white/10",
						children: [/* @__PURE__ */ jsxs("button", {
							type: "button",
							onClick: () => setDockVariant("bottom-bar"),
							className: `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${dockVariant === "bottom-bar" ? "bg-emerald-600 text-white shadow-md" : "text-white/70 hover:text-white"}`,
							children: [/* @__PURE__ */ jsx(IconLayoutNavbar, { className: "size-3.5" }), "Opção 1 (Barra Nativa)"]
						}), /* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: () => setDockVariant("floating"),
							className: `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${dockVariant === "floating" ? "bg-[var(--yellow)] text-black shadow-md" : "text-white/70 hover:text-white"}`,
							children: "Cápsula Flutuante"
						})]
					})]
				})]
			}), /* @__PURE__ */ jsxs("div", {
				className: "w-full",
				children: [
					activeRole === "aluno" && /* @__PURE__ */ jsx(Tabs, {
						tabs: studentTabs,
						value: studentStatus,
						onChange: (newStatus) => setStudentStatus(newStatus),
						ariaLabel: "Etapas e Status do Aluno",
						tablistWrapperClassName: "mb-4"
					}),
					activeRole === "promotor" && /* @__PURE__ */ jsx(Tabs, {
						tabs: promoterTabs,
						value: promoterStatus,
						onChange: (newStatus) => setPromoterStatus(newStatus),
						ariaLabel: "Etapas e Status do Promotor",
						tablistWrapperClassName: "mb-4"
					}),
					activeRole === "polo" && /* @__PURE__ */ jsx(Tabs, {
						tabs: poloTabs,
						value: poloStatus,
						onChange: (newStatus) => setPoloStatus(newStatus),
						ariaLabel: "Etapas e Status do Coordenador do Polo",
						tablistWrapperClassName: "mb-4"
					})
				]
			})]
		}), /* @__PURE__ */ jsx(RoleAdaptiveNavDock, {
			role: activeRole,
			variant: dockVariant,
			studentState: {
				status: studentStatus,
				pendingDocsCount: studentStatus === "awaiting_documents" ? 2 : 0,
				hasPartnerUrl: studentStatus !== "awaiting_documents",
				rgStatus: studentStatus === "awaiting_documents" ? "rejected" : studentStatus === "documents_under_review" ? "under_review" : "approved",
				addressStatus: studentStatus === "awaiting_documents" ? "under_review" : "approved",
				educationStatus: studentStatus === "awaiting_documents" ? "pending" : "approved",
				selfieStatus: studentStatus === "awaiting_documents" ? "pending" : "approved",
				examStatus: studentStatus === "exam_released" ? "under_review" : studentStatus === "veteran" || studentStatus === "awaiting_diploma_issuance" ? "approved" : "pending"
			},
			promoterState: {
				status: promoterStatus,
				newLeadsCount: promoterStatus === "active" ? 3 : 0,
				isCandidate: promoterStatus === "candidate",
				isTrainingBlocked: promoterStatus === "training",
				onboardingStatus: promoterStatus === "candidate" ? "under_review" : "approved",
				pixStatus: promoterStatus === "candidate" ? "rejected" : "approved",
				termsStatus: promoterStatus === "candidate" ? "approved" : "approved"
			},
			poloState: {
				status: poloStatus,
				pendingValidationCount: poloStatus === "pending_validation" ? 5 : 0,
				pendingExamsCount: poloStatus === "pending_exams" ? 2 : 0,
				readyDiplomasCount: poloStatus === "ready_diplomas" ? 4 : 0
			},
			bypassAuth: true
		})]
	});
};
//#endregion
//#region src/pages/tabs-status.astro
var tabs_status_exports = /* @__PURE__ */ __exportAll({
	default: () => $$TabsStatus,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$TabsStatus = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, {
		"title": "Tabs de Status & Floating Dock Adaptativo — Supletivo Brasil",
		"showDock": false,
		"showFooter": false,
		"requireAuth": false
	}, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="w-full flex-1 flex flex-col items-center justify-start p-4 sm:p-6"><div class="text-center space-y-2 py-4 max-w-2xl"><span class="px-3 py-1 bg-brand-yellow/20 text-brand-yellow text-xs font-bold rounded-full uppercase tracking-wider border border-brand-yellow/30">Multi-Role & Multi-Status</span><h1 class="text-2xl sm:text-3xl font-bold font-display text-white">Tabs de Status com Dock Adaptativo</h1><p class="text-sm text-white/70">Para cada role, abas de status canônicos. Para cada status, o Floating Dock / Bottom Bar adapta seus itens, badges, alertas e ações imediatamente.</p><p class="text-xs text-amber-200/80" role="note">Esta página é uma demonstração visual; ela não representa a conta, o status ou os números de nenhum usuário.</p></div>${renderComponent($$result, "RoleStatusTabs", RoleStatusTabs, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/RoleStatusTabs.tsx",
		"client:component-export": "default"
	})}</div>` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/tabs-status.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/tabs-status.astro";
var $$url = "/tabs-status";
//#endregion
//#region \0virtual:astro:page:src/pages/tabs-status@_@astro
var page = () => tabs_status_exports;
//#endregion
export { page };
