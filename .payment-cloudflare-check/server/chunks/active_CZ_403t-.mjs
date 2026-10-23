globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
import { h as maybeRenderHead, m as renderTemplate, s as renderComponent } from "./console_CytTTjjb.mjs";
import { t as createComponent } from "./compiler_CbNI0N93.mjs";
import { t as $$RootLayout } from "./RootLayout_BZofGHHY.mjs";
import { t as HubActiveView } from "./HubActiveView_BO6KU7C-.mjs";
//#region src/pages/hub/active.astro
var active_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Active,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Active = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Secretaria de Polo — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="w-full flex-1 flex flex-col p-4 sm:p-6 pb-28">${renderComponent($$result, "HubActiveView", HubActiveView, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/HubActiveView.svelte",
		"client:component-export": "default"
	})}</div>` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/hub/active.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/hub/active.astro";
var $$url = "/hub/active";
//#endregion
//#region \0virtual:astro:page:src/pages/hub/active@_@astro
var page = () => active_exports;
//#endregion
export { page };
