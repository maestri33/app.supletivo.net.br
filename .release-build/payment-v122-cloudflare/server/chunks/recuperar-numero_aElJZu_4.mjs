globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
import { O as createAstro } from "./console_CytTTjjb.mjs";
import { t as createComponent } from "./compiler_CbNI0N93.mjs";
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
