globalThis.process ??= {};
globalThis.process.env ??= {};
import { r as derived, s as attr } from "./index-server_CnxoOwt9.mjs";
import "./RootLayout_DKEwq1JF.mjs";
//#region src/components/interactive/PromoterTrainingView.svelte
function PromoterTrainingView($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let materials = [];
		let selectedId = "";
		let loading = true;
		let active = derived(() => materials.find((item) => item.material_external_id === selectedId) ?? materials[0] ?? null);
		derived(() => active()?.submission_status === "pending");
		derived(() => active()?.submission_status === "approved" || active()?.assignment_status === "approved");
		derived(() => active()?.submission_status === "rejected");
		let unlocked = derived(() => false);
		$$renderer.push(`<div class="training-view svelte-ylsykc" data-testid="promoter-training"><header class="glass-panel training-header svelte-ylsykc"><p class="eyebrow svelte-ylsykc">Treinamento obrigatório</p> <h1 class="svelte-ylsykc">Capacitação do promotor</h1> <p class="svelte-ylsykc">As matérias e perguntas abaixo são carregadas da sua atribuição atual. A liberação depende da correção do backend.</p> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></header> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push(`<!--[0--><p role="status" class="svelte-ylsykc">Consultando matérias atribuídas…</p>`);
		$$renderer.push(`<!--]--> `);
		if (unlocked()) $$renderer.push(`<!--[0--><a class="btn continue svelte-ylsykc" href="/promoter/active">Acessar painel do promotor</a>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <button class="refresh-action svelte-ylsykc" type="button"${attr("disabled", loading, true)}>Atualizar progresso</button></div>`);
	});
}
//#endregion
export { PromoterTrainingView as t };
