import { r as __exportAll } from "./rolldown-runtime_BMI-E3GI.mjs";
import { d as renderTemplate, f as maybeRenderHead, i as renderComponent } from "./server_ZN1nPn8N.mjs";
import { t as createComponent } from "./compiler_DJgU_Xlh.mjs";
import { t as $$RootLayout } from "./RootLayout_as4U_EmP.mjs";
import { t as PromoterCandidateView } from "./PromoterCandidateView_DIoWZvTp.mjs";
//#region src/pages/promoter/candidate/pix.astro
var pix_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Pix,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Pix = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Chave PIX de Repasse — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="w-full flex-1 flex flex-col p-4 sm:p-6 pb-28">${renderComponent($$result, "PromoterCandidateView", PromoterCandidateView, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/PromoterCandidateView.svelte",
		"client:component-export": "default"
	})}</div>` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/promoter/candidate/pix.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/promoter/candidate/pix.astro";
var $$url = "/promoter/candidate/pix";
//#endregion
//#region \0virtual:astro:page:src/pages/promoter/candidate/pix@_@astro
var page = () => pix_exports;
//#endregion
export { page };
