import { r as __exportAll } from "./rolldown-runtime_BMI-E3GI.mjs";
import { d as renderTemplate, f as maybeRenderHead, i as renderComponent } from "./server_ZN1nPn8N.mjs";
import { t as createComponent } from "./compiler_DJgU_Xlh.mjs";
import { t as $$RootLayout } from "./RootLayout_Ccnumr8N.mjs";
import { t as PromoterCandidateView } from "./PromoterCandidateView_Byn6JfgN.mjs";
//#region src/pages/promoter/candidate/terms.astro
var terms_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Terms,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Terms = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Termos de Parceria & Divulgação — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="w-full flex-1 p-4 sm:p-6 pb-28">${renderComponent($$result, "PromoterCandidateView", PromoterCandidateView, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/PromoterCandidateView.svelte",
		"client:component-export": "default"
	})}</div>` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/promoter/candidate/terms.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/promoter/candidate/terms.astro";
var $$url = "/promoter/candidate/terms";
//#endregion
//#region \0virtual:astro:page:src/pages/promoter/candidate/terms@_@astro
var page = () => terms_exports;
//#endregion
export { page };
