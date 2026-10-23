globalThis.process ??= {};
globalThis.process.env ??= {};
import { u as escape_html } from "./index-server_EAeTh76q.mjs";
import "./RootLayout_CQOsmgn0.mjs";
//#region src/components/interactive/HubReviewView.svelte
function HubReviewView($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		$$renderer.push(`<div class="w-full max-w-4xl mx-auto p-4 sm:p-6 text-white space-y-6"><div class="rounded-3xl p-6 sm:p-8 glass-panel border border-amber-500/40 bg-gradient-to-br from-amber-950/60 to-blue-deep/90 shadow-2xl"><div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6"><div><div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-xs font-semibold text-amber-300 mb-2"><span class="size-2 rounded-full bg-amber-400 animate-pulse"></span> Status de Atenção: Revisão</div> <h1 class="text-2xl sm:text-3xl font-display text-white">Central de Análises do Polo</h1> <p class="text-xs sm:text-sm text-amber-100/80 mt-1">Pendências documentais de matrículas e aprovações de novos consultores aguardando validação presencial ou documental do coordenador <strong>${escape_html("Coordenador")}</strong>.</p></div> <div><a href="/hub/active" class="inline-flex items-center gap-2 text-xs py-2.5 px-5 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold transition-colors cursor-pointer">← Visão Geral do Polo</a></div></div> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push(`<!--[0--><div class="p-8 text-center text-xs text-white/60">Carregando fila de revisões do polo...</div>`);
		$$renderer.push(`<!--]--></div></div>`);
	});
}
//#endregion
export { HubReviewView as t };
