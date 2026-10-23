import { r as __exportAll } from "./rolldown-runtime_BMI-E3GI.mjs";
import { d as renderTemplate, f as maybeRenderHead, i as renderComponent } from "./server_ZN1nPn8N.mjs";
import { t as createComponent } from "./compiler_DJgU_Xlh.mjs";
import { t as $$RootLayout } from "./RootLayout_Ccnumr8N.mjs";
import { t as PromoterCommissionsView } from "./PromoterCommissionsView_SunKaqjj.mjs";
//#region src/pages/promoter/comissoes.astro
var comissoes_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Comissoes,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Comissoes = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Comissões & Extrato PIX — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="w-full flex-1 flex flex-col p-4 sm:p-6 pb-28">${renderComponent($$result, "PromoterCommissionsView", PromoterCommissionsView, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/PromoterCommissionsView.svelte",
		"client:component-export": "default"
	})}</div>` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/promoter/comissoes.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/promoter/comissoes.astro";
var $$url = "/promoter/comissoes";
//#endregion
//#region \0virtual:astro:page:src/pages/promoter/comissoes@_@astro
var page = () => comissoes_exports;
//#endregion
export { page };
