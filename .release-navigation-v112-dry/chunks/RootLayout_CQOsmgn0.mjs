globalThis.process ??= {};
globalThis.process.env ??= {};
import { O as createAstro, _ as addAttribute, c as Fragment, d as renderSlot, g as renderHead, h as maybeRenderHead, m as renderTemplate, s as renderComponent, v as defineScriptVars } from "./console_CytTTjjb.mjs";
import "./index-server_EAeTh76q.mjs";
import { t as createComponent } from "./compiler_CbNI0N93.mjs";
//#region src/lib/session.ts
var KEY = "supletivo.session";
function saveSession(session) {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(KEY, JSON.stringify(session));
}
function getSession() {
	if (typeof window === "undefined") return null;
	const raw = window.localStorage.getItem(KEY);
	if (!raw) {
		try {
			const match = document.cookie.match(/(?:^|;\s*)supletivo\.session=([^;]+)/);
			if (match && match[1]) {
				const decoded = decodeURIComponent(match[1]);
				const parsed = JSON.parse(decoded);
				if (parsed && typeof parsed === "object" && typeof parsed.phone === "string") {
					window.localStorage.setItem(KEY, decoded);
					return parsed;
				}
			}
		} catch {
			return null;
		}
		return null;
	}
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}
function clearLogin() {
	if (typeof window === "undefined") return;
	refreshTokenMemory = null;
	loginCache = {
		raw: null,
		value: null
	};
	window.localStorage.removeItem(LOGIN_KEY);
}
function clearSession() {
	if (typeof window === "undefined") return;
	clearLogin();
	window.localStorage.removeItem(KEY);
	try {
		const secureFlag = typeof location !== "undefined" && location.protocol === "https:" ? ";Secure" : "";
		document.cookie = `${KEY}=;path=/;domain=.supletivo.net.br;max-age=0;SameSite=Lax${secureFlag}`;
		document.cookie = `${KEY}=;path=/;max-age=0;SameSite=Lax${secureFlag}`;
	} catch {}
}
var LOGIN_KEY = "supletivo.login";
/** Fast-path cache do refresh token; hidratado do storage no 1º getRefreshToken pós-reload. */
var refreshTokenMemory = null;
/**
* Raw /auth/login response (roles, token, ...). Shape still settling backend-side.
* O refresh_token é PERSISTIDO junto (mesmo localStorage do access token): sem isso o
* silent-refresh no 1º 401 morria após um reload (memória zerada) e deslogava o aluno.
* O access token já mora aqui, então co-localizar o refresh não muda a postura de segurança.
*/
function saveLogin(payload) {
	if (typeof window === "undefined") return;
	const refresh = payload.refresh_token;
	if (typeof refresh === "string" && refresh.length > 0) refreshTokenMemory = refresh;
	window.localStorage.setItem(LOGIN_KEY, JSON.stringify(payload));
}
function getLogin() {
	if (typeof window === "undefined") return null;
	const raw = window.localStorage.getItem(LOGIN_KEY);
	if (!raw) return null;
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}
var loginCache = {
	raw: null,
	value: null
};
/** Bearer token from the stored login payload, if any. */
function getAccessToken() {
	const token = getLogin()?.access_token;
	return typeof token === "string" && token.length > 0 ? token : null;
}
/**
* Refresh token pro silent-refresh (api.ts). Lê da memória; se vazia (ex.: após reload),
* hidrata do mesmo payload persistido do login — assim o refresh no 1º 401 sobrevive a reload.
*/
function getRefreshToken() {
	if (refreshTokenMemory) return refreshTokenMemory;
	if (typeof window === "undefined") return null;
	const token = getLogin()?.refresh_token;
	if (typeof token === "string" && token.length > 0) {
		refreshTokenMemory = token;
		return token;
	}
	return null;
}
//#endregion
//#region src/lib/config.ts
var API_BASE_URL = typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_BASE_URL || Object.assign({
	"ASSETS_PREFIX": void 0,
	"BASE_URL": "/",
	"DEV": false,
	"MODE": "production",
	"PROD": true,
	"SITE": void 0,
	"SSR": true
}, { PUBLIC: "C:\\Users\\Public" }) && (Object.assign({
	"ASSETS_PREFIX": void 0,
	"BASE_URL": "/",
	"DEV": false,
	"MODE": "production",
	"PROD": true,
	"SITE": void 0,
	"SSR": true
}, { PUBLIC: "C:\\Users\\Public" }).PUBLIC_API_BASE_URL || Object.assign({
	"ASSETS_PREFIX": void 0,
	"BASE_URL": "/",
	"DEV": false,
	"MODE": "production",
	"PROD": true,
	"SITE": void 0,
	"SSR": true
}, { PUBLIC: "C:\\Users\\Public" }).NEXT_PUBLIC_API_BASE_URL) || "";
//#endregion
//#region src/lib/api.ts
var ApiError = class extends Error {
	status;
	/** Section the enrollment state machine expects (from `expected_status`). */
	expectedStatus;
	/** Machine-readable error code (e.g. EDUCATION_GRADE_OUT_OF_RANGE), from `code`. */
	code;
	/** Structured error context (e.g. { min, max } for range errors), from `extra`. */
	extra;
	constructor(message, status, expectedStatus, code, extra) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.expectedStatus = expectedStatus;
		this.code = code;
		this.extra = extra;
	}
};
function getErrorMessage(error) {
	if (error instanceof ApiError) return error.message;
	if (error instanceof Error && error.name === "AbortError") return "Tempo esgotado. Verifique sua conexão e tente novamente.";
	return "Não foi possível conectar. Verifique sua conexão e tente novamente.";
}
/** Retry reads after a transport failure. A rejected fetch cannot prove a mutation was not processed. */
var RETRY_DELAYS_MS = [250, 900];
async function request(path, opts = {}) {
	if ((opts.method ?? (opts.json !== void 0 || opts.file || opts.formData ? "POST" : "GET")) !== "GET") return requestOnce(path, opts);
	for (const delay of RETRY_DELAYS_MS) try {
		return await requestOnce(path, opts);
	} catch (err) {
		if (!(err instanceof TypeError)) throw err;
		await new Promise((resolve) => setTimeout(resolve, delay));
	}
	return await requestOnce(path, opts);
}
async function requestOnce(path, opts = {}) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 12e3);
	try {
		const headers = { Accept: "application/json" };
		let body;
		if (opts.formData) body = opts.formData;
		else if (opts.file) {
			const form = new FormData();
			form.append("file", opts.file);
			body = form;
		} else if (opts.json !== void 0) {
			headers["Content-Type"] = "application/json";
			body = JSON.stringify(opts.json);
		}
		if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
		const res = await fetch(`${API_BASE_URL}${path}`, {
			method: opts.method ?? (body !== void 0 ? "POST" : "GET"),
			headers,
			body,
			signal: controller.signal
		});
		const data = await res.json().catch(() => null);
		if (!res.ok) throw new ApiError(data?.detail ?? `Erro ${res.status}`, res.status, data?.expected_status, data?.code, data?.extra);
		return data;
	} finally {
		clearTimeout(timeout);
	}
}
var refreshPromise = null;
async function refreshAuthTokens() {
	if (!refreshPromise) {
		const refresh = getRefreshToken();
		if (!refresh) throw new ApiError("Sessão expirada. Entre novamente.", 401);
		refreshPromise = request("/api/v1/clients/auth/refresh", { json: { refresh_token: refresh } }).then((tokens) => {
			saveLogin({
				...getLogin(),
				...tokens
			});
			return tokens;
		}).finally(() => {
			refreshPromise = null;
		});
	}
	return refreshPromise;
}
/**
* Authenticated request with silent refresh: on 401, exchanges the refresh_token
* once (POST /auth/refresh) and retries. If refresh also fails, the session is
* cleared so guards send the user back to the funnel start.
* Single-flight mutex eliminates concurrent 401 refresh race conditions.
*/
async function requestAuth(path, opts = {}) {
	const token = getAccessToken();
	if (!token) throw new ApiError("Sessão expirada. Entre novamente.", 401);
	try {
		return await request(path, {
			...opts,
			token
		});
	} catch (error) {
		if (!(error instanceof ApiError) || error.status !== 401) throw error;
		let tokens;
		try {
			tokens = await refreshAuthTokens();
		} catch (failure) {
			if (failure instanceof ApiError && [
				400,
				401,
				403
			].includes(failure.status)) {
				clearSession();
				throw new ApiError("Sessão expirada. Entre novamente.", 401);
			}
			throw failure;
		}
		return await request(path, {
			...opts,
			token: tokens.access_token
		});
	}
}
/**
* Check a phone against the client pipeline. `phone` must be digits-only (10/11).
*
* `ref` is the referring promoter's external_id (`?ref=` on the landing). The backend only
* reads it on the branch that CREATES the account; on an existing user it is ignored, so it
* is always safe to pass through.
*/
function checkPhone(phone, ref) {
	const json = {
		phone,
		auto_capture: false
	};
	if (ref) json.ref = ref;
	return request("/api/v1/clients/auth/check", { json });
}
/** Check or auto-capture a promoter phone. */
function checkCollaboratorPhone(phone, opts = {}) {
	const json = {
		phone,
		contato: phone,
		send_otp: true
	};
	if (opts.cpf) json.cpf = opts.cpf;
	if (opts.hub || opts.ref) json.hub = opts.hub || opts.ref;
	if (opts.email) json.email = opts.email;
	return request("/api/v1/collaborators/auth/check", { json });
}
function whoami() {
	return requestAuth("/api/v1/clients/whoami");
}
function getContract() {
	return requestAuth("/api/v1/clients/contract/current");
}
function getLeadMe() {
	return requestAuth("/api/v1/clients/lead/me");
}
function getStudentMe() {
	return requestAuth("/api/v1/clients/student/me");
}
/** Pendências em aberto do aluno (GET /student/pendencies — open_only). */
function getStudentPendencies() {
	return requestAuth("/api/v1/clients/student/pendencies");
}
/**
* Prefixa um path de mídia RELATIVO do backend com `/media/` (mesma origem — o next.config faz o
* rewrite `/media/*` → upstream Django). null-safe e idempotente (não duplica quando já vier
* absoluto ou já prefixado).
*/
function mediaUrl(path) {
	if (!path) return null;
	if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/media/")) return path;
	return `/media/${path.replace(/^\/+/, "")}`;
}
function getVeteranMe() {
	return requestAuth("/api/v1/clients/veteran/me");
}
function getEnrollmentMe() {
	return requestAuth("/api/v1/clients/enrollment/me");
}
function getEnrollmentRg() {
	return requestAuth("/api/v1/clients/enrollment/documents/rg");
}
/** Titular do comprovante é outra pessoa (`needs_kinship`): informa o parentesco e libera. */
function submitAddressProofKinship(relation) {
	return requestAuth("/api/v1/clients/enrollment/address/proof/kinship", { json: { relation } });
}
/** Echoes the canonical EnrollmentMe — read `status` to route (no /me re-fetch). */
function postEnrollmentEducation(edu) {
	return requestAuth("/api/v1/clients/enrollment/education", { json: edu });
}
function selfieAnalysisStatus(s) {
	return s.analysis_status ?? s.status ?? null;
}
function selfieAnalysisReason(s) {
	return s.analysis_reason ?? s.description ?? null;
}
/** Lê o QR PIX pelo token do link curto. SEM auth — a página é aberta direto do WhatsApp. */
function getPixPage(token) {
	return request(`/api/v1/clients/lead/pix/${encodeURIComponent(token)}`);
}
//#endregion
//#region src/components/interactive/AppHeaderUser.svelte
function AppHeaderUser($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		$$renderer.push(`<div class="flex items-center gap-2">`);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
//#region src/lib/roles.ts
/**
* Normaliza a lista de roles brutas vindas do backend para a lista de ambientes canônicos.
*/
function normalizeUserRoles(backendRoles = []) {
	const envSet = /* @__PURE__ */ new Set();
	for (const rawRole of backendRoles) {
		const role = rawRole.toLowerCase().trim();
		if ([
			"coordinator",
			"hub_coordinator",
			"coordinator_hub",
			"polo",
			"hub"
		].includes(role)) envSet.add("hub");
		else if ([
			"candidate",
			"promoter",
			"training",
			"promotor"
		].includes(role)) envSet.add("promoter");
		else if ([
			"lead",
			"enrollment",
			"student",
			"veteran",
			"aluno"
		].includes(role)) envSet.add("student");
	}
	return [
		"student",
		"promoter",
		"hub"
	].filter((env) => envSet.has(env));
}
/** A missing backend state never grants an environment or successful status. */
function getRoleDestination(identity, requestedRole) {
	const environments = normalizeUserRoles(identity.roles);
	const role = requestedRole ?? (environments.includes("hub") ? "hub" : environments.includes("promoter") ? "promoter" : environments[0]);
	if (!role) return identity.roles.some((value) => [
		"admin",
		"staff",
		"superuser"
	].includes(value)) ? "https://admin.supletivo.net.br/" : null;
	if (!environments.includes(role)) return null;
	const status = identity.role_statuses?.[role];
	return status ? {
		student: {
			lead: "/student/lead/payment",
			enrollment: "/student/enrollment",
			active: "/student/active/dashboard",
			veteran: "/student/veteran/dashboard"
		},
		promoter: {
			candidate: "/promoter/candidate",
			training: "/promoter/training",
			active: "/promoter/active",
			suspended: "/promoter/suspended"
		},
		hub: {
			active: "/hub/active",
			review: "/hub/review"
		}
	}[role][status] ?? null : null;
}
//#endregion
//#region src/components/interactive/RoleTabsHeader.svelte
function RoleTabsHeader($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region src/components/layout/AppHeader.astro
createAstro("https://astro.build");
var $$AppHeader = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$AppHeader;
	const { appName = "Supletivo", brandColor } = Astro.props;
	return renderTemplate`${maybeRenderHead($$result)}<header class="sticky top-0 z-30 flex justify-center border-b border-white/10 bg-brand-ink/35 pt-[env(safe-area-inset-top)] backdrop-blur-xl"><div class="flex w-full max-w-5xl items-center justify-between gap-3 px-4 sm:px-6 py-2.5"><div class="flex items-center gap-2"><span class="flex gap-1" aria-hidden="true"><span class="size-2 rounded-full bg-brand-green"></span><span class="size-2 rounded-full bg-brand-yellow"></span><span class="size-2 rounded-full bg-brand-blue-bright"></span></span><a href="/" class="text-sm font-extrabold tracking-tight text-white hover:opacity-90 transition-opacity">${appName === "Supletivo" ? renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`Supletivo${" "}<span${addAttribute(brandColor ? void 0 : "text-brand-green-light", "class")}${addAttribute(brandColor ? `color: ${brandColor};` : void 0, "style")}>Brasil</span>` })}` : appName}</a></div><!-- Abas de Roles Superiores --><div class="flex items-center justify-center">${renderComponent($$result, "RoleTabsHeader", RoleTabsHeader, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/RoleTabsHeader.svelte",
		"client:component-export": "default"
	})}</div><div class="flex items-center gap-2">${renderComponent($$result, "AppHeaderUser", AppHeaderUser, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/AppHeaderUser.svelte",
		"client:component-export": "default"
	})}</div></div></header>`;
}, "C:/rep/app.supletivo.net.br/src/components/layout/AppHeader.astro", void 0);
var package_default = {
	name: "app.supletivo.net.br",
	version: "0.0.0-sandbox.112",
	"private": true,
	type: "module",
	scripts: {
		"dev": "astro dev --port 3020",
		"build": "astro build",
		"start": "node ./dist/server/entry.mjs",
		"preview": "astro preview --port 3020",
		"check": "astro check",
		"sync": "astro sync",
		"lint": "eslint",
		"check-types": "tsc --noEmit",
		"test:unit": "node --experimental-strip-types --test test/typesafe-test.ts tests/unit/rg-capture.test.ts tests/unit/address-proof.test.ts tests/unit/camera-session.test.ts",
		"test:e2e": "playwright test",
		"test:e2e:headed": "playwright test --headed",
		"checkpoint": "sh scripts/checkpoint/checkpoint.sh",
		"checkpoint:fast": "pwsh scripts/checkpoint/checkpoint.ps1 -Tier fast",
		"checkpoint:agent": "pwsh scripts/checkpoint/checkpoint.ps1 -Tier agent"
	},
	dependencies: {
		"@astrojs/cloudflare": "^14.3.2",
		"@astrojs/node": "^11.1.5",
		"@astrojs/react": "^6.0.6",
		"@astrojs/svelte": "^9.0.1",
		"@tabler/icons-react": "^3.46.0",
		"@tailwindcss/vite": "^4.3.3",
		"astro": "^7.3.2",
		"clsx": "^2.1.1",
		"motion": "^13.1.1",
		"postgres": "^3.4.9",
		"react": "19.2.4",
		"react-dom": "19.2.4",
		"svelte": "^5.57.0",
		"tailwind-merge": "^3.6.0",
		"zod": "^4.4.3"
	},
	devDependencies: {
		"@astrojs/check": "^0.9.10",
		"@fontsource/archivo-black": "^5.2.8",
		"@fontsource/inter": "^5.2.8",
		"@playwright/test": "^1.61.1",
		"@tailwindcss/postcss": "^4",
		"@types/node": "^20",
		"@types/react": "^19",
		"@types/react-dom": "^19",
		"eslint": "^9",
		"eslint-config-next": "16.3.1",
		"next": "^16.3.1",
		"tailwindcss": "^4",
		"typescript": "^5"
	}
};
//#endregion
//#region src/components/layout/SiteFooter.astro
var $$SiteFooter = createComponent(($$result, $$props, $$slots) => {
	const year = (/* @__PURE__ */ new Date()).getFullYear();
	const version = package_default.version;
	return renderTemplate`${maybeRenderHead($$result)}<footer class="relative border-t border-white/10 shadow-[var(--shadow-glass)] pb-[env(safe-area-inset-bottom)] bg-brand-ink/40 backdrop-blur-xl"><div class="h-[2px] w-full bg-gradient-to-r from-brand-green via-brand-yellow to-brand-blue-bright"></div><div class="mx-auto w-full max-w-3xl px-4 py-1.5"><nav aria-label="Links institucionais do rodapé" class="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-xs leading-tight text-white/80"><span class="flex items-center gap-1 font-extrabold text-white">Supletivo <span class="text-emerald-400">Brasil</span></span><span class="text-white/40 select-none">·</span><span class="text-white font-medium">CNPJ 48.811.016/0001-00</span><span class="text-white/40 select-none">·</span><a href="mailto:contato@supletivo.net.br" class="text-white underline underline-offset-2 transition hover:text-emerald-400">contato@supletivo.net.br</a><span class="text-white/40 select-none">·</span><a href="https://supletivo.net.br/termos/" target="_blank" rel="noopener noreferrer" class="inline-flex items-center font-semibold text-emerald-400 underline underline-offset-2 transition hover:text-emerald-300">Termos</a><span class="text-white/40 select-none">·</span><a href="https://supletivo.net.br/privacidade/" target="_blank" rel="noopener noreferrer" class="inline-flex items-center font-semibold text-emerald-400 underline underline-offset-2 transition hover:text-emerald-300">Privacidade</a><span class="text-white/40 select-none">·</span><span class="text-white/60">© ${year}</span><span class="text-white/40 select-none">·</span><span class="font-mono text-[10px] text-white/30 select-none tracking-tight hover:text-white/50 transition-colors" title="Versão da plataforma (version.v7m.live)">v${version}</span></nav><div class="mt-1 flex flex-wrap items-center justify-center gap-2"><p class="text-center text-[11px] leading-snug text-white/70">Certificação por instituição credenciada ao MEC (Lei nº 9.394/96 — LDB). Dados tratados conforme a LGPD.</p></div></div></footer>`;
}, "C:/rep/app.supletivo.net.br/src/components/layout/SiteFooter.astro", void 0);
//#endregion
//#region src/components/interactive/RoleRouteGuard.svelte
function RoleRouteGuard($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { pathname } = $$props;
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region src/layouts/RootLayout.astro
createAstro("https://astro.build");
var $$RootLayout = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$RootLayout;
	const { title = "Supletivo Brasil — conclua seus estudos", description = "Conclua o Ensino Fundamental ou Médio pelo Supletivo Brasil. Matrícula rápida e 100% online.", showDock, showFooter = true, requireAuth } = Astro.props;
	const pathname = Astro.url.pathname.replace(/\/+$/, "") || "/";
	const isPublicAuthRoute = pathname === "/" || pathname.startsWith("/autenticacao") || pathname.startsWith("/pix") || pathname.startsWith("/tabs-");
	const isTriageIndexRoute = pathname === "/student" || pathname === "/promoter" || pathname === "/hub";
	const shouldRenderDock = showDock ?? !isPublicAuthRoute;
	const shouldGuardAuth = requireAuth !== void 0 ? requireAuth : !isPublicAuthRoute && !isTriageIndexRoute;
	const shouldGuardRole = shouldGuardAuth && /^\/(student|promoter|hub)\//.test(pathname);
	let initialRole = "student";
	if (pathname.startsWith("/promoter") || pathname.startsWith("/promotor")) initialRole = "promoter";
	else if (pathname.startsWith("/hub") || pathname.startsWith("/polo")) initialRole = "hub";
	const authRedirectTarget = initialRole === "promoter" ? "/?role=promoter" : "/";
	return renderTemplate`<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="theme-color" content="#002776" media="(prefers-color-scheme: light)"><meta name="theme-color" content="#0b1220" media="(prefers-color-scheme: dark)"><!-- Fontes críticas pré-carregadas (elimina FOIT/FOUT) --><link rel="preload" href="/fonts/archivo-black-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/fonts/inter-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin><meta name="application-name" content="Supletivo Brasil"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><link rel="icon" type="image/svg+xml" href="/icon.svg"><link rel="icon" href="/favicon.ico"><title>${title}</title><meta name="description"${addAttribute(description, "content")}>${shouldGuardRole && renderTemplate`<script>document.documentElement.dataset.roleAccess = 'pending';<\/script>`}${shouldGuardAuth && renderTemplate`<script>(function(){${defineScriptVars({ authRedirectTarget })}
        try {
          const raw = localStorage.getItem("supletivo.login");
          if (!raw) {
            window.location.replace(authRedirectTarget);
          } else {
            const session = JSON.parse(raw);
            if (!session || !session.access_token) {
              window.location.replace(authRedirectTarget);
            }
          }
        } catch (e) {
          window.location.replace(authRedirectTarget);
        }
      })();<\/script>`}${renderHead($$result)}</head><body${addAttribute(["flex min-h-dvh flex-col overflow-x-hidden bg-brand-bg text-brand-ink", shouldRenderDock && "app-shell"], "class:list")}${addAttribute(shouldRenderDock ? "true" : void 0, "data-app-shell")}><a href="#conteudo" class="sr-only rounded-lg focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:bg-brand-ink focus:px-4 focus:py-2 focus:font-bold focus:text-white">Pular para o conteúdo</a><!-- Aurora Background Zero-JS --><div class="aurora-wrap" aria-hidden="true"><div class="aurora-layer"></div></div><!-- App Header -->${renderComponent($$result, "AppHeader", $$AppHeader, {})}${shouldGuardRole && renderTemplate`${renderComponent($$result, "RoleRouteGuard", RoleRouteGuard, {
		"client:load": true,
		"pathname": pathname,
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/RoleRouteGuard.svelte",
		"client:component-export": "default"
	})}`}<!-- Conteúdo principal rolável da aplicação --><main id="conteudo"${addAttribute(["app-scroll flex-1 w-full", shouldRenderDock && "pb-[calc(env(safe-area-inset-bottom)+5.5rem)]"], "class:list")}>${renderSlot($$result, $$slots["default"])}</main><!-- Navegação Adaptativa Global (Dock Flutuante) -->${shouldRenderDock && renderTemplate`${renderComponent($$result, "RoleAdaptiveNavDock", null, {
		"client:only": "react",
		"initialRole": initialRole,
		"currentPath": pathname,
		"client:component-hydration": "only",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/RoleAdaptiveNavDock.tsx",
		"client:component-export": "default"
	})}`}<!-- Rodapé institucional Zero-JS (suprimido quando há dock ativo para evitar colisão) -->${showFooter && !shouldRenderDock && renderTemplate`${renderComponent($$result, "SiteFooter", $$SiteFooter, {})}`}</body></html>`;
}, "C:/rep/app.supletivo.net.br/src/layouts/RootLayout.astro", void 0);
//#endregion
export { clearSession as C, saveLogin as D, getSession as E, saveSession as O, clearLogin as S, getLogin as T, requestAuth as _, checkPhone as a, submitAddressProofKinship as b, getEnrollmentRg as c, getPixPage as d, getStudentMe as f, postEnrollmentEducation as g, mediaUrl as h, checkCollaboratorPhone as i, getErrorMessage as l, getVeteranMe as m, getRoleDestination as n, getContract as o, getStudentPendencies as p, ApiError as r, getEnrollmentMe as s, $$RootLayout as t, getLeadMe as u, selfieAnalysisReason as v, getAccessToken as w, whoami as x, selfieAnalysisStatus as y };
