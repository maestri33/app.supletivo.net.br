import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { createServer } from "node:net";

const port = 3123;
const env = { ...process.env, CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE: "postgresql://postgres:postgres@127.0.0.1:55433/postgres" };
const server = spawn("cmd", ["/c", "npx", "wrangler", "dev", "./dist/server/entry.mjs", "--assets", "./dist/client", "--port", String(port), "--ip", "127.0.0.1", "-c", "wrangler.jsonc"], { cwd: process.cwd(), env, stdio: "ignore" });
function waitPort() { return new Promise((resolve, reject) => { const started = Date.now(); const probe = () => { const socket = createServer(); socket.once("error", () => { socket.close(); if (Date.now() - started > 30000) reject(new Error("server timeout")); else setTimeout(probe, 250); }); socket.once("listening", () => { socket.close(); resolve(); }); socket.listen(port, "127.0.0.1"); }; probe(); }); }
await waitPort();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.addInitScript(() => { localStorage.setItem("supletivo.login", JSON.stringify({ access_token: "preview", refresh_token: "preview" })); localStorage.setItem("supletivo.session", JSON.stringify({ phone: "5543996648750", externalId: "preview" })); });
await page.route("**/api/v1/clients/whoami", route => route.fulfill({ json: { external_id: "preview", roles: ["enrollment"], role_statuses: { student: "enrollment" }, name: "Aluno de demonstração" } }));
await page.route("**/api/v1/clients/enrollment/me", route => route.fulfill({ json: { external_id: "enrollment-preview", hub_external_id: "hub-preview", status: "education", selfie_verified: false, selfie_status: "pending", rg: { analysis_status: "approved", missing_fields: [] }, address_complete: true, address_proof: { exists: true, status: "approved" }, education: null, selfie: null } }));
await page.route("https://servicodados.ibge.gov.br/api/v1/localidades/estados**", route => route.fulfill({ json: [{ sigla: "PR", nome: "Paraná" }, { sigla: "SP", nome: "São Paulo" }] }));
await page.route("https://servicodados.ibge.gov.br/api/v1/localidades/estados/PR/municipios**", route => route.fulfill({ json: [{ nome: "Curitiba" }, { nome: "Ponta Grossa" }] }));
await page.goto(`http://127.0.0.1:${port}/student/enrollment/education`);
await page.getByRole("button", { name: "Ensino Médio", exact: true }).click();
await page.getByRole("button", { name: "2º ano", exact: true }).click();
await page.getByRole("button", { name: "Não terminei o ano", exact: true }).click();
await page.getByLabel("Estado da escola").selectOption("PR");
await page.getByLabel("Cidade da escola").fill("Curitiba");
await page.getByRole("button", { name: "Salvar escolaridade" }).click();
await page.screenshot({ path: "outputs/education-student-declaration-preview.png", fullPage: true });
await page.getByRole("dialog").getByRole("checkbox").check();
await page.screenshot({ path: "outputs/education-student-declaration-checked-preview.png", fullPage: true });
await browser.close();
server.kill();
