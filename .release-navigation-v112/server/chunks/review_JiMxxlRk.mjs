globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
import { h as maybeRenderHead, m as renderTemplate, s as renderComponent } from "./console_CytTTjjb.mjs";
import { t as createComponent } from "./compiler_CbNI0N93.mjs";
import { t as $$RootLayout } from "./RootLayout_CQOsmgn0.mjs";
import { t as HubReviewView } from "./HubReviewView_DkO5mPSS.mjs";
//#region src/pages/hub/review.astro
var review_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Review,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Review = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Fila de Conferência do Polo — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="w-full flex-1 flex flex-col p-4 sm:p-6 pb-28">${renderComponent($$result, "HubReviewView", HubReviewView, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/HubReviewView.svelte",
		"client:component-export": "default"
	})}</div>` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/hub/review.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/hub/review.astro";
var $$url = "/hub/review";
//#endregion
//#region \0virtual:astro:page:src/pages/hub/review@_@astro
var page = () => review_exports;
//#endregion
export { page };
