globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
import { m as renderTemplate, s as renderComponent } from "./console_CytTTjjb.mjs";
import { c as attr, i as derived } from "./index-server_EAeTh76q.mjs";
import { t as createComponent } from "./compiler_CbNI0N93.mjs";
import { t as $$RootLayout } from "./RootLayout_BZofGHHY.mjs";
//#region src/components/interactive/HubExamsView.svelte
function HubExamsView($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let students = [];
		let loading = true;
		derived(() => students.filter((item) => item.status === "exam_released" || item.status === "exam_scheduled"));
		$$renderer.push(`<section class="w-full max-w-4xl mx-auto flex-1 flex flex-col p-4 sm:p-6 pb-28 space-y-6"${attr("aria-busy", loading)}><div class="border-b border-white/10 pb-4"><span class="text-xs font-semibold text-sky-400 uppercase tracking-wider">Secretaria de Polo</span> <h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display">Provas presenciais</h1> <p class="text-sm text-white/70 mt-2">Esta fila mostra somente alunos que o servidor liberou ou agendou para avaliação.</p></div> `);
		$$renderer.push(`<!--[1--><p class="text-sm text-white/60" role="status">Consultando o servidor…</p>`);
		$$renderer.push(`<!--]--> <button type="button" class="btn w-fit px-4 py-2 text-xs font-bold"${attr("disabled", loading, true)}>Atualizar fila</button></section>`);
	});
}
//#endregion
//#region src/pages/hub/active/exams.astro
var exams_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Exams,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Exams = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Provas presenciais — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${renderComponent($$result, "HubExamsView", HubExamsView, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/HubExamsView.svelte",
		"client:component-export": "default"
	})}` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/hub/active/exams.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/hub/active/exams.astro";
var $$url = "/hub/active/exams";
//#endregion
//#region \0virtual:astro:page:src/pages/hub/active/exams@_@astro
var page = () => exams_exports;
//#endregion
export { page };
