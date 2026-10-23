import { r as __exportAll } from "./rolldown-runtime_BMI-E3GI.mjs";
import { d as renderTemplate, i as renderComponent } from "./server_ZN1nPn8N.mjs";
import { t as createComponent } from "./compiler_DJgU_Xlh.mjs";
import { t as $$RootLayout } from "./RootLayout_Ccnumr8N.mjs";
import { t as StudentActiveView } from "./StudentActiveView_CufnO7ej.mjs";
//#region src/pages/student/active/assessments.astro
var assessments_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Assessments,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Assessments = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Avaliações — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${renderComponent($$result, "StudentActiveView", StudentActiveView, {
		"client:load": true,
		"view": "assessments",
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/student/StudentActiveView.svelte",
		"client:component-export": "default"
	})}` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/student/active/assessments.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/student/active/assessments.astro";
var $$url = "/student/active/assessments";
//#endregion
//#region \0virtual:astro:page:src/pages/student/active/assessments@_@astro
var page = () => assessments_exports;
//#endregion
export { page };
