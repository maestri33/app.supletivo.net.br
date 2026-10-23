import { r as __exportAll } from "./rolldown-runtime_BMI-E3GI.mjs";
import { d as renderTemplate, f as maybeRenderHead, i as renderComponent } from "./server_ZN1nPn8N.mjs";
import { t as createComponent } from "./compiler_DJgU_Xlh.mjs";
import { t as $$RootLayout } from "./RootLayout_Ccnumr8N.mjs";
import { t as StudentLockedPaywall } from "./StudentLockedPaywall_s0DaLvaM.mjs";
//#region src/pages/student/lead.astro
var lead_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Lead,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Lead = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Aguardando Matrícula — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="w-full flex-1 flex flex-col p-4 sm:p-6 pb-28">${renderComponent($$result, "StudentLockedPaywall", StudentLockedPaywall, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/StudentLockedPaywall.svelte",
		"client:component-export": "default"
	})}</div>` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/student/lead.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/student/lead.astro";
var $$url = "/student/lead";
//#endregion
//#region \0virtual:astro:page:src/pages/student/lead@_@astro
var page = () => lead_exports;
//#endregion
export { page };
