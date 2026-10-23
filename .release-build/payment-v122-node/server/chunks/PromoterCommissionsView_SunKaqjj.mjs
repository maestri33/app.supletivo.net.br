import { i as derived, u as escape_html } from "./index-server_DvB6aUE6.mjs";
import "./RootLayout_Ccnumr8N.mjs";
import { n as commissionTotal, r as moneyLabel } from "./promoter_CgYxF96o.mjs";
//#region src/components/interactive/PromoterCommissionsView.svelte
function PromoterCommissionsView($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let commissions = [];
		let pixKey = "Não informada";
		let balance = derived(() => {
			return moneyLabel(commissionTotal(commissions, ["pending", "processed"]));
		});
		let totalPaid = derived(() => {
			return moneyLabel(commissionTotal(commissions, ["paid"]));
		});
		$$renderer.push(`<div class="w-full max-w-5xl mx-auto p-4 sm:p-6 text-white space-y-6">`);
		$$renderer.push(`<!--[-1--><div class="rounded-3xl p-6 sm:p-8 glass-panel border border-white/15 bg-gradient-to-br from-green-deep/90 to-blue/90 shadow-2xl"><div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6"><div><div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--yellow)]/15 border border-[var(--yellow)]/30 text-xs font-semibold text-[var(--yellow)] mb-2">Finanças &amp; Repasses</div> <h1 class="text-2xl sm:text-3xl font-display text-white">Comissões &amp; Extrato PIX</h1> <p class="text-xs sm:text-sm text-white/70 mt-1">Acompanhe suas bonificações por matrícula aprovada e datas de fechamento semanal.</p></div> <div class="flex items-center gap-3"><a href="/promoter/active" class="inline-flex items-center gap-2 text-xs py-2.5 px-4 rounded-xl border border-white/20 bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-colors">← Voltar ao Painel</a></div></div> <div class="grid grid-cols-1 sm:grid-cols-3 gap-4"><div class="p-5 rounded-2xl bg-white/5 border border-white/10"><span class="text-xs text-white/60 uppercase font-semibold">Saldo a Receber</span> <p class="text-3xl font-bold text-[var(--yellow)] mt-1">${escape_html(balance())}</p> <p class="text-xs text-emerald-400 mt-1.5">✓ Fechamento na próxima sexta-feira</p></div> <div class="p-5 rounded-2xl bg-white/5 border border-white/10"><span class="text-xs text-white/60 uppercase font-semibold">Total Já Pago</span> <p class="text-3xl font-bold text-white mt-1">${escape_html(totalPaid())}</p> <p class="text-xs text-white/60 mt-1.5">Repasses automáticos no PIX</p></div> <div class="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between"><div><span class="text-xs text-white/60 uppercase font-semibold">Chave PIX Cadastrada</span> <p class="text-base font-mono font-bold text-white mt-1">${escape_html(pixKey)}</p> <p class="text-xs text-emerald-400 mt-1">Tipo: PIX (Validada no DICT)</p></div> <div class="mt-3"><span class="text-[11px] text-white/50">Repasses 100% bancários e seguros</span></div></div></div></div> <div class="rounded-3xl border border-white/15 bg-white/5 backdrop-blur-md overflow-hidden shadow-xl"><div class="p-5 border-b border-white/10 bg-white/5 flex items-center justify-between"><h2 class="text-base font-bold text-white">Histórico de Comissões</h2> <span class="text-xs text-white/60">R$ 100,00 por matrícula + Bônus de R$ 500,00 a cada 5 matrículas na semana</span></div> `);
		$$renderer.push(`<!--[0--><div class="p-12 text-center text-white/60"><div class="size-6 border-2 border-[var(--yellow)] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div> <p class="text-sm">Carregando extrato de comissões...</p></div>`);
		$$renderer.push(`<!--]--></div>`);
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
export { PromoterCommissionsView as t };
