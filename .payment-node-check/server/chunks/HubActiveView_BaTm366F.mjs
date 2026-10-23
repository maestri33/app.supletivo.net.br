import { u as escape_html } from "./index-server_DvB6aUE6.mjs";
import "./RootLayout_as4U_EmP.mjs";
//#region src/components/interactive/HubActiveView.svelte
function HubActiveView($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		$$renderer.push(`<div class="w-full max-w-4xl mx-auto p-4 sm:p-6 text-white space-y-6"><div class="rounded-3xl p-6 sm:p-8 glass-panel border border-white/15 bg-gradient-to-br from-ink/95 to-blue/90 shadow-2xl"><div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6"><div><div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-xs font-semibold text-blue-300 mb-2"><span class="size-2 rounded-full bg-blue-400"></span> Status: Ativo</div> <h1 class="text-2xl sm:text-3xl font-display text-white">Secretaria de Polo (Hub)</h1> <p class="text-xs sm:text-sm text-white/70 mt-1">Gestão operacional do polo regional sob responsabilidade de <strong>${escape_html("Coordenador")}</strong>.</p></div> <div><a href="/hub/active/operations" class="btn inline-flex items-center gap-2 text-xs py-3 px-6 font-bold text-[var(--ink)] cursor-pointer">Gerenciar alunos →</a> <a href="/hub/review" class="btn inline-flex items-center gap-2 text-xs py-3 px-6 font-bold uppercase tracking-wider text-[var(--ink)] cursor-pointer">Fila de Revisões →</a></div></div> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <div class="grid grid-cols-1 sm:grid-cols-3 gap-4"><div class="p-5 rounded-2xl bg-white/5 border border-white/10"><span class="text-xs text-white/60 uppercase font-semibold">Fila de Conferência</span> <p class="text-3xl font-bold text-amber-300 mt-1">`);
		$$renderer.push(`<!--[0--><span class="text-sm font-normal text-white/50">Carregando...</span>`);
		$$renderer.push(`<!--]--></p> <p class="text-xs text-white/60 mt-1.5">RG, histórico e selfies</p></div> <div class="p-5 rounded-2xl bg-white/5 border border-white/10"><span class="text-xs text-white/60 uppercase font-semibold">Provas presenciais</span> <p class="text-3xl font-bold text-blue-300 mt-1">`);
		$$renderer.push(`<!--[0--><span class="text-sm font-normal text-white/50">Carregando...</span>`);
		$$renderer.push(`<!--]--></p> <p class="text-xs text-white/60 mt-1.5">Exames presenciais no polo</p></div> <div class="p-5 rounded-2xl bg-white/5 border border-white/10"><span class="text-xs text-white/60 uppercase font-semibold">Diplomas Prontos</span> <p class="text-3xl font-bold text-emerald-400 mt-1">`);
		$$renderer.push(`<!--[0--><span class="text-sm font-normal text-white/50">Carregando...</span>`);
		$$renderer.push(`<!--]--></p> <p class="text-xs text-white/60 mt-1.5">Aguardando assinatura do concluinte</p></div></div></div></div>`);
	});
}
//#endregion
export { HubActiveView as t };
