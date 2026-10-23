//#region src/lib/deadline.ts
/** Release UI waits even if a transport does not honor cancellation. */
function withDeadline(work, timeoutMs, cancel) {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(new DOMException("A consulta demorou. O processamento pode continuar no servidor.", "AbortError"));
			cancel?.();
		}, Math.max(1, Number.isFinite(timeoutMs) ? timeoutMs : 12e3));
		Promise.resolve().then(work).then(resolve, reject).finally(() => clearTimeout(timer));
	});
}
/** The deadline includes reading the response body, not only receiving headers. */
function fetchJsonWithDeadline(url, init = {}, timeoutMs = 12e3) {
	const controller = new AbortController();
	return withDeadline(async () => {
		const response = await fetch(url, {
			...init,
			signal: controller.signal
		});
		return {
			response,
			data: await response.json()
		};
	}, timeoutMs, () => controller.abort());
}
//#endregion
export { withDeadline as n, fetchJsonWithDeadline as t };
