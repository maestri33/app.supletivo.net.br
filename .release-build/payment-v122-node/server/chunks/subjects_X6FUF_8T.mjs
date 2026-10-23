import { r as __exportAll } from "./rolldown-runtime_BMI-E3GI.mjs";
import { w as createAstro } from "./server_ZN1nPn8N.mjs";
import { t as createComponent } from "./compiler_DJgU_Xlh.mjs";
//#region src/pages/student/active/subjects.astro
var subjects_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Subjects,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
createAstro("https://astro.build");
var $$Subjects = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Subjects;
	return Astro.redirect("/student/active/access", 308);
}, "C:/rep/app.supletivo.net.br/src/pages/student/active/subjects.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/student/active/subjects.astro";
var $$url = "/student/active/subjects";
//#endregion
//#region \0virtual:astro:page:src/pages/student/active/subjects@_@astro
var page = () => subjects_exports;
//#endregion
export { page };
