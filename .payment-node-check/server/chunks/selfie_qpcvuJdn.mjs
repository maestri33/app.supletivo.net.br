import { r as __exportAll } from "./rolldown-runtime_BMI-E3GI.mjs";
import { d as renderTemplate, i as renderComponent } from "./server_ZN1nPn8N.mjs";
import { c as attr, i as derived } from "./index-server_DvB6aUE6.mjs";
import { t as createComponent } from "./compiler_DJgU_Xlh.mjs";
import { t as $$RootLayout } from "./RootLayout_as4U_EmP.mjs";
import "./workflow_Br-wKspG.mjs";
/* empty css                   */
import "./LiveSelfieCamera_BzsItADZ.mjs";
import "./poll_CWt-BKHJ.mjs";
//#region src/components/interactive/student/StudentSelfieView.svelte
function StudentSelfieView($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let loading = true;
		derived(() => null);
		derived(() => null);
		$$renderer.push(`<section class="student-workflow"${attr("aria-busy", loading)}><h1>Selfie e assinatura da matrícula</h1><p class="muted">Leia o contrato e tire uma foto nítida do seu rosto pela câmera. A foto será usada para confirmar sua identidade e registrar a assinatura.</p> `);
		$$renderer.push(`<!--[0--><p role="status">Consultando assinatura e contrato…</p>`);
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></section>`);
	});
}
//#endregion
//#region src/pages/student/enrollment/selfie.astro
var selfie_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Selfie,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Selfie = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Selfie e assinatura — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${renderComponent($$result, "StudentSelfieView", StudentSelfieView, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/student/StudentSelfieView.svelte",
		"client:component-export": "default"
	})}` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/student/enrollment/selfie.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/student/enrollment/selfie.astro";
var $$url = "/student/enrollment/selfie";
//#endregion
//#region \0virtual:astro:page:src/pages/student/enrollment/selfie@_@astro
var page = () => selfie_exports;
//#endregion
export { page };
