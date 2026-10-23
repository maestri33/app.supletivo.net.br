globalThis.process ??= {};
globalThis.process.env ??= {};
import { _ as requestAuth, r as ApiError, w as getAccessToken } from "./RootLayout_C3LAw_3K.mjs";
//#region src/lib/private-media.ts
/** Restrict authenticated downloads to the same-origin media proxy. */
function privateMediaPath(path) {
	const value = path.trim();
	if (!value || /^[a-z][a-z\d+.-]*:/i.test(value) || value.startsWith("//")) throw new Error("O endereço do documento não é válido.");
	let decoded;
	try {
		decoded = decodeURIComponent(value);
	} catch {
		throw new Error("O endereço do documento não é válido.");
	}
	if (decoded.includes("\\") || decoded.includes("?") || decoded.includes("#") || decoded.startsWith("//") || decoded.split("/").some((part) => part === "." || part === "..")) throw new Error("O endereço do documento não é válido.");
	const relative = value.replace(/^\/+/, "");
	return relative.startsWith("media/") ? `/${relative}` : `/media/${relative}`;
}
async function downloadOnce(path) {
	const token = getAccessToken();
	if (!token) throw new ApiError("Sessão expirada. Entre novamente.", 401);
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 3e4);
	try {
		const response = await fetch(path, {
			headers: { Authorization: `Bearer ${token}` },
			credentials: "same-origin",
			cache: "no-store",
			signal: controller.signal
		});
		if (!response.ok) throw new ApiError(response.status === 403 ? "Você não tem acesso a este documento." : response.status === 404 ? "O documento não foi encontrado." : response.status === 401 ? "Sessão expirada. Entre novamente." : "Não foi possível carregar o documento.", response.status);
		return await response.blob();
	} finally {
		clearTimeout(timeout);
	}
}
async function fetchPrivateMedia(path) {
	const safePath = privateMediaPath(path);
	try {
		return await downloadOnce(safePath);
	} catch (error) {
		if (!(error instanceof ApiError) || error.status !== 401) throw error;
		await requestAuth("/api/v1/clients/whoami");
		return await downloadOnce(safePath);
	}
}
//#endregion
export { fetchPrivateMedia as t };
