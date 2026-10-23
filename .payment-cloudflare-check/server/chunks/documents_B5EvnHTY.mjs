globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
import { m as renderTemplate, s as renderComponent } from "./console_CytTTjjb.mjs";
import { t as createComponent } from "./compiler_CbNI0N93.mjs";
import { t as $$RootLayout } from "./RootLayout_BZofGHHY.mjs";
import { t as StudentActiveView } from "./StudentActiveView_Du0CPpFM.mjs";
//#region src/pages/student/active/documents.astro
var documents_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Documents,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Documents = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Documentos do aluno — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${renderComponent($$result, "StudentActiveView", StudentActiveView, {
		"client:load": true,
		"view": "documents",
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/student/StudentActiveView.svelte",
		"client:component-export": "default"
	})}` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/student/active/documents.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/student/active/documents.astro";
var $$url = "/student/active/documents";
//#endregion
//#region \0virtual:astro:page:src/pages/student/active/documents@_@astro
var page = () => documents_exports;
//#endregion
export { page };
