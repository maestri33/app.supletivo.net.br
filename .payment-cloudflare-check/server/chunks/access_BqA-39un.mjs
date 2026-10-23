globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
import { m as renderTemplate, s as renderComponent } from "./console_CytTTjjb.mjs";
import { t as createComponent } from "./compiler_CbNI0N93.mjs";
import { t as $$RootLayout } from "./RootLayout_BZofGHHY.mjs";
import { t as StudentActiveView } from "./StudentActiveView_Du0CPpFM.mjs";
//#region src/pages/student/active/access.astro
var access_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Access,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Access = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Acesso à plataforma parceira — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${renderComponent($$result, "StudentActiveView", StudentActiveView, {
		"client:load": true,
		"view": "access",
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/student/StudentActiveView.svelte",
		"client:component-export": "default"
	})}` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/student/active/access.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/student/active/access.astro";
var $$url = "/student/active/access";
//#endregion
//#region \0virtual:astro:page:src/pages/student/active/access@_@astro
var page = () => access_exports;
//#endregion
export { page };
