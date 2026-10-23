globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
import { h as maybeRenderHead, m as renderTemplate, s as renderComponent } from "./console_CytTTjjb.mjs";
import "./index-server_EAeTh76q.mjs";
import { t as createComponent } from "./compiler_CbNI0N93.mjs";
import { t as $$RootLayout } from "./RootLayout_CoEJrvu4.mjs";
import "./private-media_C7SKYpJ8.mjs";
//#region src/components/interactive/PromoterDocumentArchive.svelte
function PromoterDocumentArchive($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		$$renderer.push(`<section class="document-archive svelte-1yqx9tc"><header class="svelte-1yqx9tc"><h1 class="svelte-1yqx9tc">Meus documentos</h1><p class="svelte-1yqx9tc">Consulte os documentos enviados no seu credenciamento e o registro da assinatura.</p></header> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push(`<!--[0--><p role="status" class="svelte-1yqx9tc">Consultando seus documentos…</p>`);
		$$renderer.push(`<!--]--></section>`);
	});
}
//#endregion
//#region src/pages/promoter/active/documents.astro
var documents_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Documents,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Documents = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Meus documentos — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="w-full flex-1 p-4 sm:p-6 pb-28">${renderComponent($$result, "PromoterDocumentArchive", PromoterDocumentArchive, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/PromoterDocumentArchive.svelte",
		"client:component-export": "default"
	})}</div>` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/promoter/active/documents.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/promoter/active/documents.astro";
var $$url = "/promoter/active/documents";
//#endregion
//#region \0virtual:astro:page:src/pages/promoter/active/documents@_@astro
var page = () => documents_exports;
//#endregion
export { page };
