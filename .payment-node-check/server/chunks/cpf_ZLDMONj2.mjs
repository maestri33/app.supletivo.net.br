import { r as __exportAll } from "./rolldown-runtime_BMI-E3GI.mjs";
import { w as createAstro } from "./server_ZN1nPn8N.mjs";
import { t as createComponent } from "./compiler_DJgU_Xlh.mjs";
//#region src/pages/cpf.astro
var cpf_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Cpf,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
createAstro("https://astro.build");
var $$Cpf = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Cpf;
	return Astro.redirect(`https://supletivo.net.br${Astro.url.search}`, 308);
}, "C:/rep/app.supletivo.net.br/src/pages/cpf.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/cpf.astro";
var $$url = "/cpf";
//#endregion
//#region \0virtual:astro:page:src/pages/cpf@_@astro
var page = () => cpf_exports;
//#endregion
export { page };
