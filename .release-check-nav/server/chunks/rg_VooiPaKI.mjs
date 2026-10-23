globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
import { h as maybeRenderHead, m as renderTemplate, s as renderComponent } from "./console_CytTTjjb.mjs";
import { c as attr, i as derived, l as clsx, t as attr_class, u as escape_html } from "./index-server_EAeTh76q.mjs";
import { t as createComponent } from "./compiler_CbNI0N93.mjs";
import { t as $$RootLayout } from "./RootLayout_C3LAw_3K.mjs";
import "./private-media_DOJYdtck.mjs";
import "./workflow_ZE_Fb8ln.mjs";
import { n as createRgCaptureState, r as deriveRgCapture } from "./rg-capture_1Ixp7K4_.mjs";
import { n as CameraIcon, t as UploadFileIcon } from "./UploadFileIcon_3gvIkuqC.mjs";
import "./poll_DXPdBFXJ.mjs";
//#region src/components/icons/IdCardIcon.svelte
function IdCardIcon($$renderer, $$props) {
	let { class: className = "size-6 text-white" } = $$props;
	$$renderer.push(`<svg${attr_class(clsx(className))} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></rect><rect x="4.5" y="7" width="5.5" height="6.5" rx="1" stroke="currentColor" stroke-width="1.4" fill="rgba(255, 255, 255, 0.08)"></rect><circle cx="7.25" cy="9.25" r="1.25" fill="currentColor" opacity="0.8"></circle><path d="M5.5 13c0-1 .8-1.5 1.75-1.5s1.75.5 1.75 1.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path><path d="M12.5 8h6M12.5 11h6M12.5 14h4M5 16.5h14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" opacity="0.75"></path></svg>`);
}
//#endregion
//#region src/components/interactive/StudentRgEnrollmentView.svelte
function StudentRgEnrollmentView($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let capture = createRgCaptureState();
		const view = derived(() => deriveRgCapture(capture));
		let uploading = false;
		let consulting = false;
		let nextPath = null;
		const busy = derived(() => uploading);
		const canCapture = derived(() => false);
		derived(() => view().nextSlot === "back" ? "Agora, envie o verso" : view().nextSlot === "front" && view().received.back ? "Agora, envie a frente" : view().error ? "Envie uma nova imagem do RG" : "Envie seu RG");
		derived(() => view().nextSlot === "back" ? "A frente já foi recebida. Falta o outro lado." : view().nextSlot === "front" && view().received.back ? "O verso já foi recebido. Falta o outro lado." : "Pode começar por qualquer lado. Frente e verso na mesma imagem também valem.");
		$$renderer.push(`<section class="rg-flow svelte-19lslv6" aria-labelledby="rg-title"><header class="svelte-19lslv6"><p class="eyebrow svelte-19lslv6">Matrícula · Documento de identidade</p> <h1 id="rg-title" class="svelte-19lslv6">Seu RG</h1> <p class="svelte-19lslv6">Envie o documento. Nós identificamos os lados e preenchemos seus dados.</p></header> <div${attr_class("capture-panel svelte-19lslv6", void 0, {
			"awaiting": !view().error && (view().received.front || view().received.back || view().received.full) && view().phase !== "approved",
			"approved": view().phase === "approved"
		})}${attr("aria-busy", busy() || consulting)}>`);
		if (view().error) $$renderer.push(`<!--[0--><p class="feedback error svelte-19lslv6" role="alert">${escape_html(view().error)}</p>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push(`<!--[0--><div class="state-message svelte-19lslv6" role="status">`);
		IdCardIcon($$renderer, { class: "document-icon" });
		$$renderer.push(`<!----><h2 class="svelte-19lslv6">Consultando seu RG</h2><p class="svelte-19lslv6">Verificando se já existe um arquivo recebido.</p></div>`);
		$$renderer.push(`<!--]--> `);
		if (view().received.front || view().received.back || view().received.full) {
			$$renderer.push(`<!--[0--><p class="receipt svelte-19lslv6" role="status">${escape_html(view().received.full ? "✓ Frente e verso recebidos no mesmo arquivo" : view().received.front && view().received.back ? "✓ Frente e verso recebidos" : view().received.front ? "✓ Frente recebida" : "✓ Verso recebido")} `);
			if (canCapture() && !view().error && !view().received.full) $$renderer.push(`<!--[0--><span class="svelte-19lslv6">A análise dos dados continua enquanto você envia o outro lado.</span>`);
			else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></p>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (view().phase === "approved" && nextPath);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push(`<!--[0--><button type="button" class="secondary svelte-19lslv6"${attr("disabled", busy(), true)}>${escape_html("Consultar análise")}</button>`);
		$$renderer.push(`<!--]--> `);
		if (!view().complete && false);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div> `);
		if (view().phase === "approved" && void 0);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <p class="photo-help svelte-19lslv6">Deixe as quatro bordas visíveis, com boa luz e sem reflexos.</p></section> <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden="" aria-label="Fotografar RG"/> <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" hidden="" aria-label="Selecionar arquivo do RG"/> <dialog class="source-dialog svelte-19lslv6" aria-labelledby="source-title"><h2 id="source-title" class="svelte-19lslv6">Como quer enviar o RG?</h2><p class="svelte-19lslv6">Uma foto, uma imagem com os dois lados ou um PDF.</p> <button type="button" class="btn source-action svelte-19lslv6">`);
		CameraIcon($$renderer, { class: "action-icon" });
		$$renderer.push(`<!----> Tirar foto</button> <button type="button" class="secondary source-action svelte-19lslv6">`);
		UploadFileIcon($$renderer, { class: "action-icon" });
		$$renderer.push(`<!----> Escolher arquivo</button> <button type="button" class="secondary cancel svelte-19lslv6">Cancelar</button></dialog>`);
	});
}
//#endregion
//#region src/pages/student/enrollment/rg.astro
var rg_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Rg,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Rg = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Envio do RG — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="w-full max-w-2xl mx-auto flex-1 p-4 sm:p-6 pb-28">${renderComponent($$result, "StudentRgEnrollmentView", StudentRgEnrollmentView, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/StudentRgEnrollmentView.svelte",
		"client:component-export": "default"
	})}</div>` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/student/enrollment/rg.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/student/enrollment/rg.astro";
var $$url = "/student/enrollment/rg";
//#endregion
//#region \0virtual:astro:page:src/pages/student/enrollment/rg@_@astro
var page = () => rg_exports;
//#endregion
export { page };
