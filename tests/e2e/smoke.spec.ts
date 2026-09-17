import { test, expect } from "@playwright/test";

// Smoke mínimo e estável: não depende do backend Django nem de fluxos de UI
// instáveis. Valida que o Next sobe, a rota /healthz responde e o title/meta
// do app está no ar. Adicione specs por feature conforme os fluxos ganham forma.

test.describe("app-supletivo · smoke", () => {
  test("/healthz responde ok e expõe proveniência do build", async ({ request }) => {
    const res = await request.get("/healthz");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe("ok");
    // sha/builtAt podem vir "unknown" em dev local — só checamos presença.
    expect(body).toHaveProperty("sha");
    expect(body).toHaveProperty("builtAt");
  });

  test("home carrega com o title da marca", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.status()).toBe(200);
    await expect(page).toHaveTitle(/Supletivo Brasil/i);
  });

  test("redireciona para /autenticacao/login quando desautenticado", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("**/autenticacao/login");
    expect(page.url()).toContain("/autenticacao/login");
  });

  test("fluxo zero-button: telefone valido avança automaticamente para OTP", async ({ page }) => {
    const externalId = "11111111-1111-4111-8111-111111111111";

    await page.route("**/api/v1/clients/auth/check", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          found: true,
          external_id: externalId,
          otp_sent: true,
          otp_wait: 0,
          whatsapp: true,
          roles: ["aluno"],
        }),
      });
    });

    await page.goto("/autenticacao/login");
    const phoneInput = page.locator("#phone");
    await expect(phoneInput).toBeVisible();

    // Digita celular com DDD (11 dígitos) — auto-avanço zero-button
    await phoneInput.fill("11999999999");
    await page.waitForURL("**/autenticacao/otp**", { timeout: 10000 });
    expect(page.url()).toContain("/autenticacao/otp");
    expect(page.url()).toContain("tel=11999999999");
  });

  test("autenticacao OTP zero-button valida 6 dígitos e direciona dinamicamente", async ({ page }) => {
    const externalId = "11111111-1111-4111-8111-111111111111";

    await page.route("**/api/v1/clients/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "e2e-access-token",
          refresh_token: "e2e-refresh-token",
          token_type: "bearer",
        }),
      });
    });

    await page.route("**/api/v1/clients/whoami", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          external_id: externalId,
          roles: ["aluno"],
          name: "Aluno Teste",
        }),
      });
    });

    await page.route("**/api/v1/clients/lead/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          external_id: externalId,
          status: "active",
          created_at: "2026-01-01T00:00:00Z",
          customer: { name: "Aluno Teste" },
          promoter: {},
          checkout: { is_paid: true },
        }),
      });
    });

    await page.goto(`/autenticacao/otp?id=${externalId}&tel=11999999999`);
    await expect(page.locator("h1")).toHaveText("Digite seu código");

    // Preenche os 6 dígitos tecla a tecla
    const otp0 = page.locator("#otp-0");
    await otp0.click();
    await otp0.pressSequentially("123456", { delay: 50 });

    // Validação automática sem botão manual e redirecionamento para /painel
    await page.waitForURL("**/painel", { timeout: 10000 });
    expect(page.url()).toContain("/painel");
  });
});
