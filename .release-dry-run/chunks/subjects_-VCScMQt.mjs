globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
import { m as renderTemplate, s as renderComponent } from "./console_CytTTjjb.mjs";
import { t as createComponent } from "./compiler_CbNI0N93.mjs";
import { t as $$RootLayout } from "./RootLayout_DKEwq1JF.mjs";
import { t as StudentActiveView } from "./StudentActiveView_BksqvMC8.mjs";
//#region src/pages/student/active/subjects.astro
var subjects_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Subjects,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Subjects = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Ambiente do parceiro — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${renderComponent($$result, "StudentActiveView", StudentActiveView, {
		"client:load": true,
		"view": "subjects",
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/student/StudentActiveView.svelte",
		"client:component-export": "default"
	})}` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/student/active/subjects.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/student/active/subjects.astro";
var $$url = "/student/active/subjects";
//#endregion
//#region \0virtual:astro:page:src/pages/student/active/subjects@_@astro
var page = () => subjects_exports;
//#endregion
export { page };
