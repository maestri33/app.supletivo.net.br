import { ApiError, requestAuth } from "./api";
import { getAccessToken } from "./session";
import { withDeadline } from "./deadline";

/** Restrict authenticated downloads to the same-origin media proxy. */
export function privateMediaPath(path: string): string {
  const value = path.trim();
  if (!value || /^[a-z][a-z\d+.-]*:/i.test(value) || value.startsWith("//")) {
    throw new Error("O endereço do documento não é válido.");
  }
  let decoded: string;
  try { decoded = decodeURIComponent(value); }
  catch { throw new Error("O endereço do documento não é válido."); }
  if (decoded.includes("\\") || decoded.includes("?") || decoded.includes("#") || decoded.startsWith("//") || decoded.split("/").some(part => part === "." || part === "..")) {
    throw new Error("O endereço do documento não é válido.");
  }
  const relative = value.replace(/^\/+/, "");
  return relative.startsWith("media/") ? `/${relative}` : `/media/${relative}`;
}

async function downloadOnce(path: string): Promise<Blob> {
  const token = getAccessToken();
  if (!token) throw new ApiError("Sessão expirada. Entre novamente.", 401);
  const controller = new AbortController();
  return withDeadline(async () => {
    const response = await fetch(path, { headers: { Authorization: `Bearer ${token}` }, credentials: "same-origin", cache: "no-store", signal: controller.signal });
    if (!response.ok) throw new ApiError(response.status === 403 ? "Você não tem acesso a este documento." : response.status === 404 ? "O documento não foi encontrado." : response.status === 401 ? "Sessão expirada. Entre novamente." : "Não foi possível carregar o documento.", response.status);
    return await response.blob();
  }, 30_000, () => controller.abort());
}

export async function fetchPrivateMedia(path: string): Promise<Blob> {
  const safePath = privateMediaPath(path);
  try { return await downloadOnce(safePath); }
  catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    // Reuse the API's single-flight refresh and session-expiration handling.
    await requestAuth("/api/v1/clients/whoami");
    return await downloadOnce(safePath);
  }
}

/** Start during the click event to avoid popup blockers; never put a token in a URL. */
export async function openPrivateMedia(path: string): Promise<void> {
  const popup = window.open("about:blank", "_blank");
  if (popup) popup.opener = null;
  try {
    const blob = await fetchPrivateMedia(path);
    const url = URL.createObjectURL(blob);
    const previewable = ["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(blob.type.split(";")[0]);
    if (popup && previewable) {
      popup.location.replace(url);
      const timer = setInterval(() => {
        if (popup.closed) { URL.revokeObjectURL(url); clearInterval(timer); }
      }, 1_000);
      setTimeout(() => { URL.revokeObjectURL(url); clearInterval(timer); }, 300_000);
    } else {
      popup?.close();
      const link = document.createElement("a");
      link.href = url;
      link.download = path.split("/").pop() || "documento";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }
  } catch (error) { popup?.close(); throw error; }
}
