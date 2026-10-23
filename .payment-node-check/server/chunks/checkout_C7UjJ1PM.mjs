import { r as __exportAll } from "./rolldown-runtime_BMI-E3GI.mjs";
import { w as createAstro } from "./server_ZN1nPn8N.mjs";
import { t as createComponent } from "./compiler_DJgU_Xlh.mjs";
//#region src/pages/checkout.astro
var checkout_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Checkout,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
createAstro("https://astro.build");
var $$Checkout = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Checkout;
	return Astro.redirect(`https://supletivo.net.br${Astro.url.search}`, 308);
}, "C:/rep/app.supletivo.net.br/src/pages/checkout.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/checkout.astro";
var $$url = "/checkout";
//#endregion
//#region \0virtual:astro:page:src/pages/checkout@_@astro
var page = () => checkout_exports;
//#endregion
export { page };
