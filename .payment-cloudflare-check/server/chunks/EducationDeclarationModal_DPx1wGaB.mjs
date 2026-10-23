globalThis.process ??= {};
globalThis.process.env ??= {};
import { c as attr, i as derived } from "./index-server_EAeTh76q.mjs";
//#region src/lib/ibge.ts
/**
* IBGE Localidades — public API, CORS-enabled. Drives UF -> cidade selects so
* birthplace never arrives as free text.
* https://servicodados.ibge.gov.br/api/docs/localidades
*/
var IBGE_BASE = "https://servicodados.ibge.gov.br/api/v1/localidades";
var IBGE_TIMEOUT_MS = 8e3;
async function fetchUfs() {
	const res = await fetchWithTimeout(`${IBGE_BASE}/estados?orderBy=nome`);
	if (!res.ok) throw new Error(`IBGE estados: ${res.status}`);
	return (await res.json()).map((e) => ({
		sigla: e.sigla,
		nome: e.nome
	}));
}
async function fetchCities(uf) {
	const res = await fetchWithTimeout(`${IBGE_BASE}/estados/${encodeURIComponent(uf.trim().toUpperCase())}/municipios?orderBy=nome`);
	if (!res.ok) throw new Error(`IBGE municípios: ${res.status}`);
	return (await res.json()).map((m) => m.nome);
}
async function fetchWithTimeout(url) {
	const controller = new AbortController();
	const timeout = globalThis.setTimeout(() => controller.abort(), IBGE_TIMEOUT_MS);
	try {
		return await fetch(url, { signal: controller.signal });
	} finally {
		globalThis.clearTimeout(timeout);
	}
}
//#endregion
//#region src/components/interactive/EducationDeclarationModal.svelte
function EducationDeclarationModal($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { role, open, onConfirm } = $$props;
		let accepted = false;
		const isStudent = derived(() => role === "student");
		if (open) {
			$$renderer.push(`<!--[0--><div class="declaration-backdrop svelte-4uuee0" role="presentation"><section class="declaration-modal svelte-4uuee0" role="dialog" aria-modal="true" aria-labelledby="education-declaration-title" aria-describedby="education-declaration-copy"><div class="declaration-icon svelte-4uuee0" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svelte-4uuee0"><path d="M12 3 4 7v5c0 5 3.3 8 8 9 4.7-1 8-4 8-9V7l-8-4Z"></path><path d="m8.5 12 2.2 2.2 4.8-5"></path></svg></div> <p class="eyebrow svelte-4uuee0">Declaração obrigatória</p> <h2 id="education-declaration-title" class="svelte-4uuee0">Confirme suas informações</h2> <p id="education-declaration-copy" class="svelte-4uuee0">`);
			if (isStudent()) $$renderer.push(`<!--[0-->Declaro que as informações escolares são verdadeiras. Sei que a instituição parceira usará esses dados na matrícula externa e que a documentação escolar será conferida depois; sem a documentação exigida, o início dos estudos ou a prova poderá ficar impedido.`);
			else $$renderer.push(`<!--[-1-->Declaro que as informações escolares e cadastrais são verdadeiras. Assumo a responsabilidade por elas no meu credenciamento de promotor e estou ciente de que a análise pode pedir comprovação.`);
			$$renderer.push(`<!--]--></p> <label class="declaration-check svelte-4uuee0"><input type="checkbox"${attr("checked", accepted, true)} class="svelte-4uuee0"/> <span>Li, entendi e confirmo que as informações são verdadeiras.</span></label> <button class="btn declaration-submit svelte-4uuee0" type="button"${attr("disabled", true, true)}>Confirmar e continuar</button> <p class="declaration-hint svelte-4uuee0">Você poderá corrigir os dados antes de confirmar.</p></section></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
export { fetchCities as n, fetchUfs as r, EducationDeclarationModal as t };
