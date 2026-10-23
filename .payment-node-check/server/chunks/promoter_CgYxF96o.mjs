//#region src/lib/promoter.ts
function commissionTotal(commissions, statuses) {
	const cents = commissions.filter((item) => statuses.includes(item.status)).reduce((sum, item) => {
		const amount = /^(-?)(\d+)\.(\d{2})$/.exec(item.amount);
		if (!amount) throw new Error("O servidor retornou um valor de comissão inválido.");
		const absolute = BigInt(amount[2]) * 100n + BigInt(amount[3]);
		return sum + (amount[1] ? -absolute : absolute);
	}, 0n);
	const absolute = cents < 0n ? -cents : cents;
	return `${cents < 0n ? "-" : ""}${absolute / 100n}.${(absolute % 100n).toString().padStart(2, "0")}`;
}
function moneyLabel(amount) {
	return Number(amount).toLocaleString("pt-BR", {
		style: "currency",
		currency: "BRL"
	});
}
var COMMISSION_STATUS_LABELS = {
	pending: "Aguardando fechamento",
	processed: "Repasse em processamento",
	paid: "Pago no Pix",
	failed: "Falha no repasse",
	cancelled: "Comissão cancelada"
};
//#endregion
export { commissionTotal as n, moneyLabel as r, COMMISSION_STATUS_LABELS as t };
