import { test, expect } from "@playwright/test";

test.describe("app-supletivo · smoke (v2)", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("/healthz responde ok e expõe proveniência do build", async ({ request }) => {
    const res = await request.get("/healthz");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body).toHaveProperty("sha");
    expect(body).toHaveProperty("builtAt");
  });

  test("home renderiza login universal quando desautenticado", async ({ page }) => {
    await page.goto("/", { waitUntil: "commit" });
    await expect(page.locator("h1")).toHaveText("Acesse sua conta");
    await expect(page).toHaveTitle(/Entrar|Supletivo Brasil/i);
  });

  test("fluxo zero-button: telefone válido dispara /api/v1/auth/otp/send e avança para OTP", async ({ page }) => {
    await page.route("**/api/v1/auth/check", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          found: true,
          phone: "5511999999999",
          roles: ["client"],
        }),
      });
    });

    await page.route("**/api/v1/auth/otp/send", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          channel: "whatsapp",
          cooldown_seconds: 60,
        }),
      });
    });

    await page.goto("/");
    const phoneInput = page.locator("#phone");
    await expect(phoneInput).toBeVisible();
    await expect(phoneInput).toHaveAttribute("data-hydrated", "true");

    await phoneInput.fill("11999999999");
    await page.waitForURL("**/autenticacao/otp**", { timeout: 15000 });
    expect(page.url()).toContain("/autenticacao/otp");
    expect(page.url()).toContain("tel=11999999999");
  });

  test("autenticação OTP zero-button valida 6 dígitos em /api/v1/auth/otp/verify e redireciona", async ({ page }) => {
    const externalId = "11111111-1111-4111-8111-111111111111";

    await page.route("**/api/v1/auth/otp/verify", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "e2e-access-token",
          refresh_token: "e2e-refresh-token",
          token_type: "bearer",
          roles: [{ role: "client", status: "enrolled" }],
        }),
      });
    });

    await page.route("**/api/v1/auth/whoami", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          authenticated: true,
          id: externalId,
          external_id: externalId,
          phone: "5511999999999",
          name: "Aluno Teste",
          cpf: "11144477735",
          roles: ["client"],
          active_role: "client",
          role_statuses: { client: "enrolled" },
          status: "enrolled",
          substatus: "siga_active",
        }),
      });
    });

    await page.route("**/api/v1/student/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: { id: externalId, phone: "5511999999999", name: "Aluno Teste", full_name: "Aluno Teste", cpf: "11144477735", gender: null, blood_type: "O+" },
          role: { id: "role-1", role: "client", status: "enrolled", substatus: "siga_active" },
          siga_credentials: null,
          document_progress: { blood_type_registered: true, military_exempt: false, academic_documents_ready: false, checklist: {} },
        }),
      });
    });

    await page.goto(`/autenticacao/otp?tel=11999999999`);
    await expect(page.locator("h1")).toHaveText("Digite seu código");

    const otp0 = page.locator("#otp-0");
    await expect(otp0).toHaveAttribute("data-hydrated", "true", { timeout: 15000 });

    for (let i = 0; i < 6; i++) {
      await page.locator(`#otp-${i}`).fill(String(i + 1));
    }

    await page.waitForURL((url) => url.pathname.includes("/student"), { timeout: 15000 });
    expect(page.url()).toMatch(/\/student/);
  });
});
