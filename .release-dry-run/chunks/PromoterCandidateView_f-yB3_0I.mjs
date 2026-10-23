globalThis.process ??= {};
globalThis.process.env ??= {};
import { r as derived, s as attr } from "./index-server_CnxoOwt9.mjs";
import "./RootLayout_DKEwq1JF.mjs";
//#region src/components/interactive/PromoterCandidateView.svelte
function PromoterCandidateView($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let documentType = "rg";
		let documentSide = "front";
		let loading = true;
		derived(() => void 0);
		derived(() => void 0);
		derived(() => Boolean(void 0));
		derived(() => false);
		derived(() => {
			return "loading";
		});
		derived(() => `${documentType}_${documentSide}`);
		$$renderer.push(`<div class="candidate-view svelte-jo32ol" data-testid="promoter-candidate"><header class="glass-panel candidate-header svelte-jo32ol"><p class="eyebrow svelte-jo32ol">Credenciamento</p> <h1 class="svelte-jo32ol">Credenciamento de Promotor</h1> <p class="svelte-jo32ol">Envie seus documentos. Os dados de identidade e endereço são extraídos automaticamente.</p></header> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push(`<!--[0--><p role="status" class="svelte-jo32ol">Consultando seu credenciamento…</p>`);
		$$renderer.push(`<!--]--> <button class="refresh-action svelte-jo32ol" type="button"${attr("disabled", loading, true)}>Atualizar status</button></div>`);
	});
}
//#endregion
export { PromoterCandidateView as t };
