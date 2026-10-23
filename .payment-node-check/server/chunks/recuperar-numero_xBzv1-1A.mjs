import { r as __exportAll } from "./rolldown-runtime_BMI-E3GI.mjs";
import { w as createAstro } from "./server_ZN1nPn8N.mjs";
import { t as createComponent } from "./compiler_DJgU_Xlh.mjs";
//#region src/pages/recuperar-numero.astro
var recuperar_numero_exports = /* @__PURE__ */ __exportAll({
	default: () => $$RecuperarNumero,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
createAstro("https://astro.build");
var $$RecuperarNumero = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$RecuperarNumero;
	return Astro.redirect(`/autenticacao/recuperar-numero${Astro.url.search}`, 308);
}, "C:/rep/app.supletivo.net.br/src/pages/recuperar-numero.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/recuperar-numero.astro";
var $$url = "/recuperar-numero";
//#endregion
//#region \0virtual:astro:page:src/pages/recuperar-numero@_@astro
var page = () => recuperar_numero_exports;
//#endregion
export { page };
