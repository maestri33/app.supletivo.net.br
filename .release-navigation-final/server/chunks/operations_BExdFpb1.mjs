globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
import { m as renderTemplate, s as renderComponent } from "./console_CytTTjjb.mjs";
import { a as ensure_array_like, c as attr, i as derived, u as escape_html } from "./index-server_EAeTh76q.mjs";
import { t as createComponent } from "./compiler_CbNI0N93.mjs";
import { t as $$RootLayout } from "./RootLayout_CoEJrvu4.mjs";
import "./private-media_C7SKYpJ8.mjs";
import { t as STUDENT_STATUS_LABELS } from "./workflow_BFLixNjv.mjs";
/* empty css                   */
//#region src/lib/hub.ts
var ENROLLMENT_STATUS_LABELS = {
	rg: "Documento de identidade",
	address: "Endereço",
	education: "Escolaridade",
	selfie: "Selfie de assinatura",
	awaiting_release: "Aguardando liberação",
	fee_paid: "Primeira taxa paga",
	fee_scheduled: "Segunda taxa programada",
	completed: "Matrícula concluída"
};
//#endregion
//#region src/components/interactive/HubOperationsView.svelte
function HubOperationsView($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let rows = [];
		let loading = true;
		let selectedId = "";
		let enrollment = null;
		let student = null;
		derived(() => "");
		derived(() => []);
		derived(() => student);
		derived(() => enrollment);
		derived(() => {
			return [];
		});
		function label(value) {
			return STUDENT_STATUS_LABELS[value] ?? ENROLLMENT_STATUS_LABELS[value] ?? value;
		}
		$$renderer.push(`<div class="student-workflow"${attr("aria-busy", loading)}><header class="stack"><h1>Alunos do polo</h1><p class="muted">Matrículas, documentação, provas e entrega de diploma.</p></header> <div class="choices" aria-label="Tipo de processo"><button class="choice"${attr("aria-pressed", true)}${attr("disabled", loading, true)}>Matrículas</button> <button class="choice"${attr("aria-pressed", false)}${attr("disabled", loading, true)}>Alunos</button> <button class="choice"${attr("aria-pressed", false)}${attr("disabled", loading, true)}>Candidatos</button></div> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <button class="secondary"${attr("disabled", loading, true)}>Atualizar situação</button> <a class="secondary" href="/hub/review">Fila de revisões</a> `);
		$$renderer.push(`<!--[0--><p role="status">Consultando alunos...</p>`);
		$$renderer.push(`<!--]--> <section class="panel" aria-label="Lista de alunos"><h2>${escape_html("Matrículas")}</h2> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <!--[-->`);
		const each_array = ensure_array_like(rows);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let row = each_array[$$index];
			$$renderer.push(`<button class="secondary process-row svelte-v4bx1j"${attr("disabled", loading, true)}${attr("aria-pressed", selectedId === row.external_id)}><span>${escape_html(row.name || "Nome não informado")}<small class="svelte-v4bx1j">${escape_html(row.phone || row.external_id)}</small></span><span>${escape_html(label(row.status))}</span></button>`);
		}
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></section> `);
		$$renderer.push("<!--[-1-->");
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
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
//#region src/pages/hub/active/operations.astro
var operations_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Operations,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Operations = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Alunos do polo — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${renderComponent($$result, "HubOperationsView", HubOperationsView, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/HubOperationsView.svelte",
		"client:component-export": "default"
	})}` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/hub/active/operations.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/hub/active/operations.astro";
var $$url = "/hub/active/operations";
//#endregion
//#region \0virtual:astro:page:src/pages/hub/active/operations@_@astro
var page = () => operations_exports;
//#endregion
export { page };
