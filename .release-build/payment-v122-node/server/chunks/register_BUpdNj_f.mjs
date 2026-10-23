import { r as __exportAll } from "./rolldown-runtime_BMI-E3GI.mjs";
import { w as createAstro } from "./server_ZN1nPn8N.mjs";
import { t as createComponent } from "./compiler_DJgU_Xlh.mjs";
//#region src/pages/register.astro
var register_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Register,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
createAstro("https://astro.build");
var $$Register = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Register;
	return Astro.redirect(`https://supletivo.net.br${Astro.url.search}`, 308);
}, "C:/rep/app.supletivo.net.br/src/pages/register.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/register.astro";
var $$url = "/register";
//#endregion
//#region \0virtual:astro:page:src/pages/register@_@astro
var page = () => register_exports;
//#endregion
export { page };
