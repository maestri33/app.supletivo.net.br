globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
//#region src/pages/healthz.ts
var healthz_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
function builtAtSaoPaulo() {
	const raw = process.env.BUILD_AT ?? (/* @__PURE__ */ new Date()).toISOString();
	const d = new Date(raw);
	if (Number.isNaN(d.getTime())) return raw;
	return d.toLocaleString("pt-BR", {
		timeZone: "America/Sao_Paulo",
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		timeZoneName: "short"
	});
}
var GET = async () => {
	return new Response(JSON.stringify({
		status: "ok",
		sha: process.env.GIT_SHA ?? "unknown",
		builtAt: builtAtSaoPaulo()
	}), {
		status: 200,
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "no-store"
		}
	});
};
//#endregion
//#region \0virtual:astro:page:src/pages/healthz@_@ts
var page = () => healthz_exports;
//#endregion
export { page };
