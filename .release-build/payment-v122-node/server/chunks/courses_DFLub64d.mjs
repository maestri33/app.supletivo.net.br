import { r as __exportAll } from "./rolldown-runtime_BMI-E3GI.mjs";
import { d as renderTemplate, f as maybeRenderHead, i as renderComponent } from "./server_ZN1nPn8N.mjs";
import { t as createComponent } from "./compiler_DJgU_Xlh.mjs";
import { t as $$RootLayout } from "./RootLayout_Ccnumr8N.mjs";
import { t as PromoterTrainingView } from "./PromoterTrainingView_BKfqE17R.mjs";
//#region src/pages/promoter/training/courses.astro
var courses_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Courses,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Courses = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Capacitação Obrigatória — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="w-full flex-1 flex flex-col p-4 sm:p-6 pb-28">${renderComponent($$result, "PromoterTrainingView", PromoterTrainingView, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/PromoterTrainingView.svelte",
		"client:component-export": "default"
	})}</div>` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/promoter/training/courses.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/promoter/training/courses.astro";
var $$url = "/promoter/training/courses";
//#endregion
//#region \0virtual:astro:page:src/pages/promoter/training/courses@_@astro
var page = () => courses_exports;
//#endregion
export { page };
