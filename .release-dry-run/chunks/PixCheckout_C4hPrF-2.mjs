globalThis.process ??= {};
globalThis.process.env ??= {};
import { c as clsx, l as escape_html, o as stringify, s as attr, t as attr_class } from "./index-server_CnxoOwt9.mjs";
import "./RootLayout_DKEwq1JF.mjs";
import { t as BankTlsSeal } from "./BankTlsSeal_BlCpxmMi.mjs";
//#region src/components/icons/PixIcon.svelte
function PixIcon($$renderer, $$props) {
	let { class: className = "size-6 text-[var(--green)]" } = $$props;
	$$renderer.push(`<svg${attr_class(clsx(className))} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9.13 4.25a2.5 2.5 0 0 1 3.54 0l1.41 1.41a.5.5 0 0 1-.7.71l-1.42-1.41a1.5 1.5 0 0 0-2.12 0L5.27 9.54a1.5 1.5 0 0 0 0 2.12l4.57 4.58a1.5 1.5 0 0 0 2.12 0l1.42-1.42a.5.5 0 0 1 .7.71l-1.41 1.41a2.5 2.5 0 0 1-3.54 0L4.56 12.37a2.5 2.5 0 0 1 0-3.54L9.13 4.25Z" fill="currentColor"></path><path d="M14.87 19.75a2.5 2.5 0 0 1-3.54 0l-1.41-1.41a.5.5 0 0 1 .7-.71l1.42 1.41a1.5 1.5 0 0 0 2.12 0l4.57-4.58a1.5 1.5 0 0 0 0-2.12l-4.57-4.58a1.5 1.5 0 0 0-2.12 0l-1.42 1.42a.5.5 0 0 1-.7-.71l1.41-1.41a2.5 2.5 0 0 1 3.54 0l4.57 4.57a2.5 2.5 0 0 1 0 3.54l-4.57 4.57Z" fill="currentColor"></path></svg>`);
}
//#endregion
//#region src/components/icons/CopyFeedbackIcon.svelte
function CopyFeedbackIcon($$renderer, $$props) {
	let { copied = false, class: className = "size-4" } = $$props;
	$$renderer.push(`<div${attr_class(`relative inline-flex items-center justify-center ${stringify(className)}`, "svelte-1nkrlqo")} aria-hidden="true">`);
	if (!copied) $$renderer.push(`<!--[0--><svg class="size-full transition-transform duration-200 svelte-1nkrlqo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" class="svelte-1nkrlqo"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" class="svelte-1nkrlqo"></path></svg>`);
	else $$renderer.push(`<!--[-1--><svg class="size-full text-emerald-400 animate-[stamp_0.35s_cubic-bezier(0.18,0.89,0.32,1.28)_forwards] svelte-1nkrlqo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" class="svelte-1nkrlqo"></polyline></svg>`);
	$$renderer.push(`<!--]--></div>`);
}
//#endregion
//#region src/components/interactive/PixCheckout.svelte
function PixCheckout($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { token, initialData = null } = $$props;
		let phase = initialData ? "ready" : "loading";
		let data = initialData || null;
		let copied = false;
		function formatMoney(amount) {
			if (!amount) return "Valor indisponível";
			const val = typeof amount === "string" ? parseFloat(amount) : amount;
			if (isNaN(val)) return "Valor indisponível";
			return val.toLocaleString("pt-BR", {
				style: "currency",
				currency: "BRL"
			});
		}
		$$renderer.push(`<main id="conteudo" class="flex flex-1 px-4 sm:px-6 py-6 pb-28"><div class="m-auto flex w-full max-w-[460px] flex-col items-center gap-5">`);
		if (phase === "loading") $$renderer.push(`<!--[0--><div class="w-full rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl text-center flex flex-col items-center gap-4 shadow-2xl"><div class="size-12 animate-spin rounded-full border-4 border-[var(--yellow)] border-t-transparent"></div> <h2 class="text-base font-display font-bold text-white">Carregando cobrança PIX oficial…</h2> <p class="text-xs text-white/60">Conectando ao gateway bancário homologado do Supletivo Brasil.</p></div>`);
		else if (phase === "notfound") $$renderer.push(`<!--[1--><div class="w-full rounded-3xl border border-rose-500/30 bg-rose-950/30 p-6 sm:p-8 backdrop-blur-xl text-center flex flex-col gap-4 shadow-2xl"><div class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400"><svg class="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg></div> <h1 class="text-xl font-display text-white">Cobrança PIX não encontrada</h1> <p class="text-xs text-white/70 leading-relaxed">Esta cobrança já foi confirmada ou ainda não foi emitida. Acesse suas opções de pagamento abaixo.</p> <button type="button" class="btn mt-2 w-full min-h-[48px] py-3 rounded-full bg-[var(--yellow)] text-[var(--ink)] text-xs font-extrabold uppercase tracking-wider cursor-pointer">Recarregar Opções →</button></div>`);
		else if (phase === "error") $$renderer.push(`<!--[2--><div class="w-full rounded-3xl border border-amber-500/30 bg-amber-950/30 p-6 sm:p-8 backdrop-blur-xl text-center flex flex-col gap-4 shadow-2xl"><div class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400"><svg class="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div> <h1 class="text-xl font-display text-white">Aguardando emissão no gateway</h1> <p class="text-xs text-white/70 leading-relaxed">O gateway está processando a chave. Toque abaixo para verificar novamente.</p> <button type="button" class="btn mt-2 w-full min-h-[48px] py-3 rounded-full bg-[var(--yellow)] text-[var(--ink)] text-xs font-extrabold uppercase tracking-wider cursor-pointer">Tentar Novamente ↺</button></div>`);
		else if (phase === "paid") $$renderer.push(`<!--[3--><div class="w-full rounded-3xl border border-emerald-500/40 bg-emerald-950/40 p-8 sm:p-10 backdrop-blur-xl text-center flex flex-col gap-5 shadow-2xl"><div class="size-20 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center border-2 border-emerald-500/50 shadow-[0_0_35px_rgba(16,185,129,0.4)]"><svg class="size-11 text-emerald-400 checkmark-svg" viewBox="0 0 52 52" fill="none"><circle class="checkmark-circle" cx="26" cy="26" r="23" stroke="currentColor" stroke-width="3" stroke-opacity="0.3"></circle><path class="checkmark-check" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" d="M14 27l8 8 16-16"></path></svg></div> <div><h1 class="text-2xl sm:text-3xl font-display text-white">Pagamento Confirmado!</h1> <p class="mt-2 text-xs sm:text-sm text-emerald-200/90 leading-relaxed max-w-sm mx-auto">Seu PIX foi processado com sucesso pelo Banco Central. Liberando seu ambiente oficial de matrícula...</p></div> <div class="w-full bg-white/10 rounded-full h-1.5 overflow-hidden max-w-xs mx-auto"><div class="h-full bg-emerald-400 rounded-full animate-[progress_1.8s_ease-out_forwards]"></div></div> <div class="mt-2"><a href="/student/enrollment" class="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-400 px-6 text-xs font-extrabold uppercase tracking-wider text-[var(--ink)] transition-all shadow-lg cursor-pointer">Continuar para a Matrícula →</a></div></div>`);
		else {
			$$renderer.push(`<!--[-1--><div class="text-center"><div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold uppercase tracking-wider mb-2">`);
			PixIcon($$renderer, { class: "size-3.5 text-emerald-400" });
			$$renderer.push(`<!----> <span>PIX com Liberação Imediata</span></div> <h1 class="text-2xl sm:text-3xl font-display text-white">Pagamento da Matrícula</h1> <p class="mt-1 text-xs text-white/70">Pague via PIX para liberar a próxima etapa da matrícula</p></div> <div class="w-full rounded-3xl border border-white/15 bg-white/[0.04] p-6 sm:p-8 backdrop-blur-xl flex flex-col items-center text-center gap-5 shadow-2xl relative"><div class="flex w-full items-center justify-between border-b border-white/10 pb-4"><span class="text-xs font-semibold text-white/70">Valor à vista com desconto</span> <span class="text-2xl font-display font-black text-emerald-400">${escape_html(formatMoney(data?.amount))}</span></div> `);
			if (data?.qrcode_image) {
				$$renderer.push("<!--[0-->");
				const imgSrc = data.qrcode_image.startsWith("data:") || data.qrcode_image.startsWith("http") || data.qrcode_image.startsWith("/") ? data.qrcode_image : `data:image/png;base64,${data.qrcode_image}`;
				$$renderer.push(`<div class="size-56 rounded-2xl bg-white p-3.5 shadow-2xl flex items-center justify-center border-4 border-white/20"><img${attr("src", imgSrc)} alt="QR Code PIX Oficial" class="size-full object-contain" width="224" height="224"/></div> <p class="text-[11px] text-white/60">Abra o app do seu banco e escaneie o código acima</p>`);
			} else if (data?.qrcode_payload) $$renderer.push(`<!--[1--><div class="w-full rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-left"><p class="text-xs text-amber-100">O código PIX foi emitido pelo gateway. Use o campo Copia e Cola abaixo; a imagem oficial ainda não foi disponibilizada.</p></div>`);
			else $$renderer.push(`<!--[-1--><div class="w-full rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-left"><p class="text-xs text-amber-100">A cobrança ainda não possui um QR Code oficial. Atualize para consultar o gateway.</p></div>`);
			$$renderer.push(`<!--]--> `);
			if (data?.qrcode_payload) {
				$$renderer.push(`<!--[0--><div class="flex w-full flex-col gap-2 text-left"><div class="flex items-center justify-between"><label for="pix-payload" class="text-[11px] font-bold text-white/90">PIX Copia e Cola Oficial</label> `);
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div> <textarea id="pix-payload" readonly="" class="min-h-16 w-full resize-none rounded-xl border border-white/15 bg-black/40 p-3 font-mono text-[11px] text-white/90 focus:outline-none focus:border-[var(--yellow)] select-all">`);
				const $$body = escape_html(data.qrcode_payload);
				if ($$body) $$renderer.push(`${$$body}`);
				$$renderer.push(`</textarea> <button type="button" class="copy-btn-elastic btn w-full min-h-[48px] py-3.5 rounded-full bg-[var(--yellow)] text-[var(--ink)] font-extrabold text-xs uppercase tracking-wider cursor-pointer shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2">`);
				CopyFeedbackIcon($$renderer, {
					copied,
					class: "size-4"
				});
				$$renderer.push(`<!----> <span>${escape_html("Copiar Código PIX")}</span></button></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <div class="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-white/[0.04] border border-white/10 mt-1"><div class="relative flex size-3.5 items-center justify-center"><span class="absolute inline-flex size-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span> <span class="relative inline-flex size-2 rounded-full bg-emerald-500"></span></div> <p class="text-[11px] text-white/80 font-medium"><strong class="text-emerald-400 font-semibold">Radar Bancário Ativo:</strong> Aguardando compensação em tempo real. Não precisa recarregar.</p></div> <div class="w-full text-left bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-5"><h3 class="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2"><span>💡</span> Como pagar no seu celular:</h3> <ol class="space-y-2.5 text-xs text-white/80"><li class="flex items-start gap-2.5"><span class="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--yellow)] text-[var(--ink)] font-black text-[10px]">1</span> <span>Toque no botão amarelo acima para <strong>Copiar o código PIX</strong>.</span></li> <li class="flex items-start gap-2.5"><span class="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-white font-bold text-[10px]">2</span> <span>Abra o <strong>aplicativo do seu banco</strong> (Nubank, Caixa, Bradesco, Itaú, etc.).</span></li> <li class="flex items-start gap-2.5"><span class="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-white font-bold text-[10px]">3</span> <span>Escolha a opção <strong>Pix Copia e Cola</strong> (não utilize chave/CPF).</span></li> <li class="flex items-start gap-2.5"><span class="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white font-bold text-[10px]">4</span> <span>Cole o código e confirme. A liberação ocorre após a confirmação do gateway.</span></li></ol></div> <div class="flex items-center justify-center gap-2 text-[11px] text-[var(--muted-on-dark)] pt-2 border-t border-white/10 w-full">`);
			BankTlsSeal($$renderer, { class: "size-4 text-emerald-400" });
			$$renderer.push(`<!----> <span>Ambiente Criptografado TLS 256-Bit · Homologado Banco Central</span></div> <div class="w-full text-center pt-1"><a href="https://wa.me/5543996648750?text=Ol%C3%A1%2C%20estou%20na%20tela%20de%20pagamento%20da%20minha%20matr%C3%ADcula%20do%20Supletivo%20e%20preciso%20de%20ajuda." target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/20 transition-all cursor-pointer"><svg class="size-3.5 fill-current" viewBox="0 0 24 24"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2Z"></path></svg> <span>Dúvidas com o pagamento? Fale no WhatsApp</span></a></div></div>`);
		}
		$$renderer.push(`<!--]--></div></main>`);
	});
}
//#endregion
export { PixIcon as n, PixCheckout as t };
