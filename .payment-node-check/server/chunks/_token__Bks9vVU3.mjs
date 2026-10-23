import { r as __exportAll } from "./rolldown-runtime_BMI-E3GI.mjs";
import { d as renderTemplate, f as maybeRenderHead, i as renderComponent, w as createAstro } from "./server_ZN1nPn8N.mjs";
import { t as createComponent } from "./compiler_DJgU_Xlh.mjs";
import { t as $$RootLayout } from "./RootLayout_as4U_EmP.mjs";
import { t as PixCheckout } from "./PixCheckout_D4zNYeDP.mjs";
//#region src/pages/pix/[token].astro
var _token__exports = /* @__PURE__ */ __exportAll({
	default: () => $$Token,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
createAstro("https://astro.build");
var $$Token = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Token;
	const { token } = Astro.params;
	if (!token) return Astro.redirect("/autenticacao/login");
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, {
		"title": "Pague sua matrícula com PIX — Supletivo Brasil",
		"description": "Escaneie o QR Code ou copie o código PIX para concluir sua matrícula."
	}, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="flex flex-1 flex-col items-center justify-center">${renderComponent($$result, "PixCheckout", PixCheckout, {
		"client:load": true,
		"token": token,
		"client:component-hydration": "load",
		"client:component-path": "@/components/interactive/PixCheckout.svelte",
		"client:component-export": "default"
	})}</div>` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/pix/[token].astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/pix/[token].astro";
var $$url = "/pix/[token]";
//#endregion
//#region \0virtual:astro:page:src/pages/pix/[token]@_@astro
var page = () => _token__exports;
//#endregion
export { page };
