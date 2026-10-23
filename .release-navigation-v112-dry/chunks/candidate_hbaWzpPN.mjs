globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
import { h as maybeRenderHead, m as renderTemplate, s as renderComponent } from "./console_CytTTjjb.mjs";
import { t as createComponent } from "./compiler_CbNI0N93.mjs";
import { t as $$RootLayout } from "./RootLayout_CQOsmgn0.mjs";
import { t as PromoterCandidateView } from "./PromoterCandidateView_DbbXc5G5.mjs";
//#region src/pages/promoter/candidate.astro
var candidate_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Candidate,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Candidate = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Credenciamento de Promotor — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="w-full flex-1 flex flex-col p-4 sm:p-6 pb-28">${renderComponent($$result, "PromoterCandidateView", PromoterCandidateView, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/PromoterCandidateView.svelte",
		"client:component-export": "default"
	})}</div>` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/promoter/candidate.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/promoter/candidate.astro";
var $$url = "/promoter/candidate";
//#endregion
//#region \0virtual:astro:page:src/pages/promoter/candidate@_@astro
var page = () => candidate_exports;
//#endregion
export { page };
