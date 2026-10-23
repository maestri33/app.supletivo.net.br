globalThis.process ??= {};
globalThis.process.env ??= {};
import { c as attr, i as derived, t as attr_class, u as escape_html } from "./index-server_EAeTh76q.mjs";
import "./RootLayout_BZofGHHY.mjs";
import { n as commissionTotal, r as moneyLabel } from "./promoter_BcQZUwX6.mjs";
//#region src/components/interactive/PromoterLeadsView.svelte
function PromoterLeadsView($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let leads = [];
		let searchQuery = "";
		let commissions = [];
		derived(() => "https://supletivo.net.br");
		derived(() => leads.filter((lead) => {
			return true;
		}));
		let totalCount = derived(() => leads.length);
		let paidCount = derived(() => leads.filter((l) => l.status === "paid" || l.status === "enrolled").length);
		let pendingCount = derived(() => leads.filter((l) => l.status === "checkout" || l.status === "started").length);
		let totalCommissions = derived(() => moneyLabel(commissionTotal(commissions, [
			"pending",
			"processed",
			"paid"
		])));
		$$renderer.push(`<div class="w-full max-w-5xl mx-auto p-4 sm:p-6 text-white space-y-6">`);
		$$renderer.push(`<!--[-1--><div class="rounded-3xl p-6 sm:p-8 glass-panel border border-white/15 bg-gradient-to-br from-green-deep/90 to-blue/90 shadow-2xl"><div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6"><div><div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--yellow)]/15 border border-[var(--yellow)]/30 text-xs font-semibold text-[var(--yellow)] mb-2">Gestão de Captação</div> <h1 class="text-2xl sm:text-3xl font-display text-white">Meus Indicados</h1> <p class="text-xs sm:text-sm text-white/70 mt-1">Acompanhe o funil de matrículas dos alunos que acessaram pelo seu link oficial.</p></div> <div class="flex flex-wrap items-center gap-3"><a href="/promoter/active" class="inline-flex items-center gap-2 text-xs py-2.5 px-4 rounded-xl border border-white/20 bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-colors">← Voltar ao Painel</a> <button type="button" class="btn inline-flex items-center gap-2 text-xs py-2.5 px-5 font-bold uppercase tracking-wider text-[var(--ink)] cursor-pointer">${escape_html("Copiar Link de Indicação 🔗")}</button></div></div> <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"><div class="p-4 rounded-2xl bg-white/5 border border-white/10"><span class="text-[11px] text-white/60 uppercase font-semibold">Indicados no extrato</span> <p class="text-2xl sm:text-3xl font-bold text-white mt-1">${escape_html(totalCount())}</p> <p class="text-[11px] text-white/50 mt-1">Até 200 indicações mais recentes</p></div> <div class="p-4 rounded-2xl bg-white/5 border border-white/10"><span class="text-[11px] text-white/60 uppercase font-semibold">Matrículas Pagas</span> <p class="text-2xl sm:text-3xl font-bold text-emerald-400 mt-1">${escape_html(paidCount())}</p> <p class="text-[11px] text-emerald-400/70 mt-1">Comissões geradas</p></div> <div class="p-4 rounded-2xl bg-white/5 border border-white/10"><span class="text-[11px] text-white/60 uppercase font-semibold">Aguardando Pagamento</span> <p class="text-2xl sm:text-3xl font-bold text-amber-300 mt-1">${escape_html(pendingCount())}</p> <p class="text-[11px] text-amber-300/70 mt-1">Em fase de pagamento</p></div> <div class="p-4 rounded-2xl bg-white/5 border border-white/10"><span class="text-[11px] text-white/60 uppercase font-semibold">Comissões Registradas</span> <p class="text-2xl sm:text-3xl font-bold text-[var(--yellow)] mt-1">${escape_html(totalCommissions())}</p> <a href="/promoter/active/commissions" class="text-[11px] text-[var(--yellow)]/70 mt-1">Consultar extrato de repasses</a></div></div></div> <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md"><div class="flex items-center gap-2"><button type="button"${attr_class(`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all bg-[var(--yellow)] text-[var(--ink)] font-bold`)}>Todos (${escape_html(totalCount())})</button> <button type="button"${attr_class(`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all bg-white/5 text-white/70 hover:bg-white/10`)}>Pagos (${escape_html(paidCount())})</button> <button type="button"${attr_class(`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all bg-white/5 text-white/70 hover:bg-white/10`)}>Pendentes (${escape_html(pendingCount())})</button></div> <div class="relative w-full sm:w-72"><input id="leads-search" data-hydrated="true" type="text" placeholder="Buscar por nome ou WhatsApp..."${attr("value", searchQuery)} class="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs placeholder-white/40 focus:outline-none focus:border-[var(--yellow)]"/></div></div> <div class="rounded-3xl border border-white/15 bg-white/5 backdrop-blur-md overflow-hidden shadow-xl">`);
		$$renderer.push(`<!--[0--><div class="p-12 text-center text-white/60"><div class="size-6 border-2 border-[var(--yellow)] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div> <p class="text-sm">Carregando lista de indicados...</p></div>`);
		$$renderer.push(`<!--]--></div>`);
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
export { PromoterLeadsView as t };
