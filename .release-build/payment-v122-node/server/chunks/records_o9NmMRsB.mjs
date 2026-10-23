import { r as __exportAll } from "./rolldown-runtime_BMI-E3GI.mjs";
import { d as renderTemplate, i as renderComponent } from "./server_ZN1nPn8N.mjs";
import { t as createComponent } from "./compiler_DJgU_Xlh.mjs";
import { t as $$RootLayout } from "./RootLayout_Ccnumr8N.mjs";
import { t as StudentVeteranView } from "./StudentVeteranView_CGYcHjGq.mjs";
//#region src/pages/student/veteran/records.astro
var records_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Records,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Records = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Histórico escolar — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${renderComponent($$result, "StudentVeteranView", StudentVeteranView, {
		"client:load": true,
		"view": "records",
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/student/StudentVeteranView.svelte",
		"client:component-export": "default"
	})}` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/student/veteran/records.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/student/veteran/records.astro";
var $$url = "/student/veteran/records";
//#endregion
//#region \0virtual:astro:page:src/pages/student/veteran/records@_@astro
var page = () => records_exports;
//#endregion
export { page };
