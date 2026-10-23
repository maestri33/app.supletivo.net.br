import { c as attr, s as stringify, t as attr_class, u as escape_html } from "./index-server_DvB6aUE6.mjs";
//#region src/components/ui/Modal.svelte
function Modal($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { isOpen = false, onClose, title = "", eyebrow = "", eyebrowVariant = "blue", description = "", size = "md", showCloseButton = true, closeOnBackdrop = true, closeOnEscape = true, testId = "modal-dialog", children, header, footer } = $$props;
		const sizeClasses = {
			sm: "max-w-sm",
			md: "max-w-md",
			lg: "max-w-lg",
			xl: "max-w-xl"
		};
		const eyebrowStyles = {
			blue: "bg-blue-500/20 text-blue-300 border-blue-400/30",
			green: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
			amber: "bg-amber-500/20 text-amber-300 border-amber-500/30",
			yellow: "bg-[var(--yellow)]/20 text-[var(--yellow)] border-[var(--yellow)]/30",
			purple: "bg-purple-500/20 text-purple-300 border-purple-400/30"
		};
		if (isOpen) {
			$$renderer.push(`<!--[0--><div role="dialog" aria-modal="true"${attr("aria-labelledby", title ? "canonical-modal-title" : void 0)}${attr("aria-describedby", description ? "canonical-modal-desc" : void 0)}${attr("data-testid", testId)} class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 transition-opacity animate-in fade-in duration-200"><div${attr_class(`w-full ${stringify(sizeClasses[size] || "max-w-md")} bg-[var(--ink-soft)]/95 text-white sm:rounded-3xl rounded-t-3xl border border-white/15 p-6 sm:p-8 shadow-2xl flex flex-col gap-6 backdrop-blur-2xl relative overflow-hidden animate-in slide-in-from-bottom-6 duration-200 max-h-[92dvh] overflow-y-auto`)}><div class="w-12 h-1 bg-white/25 rounded-full mx-auto sm:hidden -mt-2 -mb-2" aria-hidden="true"></div> `);
			if (header) {
				$$renderer.push("<!--[0-->");
				header($$renderer);
				$$renderer.push(`<!---->`);
			} else if (title || eyebrow || description || showCloseButton) {
				$$renderer.push(`<!--[1--><div class="flex items-start justify-between border-b border-white/10 pb-4"><div class="flex flex-col gap-1 pr-4">`);
				if (eyebrow) $$renderer.push(`<!--[0--><span${attr_class(`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide w-fit border ${stringify(eyebrowStyles[eyebrowVariant] || eyebrowStyles.blue)}`)}>${escape_html(eyebrow)}</span>`);
				else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				if (title) $$renderer.push(`<!--[0--><h3 id="canonical-modal-title" class="text-xl font-black text-white font-display tracking-tight mt-0.5">${escape_html(title)}</h3>`);
				else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				if (description) $$renderer.push(`<!--[0--><p id="canonical-modal-desc" class="text-xs text-white/70 leading-relaxed mt-0.5">${escape_html(description)}</p>`);
				else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div> `);
				if (showCloseButton) $$renderer.push(`<!--[0--><button type="button" class="min-w-[48px] min-h-[48px] w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-base font-bold transition-all duration-200 hover:rotate-90 shrink-0 cursor-pointer" aria-label="Fechar janela" data-testid="modal-close-btn">✕</button>`);
				else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (children) {
				$$renderer.push(`<!--[0--><div class="flex-1">`);
				children($$renderer);
				$$renderer.push(`<!----></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (footer) {
				$$renderer.push(`<!--[0--><div class="border-t border-white/10 pt-4 mt-auto">`);
				footer($$renderer);
				$$renderer.push(`<!----></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
export { Modal as t };
