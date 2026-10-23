globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
import { h as maybeRenderHead, m as renderTemplate, s as renderComponent } from "./console_CytTTjjb.mjs";
import { a as ensure_array_like, c as attr, l as clsx, s as stringify, t as attr_class, u as escape_html } from "./index-server_EAeTh76q.mjs";
import { t as createComponent } from "./compiler_CbNI0N93.mjs";
import { b as submitAddressProofKinship, l as getErrorMessage, s as getEnrollmentMe, t as $$RootLayout } from "./RootLayout_C3LAw_3K.mjs";
import { t as Modal } from "./Modal_D4WUEjyf.mjs";
import { r as enrollmentPath } from "./workflow_ZE_Fb8ln.mjs";
import { t as BankTlsSeal } from "./BankTlsSeal_BiymX8gf.mjs";
import { n as addressPollDelay } from "./address-proof_Cd4GQ25D.mjs";
import { n as CameraIcon, t as UploadFileIcon } from "./UploadFileIcon_3gvIkuqC.mjs";
//#region src/components/interactive/RelationshipPicker.svelte
function RelationshipPicker($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { holderName = "Maria Silva", isOpen = false, onSelect, onClose } = $$props;
		const RELATIONSHIPS = [
			{
				id: "parents",
				label: "Pai / Mãe",
				icon: "family"
			},
			{
				id: "spouse",
				label: "Cônjuge / Companheiro(a)",
				icon: "heart"
			},
			{
				id: "children",
				label: "Filho(a)",
				icon: "child"
			},
			{
				id: "landlord",
				label: "Proprietário do Imóvel (Aluguel)",
				icon: "home"
			},
			{
				id: "other",
				label: "Parente / Outro",
				icon: "user"
			}
		];
		Modal($$renderer, {
			isOpen,
			onClose,
			eyebrow: "Titularidade de Terceiro",
			eyebrowVariant: "blue",
			title: "Declaração de Vínculo",
			description: `Conta identificada no nome de: ${holderName}`,
			testId: "relationship-picker-modal",
			size: "md",
			children: ($$renderer) => {
				$$renderer.push(`<div class="flex flex-col gap-4"><p class="text-xs text-white/80 font-semibold">Qual o seu grau de relacionamento com essa pessoa?</p> <div class="flex flex-col gap-2.5" data-testid="relationship-options"><!--[-->`);
				const each_array = ensure_array_like(RELATIONSHIPS);
				for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
					let item = each_array[$$index];
					$$renderer.push(`<button type="button"${attr("data-testid", `rel-btn-${stringify(item.id)}`)} class="flex items-center justify-between w-full min-h-[48px] px-4 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-brand-green hover:border-brand-green text-white font-bold text-sm transition text-left active:scale-[0.99] group shadow-sm cursor-pointer"><span>${escape_html(item.label)}</span> <span class="text-white/40 group-hover:text-white transition">→</span></button>`);
				}
				$$renderer.push(`<!--]--></div> <p class="text-[11px] text-white/50 text-center leading-relaxed">Informe o vínculo real com o titular do comprovante.</p></div>`);
			},
			$$slots: { default: true }
		});
	});
}
//#endregion
//#region src/components/icons/UtilityBillIcon.svelte
function UtilityBillIcon($$renderer, $$props) {
	let { class: className = "size-6 text-white" } = $$props;
	$$renderer.push(`<svg${attr_class(clsx(className))} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path><polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></polyline><path d="M12 11l-2 3.5h3.5L11.5 18" stroke="var(--yellow, #ffc400)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path><line x1="8" y1="18" x2="8.01" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line><line x1="15" y1="18" x2="16" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line></svg>`);
}
//#endregion
//#region src/components/interactive/StudentAddressEnrollmentView.svelte
function StudentAddressEnrollmentView($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let status = "pending";
		let isExtracting = false;
		let triageError = null;
		let isRelationshipModalOpen = false;
		let latestEnrollment = null;
		let extractedHolder = "Titular não informado";
		let confirmedAddress = null;
		let nextPath = "/student/enrollment";
		let pollTimer;
		let pollUntil = 0;
		let revision = 0;
		let sequence = 0;
		let appliedSequence = 0;
		let checking = false;
		function failure(cause) {
			return cause instanceof Error ? cause.message : getErrorMessage(cause);
		}
		function notifyDock(addressStatus) {
			window.dispatchEvent(new CustomEvent("supletivo:student-state", { detail: { addressStatus } }));
		}
		function apply(me) {
			latestEnrollment = me;
			nextPath = enrollmentPath(me.status) ?? "/student/enrollment";
			extractedHolder = me.address_proof?.holder_name || "Titular não informado";
			const proof = me.address_proof;
			const expiry = Date.parse(proof?.expires_at ?? "");
			if (Number.isFinite(expiry)) pollUntil = expiry + 5e3;
			else if (!pollUntil) pollUntil = Date.now() + 3e5;
			if (proof?.status === "approved" && me.address_complete === true && me.address) {
				status = "approved";
				notifyDock("approved");
				confirmedAddress = {
					street: me.address.street,
					number: me.address.number,
					neighborhood: me.address.neighborhood,
					city: me.address.city,
					uf: me.address.state,
					cep: me.address.cep || me.address.zipcode,
					holderName: extractedHolder,
					relationship: proof.kinship_relation || void 0
				};
			} else if (proof?.needs_kinship) {
				status = "needs_kinship";
				isRelationshipModalOpen = true;
				notifyDock("under_review");
			} else if (proof?.status === "rejected" || proof?.needs_new_proof) {
				status = "pending";
				notifyDock("rejected");
				triageError = proof.reason || "Envie um novo comprovante legível.";
			} else if (proof?.exists) {
				status = proof.status === "review" || proof.status === "approved" ? "review" : "under_review";
				notifyDock("under_review");
				if (proof.status === "approved" && !me.address_complete) triageError = "O comprovante foi aprovado, mas o endereço está incompleto. O polo precisa conferir os dados extraídos.";
			} else {
				status = "pending";
				notifyDock("pending");
			}
		}
		function scheduleRefresh() {
			clearTimeout(pollTimer);
			const delay = addressPollDelay(latestEnrollment?.address_proof);
			if (isExtracting || delay === null) return;
			if (Date.now() >= pollUntil) {
				triageError = "O resultado ainda não está disponível. Consulte novamente ou peça a conferência do polo.";
				return;
			}
			pollTimer = setTimeout(() => {
				if (document.visibilityState === "visible") refresh();
				else scheduleRefresh();
			}, delay);
		}
		async function refresh() {
			if (checking) return;
			checking = true;
			const snapshot = {
				revision,
				sequence: ++sequence
			};
			try {
				const me = await getEnrollmentMe();
				if (snapshot.revision === revision && snapshot.sequence >= appliedSequence) {
					appliedSequence = snapshot.sequence;
					triageError = null;
					apply(me);
				}
			} catch (cause) {
				if (snapshot.revision === revision) triageError = failure(cause);
			} finally {
				checking = false;
				scheduleRefresh();
			}
		}
		async function handleRelationshipSelected(relation) {
			if (isExtracting) return;
			isRelationshipModalOpen = false;
			isExtracting = true;
			triageError = null;
			revision += 1;
			try {
				apply(await submitAddressProofKinship(relation));
			} catch (cause) {
				triageError = failure(cause);
			} finally {
				isExtracting = false;
				scheduleRefresh();
			}
		}
		$$renderer.push(`<div class="w-full max-w-2xl mx-auto flex flex-col items-center gap-6"><div class="text-center space-y-2"><div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider mb-1"><span class="size-2 rounded-full bg-blue-400 animate-pulse"></span> <span>Documentação Obrigatória · Etapa 2 de 4</span></div> <h1 class="text-2xl sm:text-4xl font-display tracking-tight text-white">Comprovante de Residência</h1> <p class="text-xs sm:text-sm text-white/70 max-w-lg mx-auto leading-relaxed">Envie uma fatura recente de consumo para conferência do seu endereço de atendimento do polo.</p></div> <div class="flex items-center justify-center gap-2 flex-wrap"><span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-white/80"><span class="text-amber-400">⚡</span> Luz / Energia</span> <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-white/80"><span class="text-blue-400">💧</span> Água / Saneamento</span> <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-white/80"><span class="text-emerald-400">🌐</span> Internet / Telefone</span> <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-white/80"><span class="text-rose-400">🔥</span> Gás Canalizado</span></div> <div class="payment-card-zero-g w-full p-6 sm:p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden"><div class="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3 text-left"><div class="size-6 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">ℹ</div> <p class="text-xs text-white/80 leading-relaxed"><strong>A conta não está no seu nome?</strong> Não tem problema! Se estiver no nome dos seus pais, cônjuge ou proprietário do imóvel, a plataforma solicita apenas o grau de parentesco em 1 clique.</p></div> `);
		if (isExtracting) $$renderer.push(`<!--[0--><div class="p-5 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-200 flex items-center gap-4 animate-in fade-in"><div class="relative size-10 flex items-center justify-center shrink-0"><span class="absolute inline-flex size-full rounded-full bg-blue-400 opacity-75 animate-ping"></span> <span class="relative size-8 rounded-full bg-blue-500 flex items-center justify-center"><svg class="size-4 text-white animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg></span></div> <div><strong class="text-white text-xs block font-bold">${escape_html("Enviando o comprovante")}</strong> <span class="text-[11px] text-blue-200/90 leading-tight block mt-0.5">${escape_html("A análise do endereço continua no servidor após o envio.")}</span></div></div>`);
		else if (triageError) $$renderer.push(`<!--[1--><div class="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 flex items-start gap-3 text-left"><svg class="size-5 text-rose-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> <div class="text-xs"><strong class="text-white font-bold block">Atenção no comprovante:</strong> <p class="text-rose-200/90 mt-0.5 leading-relaxed">${escape_html(triageError)}</p></div></div>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (status === "under_review" || status === "review" || status === "needs_kinship") {
			$$renderer.push(`<!--[0--><div class="address-state svelte-5z6gu7" role="status" aria-live="polite"><h2 class="svelte-5z6gu7">${escape_html(status === "under_review" ? "Comprovante recebido" : status === "needs_kinship" ? "Quem é o titular da conta?" : "Conferência pelo polo")}</h2> <p class="svelte-5z6gu7">${escape_html(status === "under_review" ? "Estamos lendo seu endereço. Você pode sair desta tela e voltar; não precisa reenviar." : latestEnrollment?.address_proof?.reason || "O polo fará a revisão do comprovante recebido. Não precisa reenviar agora.")}</p> `);
			if (status === "needs_kinship") $$renderer.push(`<!--[0--><button type="button" class="btn svelte-5z6gu7">Informar vínculo com o titular</button>`);
			else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <button type="button" class="address-secondary svelte-5z6gu7"${attr("disabled", isExtracting, true)}>Consultar resultado</button> `);
			if (status !== "under_review") $$renderer.push(`<!--[0--><button type="button" class="address-secondary svelte-5z6gu7">Enviar outro comprovante</button>`);
			else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
		} else if (status !== "approved") {
			$$renderer.push(`<!--[1--><div${attr_class(`p-5 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col items-center justify-center text-center min-h-[180px] relative overflow-hidden`)}>`);
			$$renderer.push(`<!--[-1--><div class="flex flex-col items-center justify-center space-y-2 py-4">`);
			UtilityBillIcon($$renderer, { class: "size-12 text-white/25" });
			$$renderer.push(`<!----> <span class="text-xs font-bold text-white/90">Envie uma conta emitida nos últimos 90 dias</span> <p class="text-[11px] text-white/50 max-w-xs">Pode ser foto da folha impressa ou o arquivo PDF original baixado do app da concessionária.</p></div>`);
			$$renderer.push(`<!--]--></div> <div class="flex flex-col sm:flex-row gap-3 pt-2"><label class="flex-1 min-h-[48px] py-3.5 px-6 rounded-full bg-[var(--yellow)] hover:bg-[var(--yellow)]/90 text-[var(--ink)] font-black text-xs uppercase tracking-wider cursor-pointer shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.985] text-center">`);
			CameraIcon($$renderer, { class: "size-4 text-[var(--ink)]" });
			$$renderer.push(`<!----> <span>Tirar Foto da Fatura</span> <input type="file" accept="image/*" capture="environment" class="hidden"${attr("disabled", isExtracting, true)}/></label> <label class="flex-1 min-h-[48px] py-3.5 px-6 rounded-full border border-white/25 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-[0.985]">`);
			UploadFileIcon($$renderer, { class: "size-4 text-white" });
			$$renderer.push(`<!----> <span>Anexar Arquivo ou PDF</span> <input type="file" accept="image/*,application/pdf" class="hidden"${attr("disabled", isExtracting, true)}/></label></div>`);
		} else {
			$$renderer.push(`<!--[-1--><div class="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center flex flex-col items-center gap-4"><div class="size-14 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400"><svg class="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div> <div><h3 class="text-lg font-display text-white">Endereço aprovado pelo servidor</h3> <p class="text-xs text-emerald-200/90 mt-1 max-w-md mx-auto">Os dados do seu comprovante foram validados e vinculados à sua matrícula oficial.</p></div> `);
			if (confirmedAddress) {
				$$renderer.push(`<!--[0--><div class="w-full max-w-md p-4 rounded-xl bg-black/40 border border-white/10 text-left text-xs space-y-1.5"><div class="flex items-center justify-between border-b border-white/10 pb-1.5"><span class="text-white/60">Titular da Conta:</span> <strong class="text-white">${escape_html(confirmedAddress.holderName)}</strong></div> `);
				if (confirmedAddress.relationship) $$renderer.push(`<!--[0--><div class="flex items-center justify-between border-b border-white/10 pb-1.5"><span class="text-white/60">Vínculo Declarado:</span> <span class="text-emerald-400 font-semibold">${escape_html(confirmedAddress.relationship)}</span></div>`);
				else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> <div class="flex items-center justify-between border-b border-white/10 pb-1.5"><span class="text-white/60">Logradouro:</span> <span class="text-white font-medium">${escape_html(confirmedAddress.street)}, ${escape_html(confirmedAddress.number)}</span></div> <div class="flex items-center justify-between"><span class="text-white/60">Cidade / CEP:</span> <span class="text-white font-medium">${escape_html(confirmedAddress.city)} - ${escape_html(confirmedAddress.uf)} · CEP ${escape_html(confirmedAddress.cep)}</span></div></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <div class="w-full max-w-sm mt-2"><a${attr("href", nextPath)} class="w-full min-h-[48px] py-3.5 px-4 rounded-full bg-[var(--yellow)] hover:bg-[var(--yellow)]/90 text-[var(--ink)] font-black text-xs uppercase tracking-wider shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.985] text-center"><span>Avançar: Escolaridade →</span></a></div></div>`);
		}
		$$renderer.push(`<!--]--> <div class="flex items-center justify-center gap-2 text-[11px] text-[var(--muted-on-dark)] pt-2 border-t border-white/10">`);
		BankTlsSeal($$renderer, { class: "size-4 text-emerald-400" });
		$$renderer.push(`<!----> <span>Documento recebido por conexão segura para conferência do cadastro.</span></div></div> <div class="text-center"><a href="https://wa.me/5543996648750?text=Ol%C3%A1%2C%20estou%20na%20etapa%20de%20envio%20do%20Comprovante%20de%20Resid%C3%AAncia%20do%20Supletivo%20e%20preciso%20de%20ajuda." target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 text-white/70 text-xs hover:text-white transition-all cursor-pointer"><svg class="size-3.5 fill-emerald-400" viewBox="0 0 24 24"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2Z"></path></svg> <span>Dúvidas sobre o comprovante de endereço? Fale no WhatsApp</span></a></div></div> `);
		RelationshipPicker($$renderer, {
			isOpen: isRelationshipModalOpen,
			holderName: extractedHolder,
			onSelect: handleRelationshipSelected,
			onClose: () => {
				isRelationshipModalOpen = false;
			}
		});
		$$renderer.push(`<!---->`);
	});
}
//#endregion
//#region src/pages/student/enrollment/address.astro
var address_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Address,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Address = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Comprovante de Residência — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="w-full max-w-2xl mx-auto flex-1 flex flex-col items-center justify-center p-4 sm:p-6 pb-36">${renderComponent($$result, "StudentAddressEnrollmentView", StudentAddressEnrollmentView, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/StudentAddressEnrollmentView.svelte",
		"client:component-export": "default"
	})}</div>` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/student/enrollment/address.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/student/enrollment/address.astro";
var $$url = "/student/enrollment/address";
//#endregion
//#region \0virtual:astro:page:src/pages/student/enrollment/address@_@astro
var page = () => address_exports;
//#endregion
export { page };
