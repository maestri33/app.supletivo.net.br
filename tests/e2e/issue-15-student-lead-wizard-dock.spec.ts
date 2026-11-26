import { test, expect, type Page } from "@playwright/test";

function mockLeadSession(page: Page) {
  return page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    (window as unknown as { __TEST_TURNSTILE_TOKEN__?: string }).__TEST_TURNSTILE_TOKEN__ = "e2e-turnstile-ok";
    localStorage.setItem(
      "supletivo.login",
      JSON.stringify({
        access_token: "controlled-token",
        refresh_token: "controlled-refresh",
        roles: ["client"],
        role_statuses: { client: "lead" },
      }),
    );
  });
}

test.describe("Pagamento do lead (v2 InfinitePay)", () => {
  test.beforeEach(async ({ page }) => {
    await mockLeadSession(page);
    await page.route("**/api/v1/catalog/pricing", (route) =>
      route.fulfill({ json: { pix: "999.00", promo_pix: "999.00", card: null, promo_card: null, anchor_full: "1615.00" } }),
    );
    await page.route("**/api/v1/catalog/contact", (route) =>
      route.fulfill({ json: { email: "contato@supletivo.net.br", legal_name: "Supletivo Brasil" } }),
    );
    await page.route("**/api/v1/student/payment/current", (route) =>
      route.fulfill({ status: 404, json: { error: "none" } }),
    );
  });

  test("exibe condição única InfinitePay e solicita CPF/email quando faltam", async ({ page }) => {
    await page.route("**/api/v1/auth/whoami", (route) =>
      route.fulfill({
        json: {
          authenticated: true,
          id: "u-lead",
          external_id: "u-lead",
          phone: "5511999999999",
          cpf: null,
          email: null,
          name: "Lead",
          roles: ["client"],
          active_role: "client",
          role_statuses: { client: "lead" },
          status: "lead",
          substatus: "awaiting_cpf",
        },
      }),
    );

    await page.goto("/student/lead/payment");
    await expect(page.getByText("R$ 999,00", { exact: true })).toBeVisible();
    await expect(page.getByText(/12x com juros calculados no checkout da InfinitePay/i)).toBeVisible();
    await expect(page.getByLabel("CPF do aluno")).toBeVisible();
    await expect(page.getByLabel("E-mail pessoal")).toBeVisible();
    await expect(page.getByText(/12x sem juros|12x de R\$\s*99\b|1\.188,00/i)).toHaveCount(0);
  });

  test("redireciona para o link InfinitePay devolvido por /api/v1/checkout/create", async ({ page }) => {
    await page.route("**/api/v1/auth/whoami", (route) =>
      route.fulfill({
        json: {
          authenticated: true,
          id: "u-lead",
          external_id: "u-lead",
          phone: "5511999999999",
          cpf: "11144477735",
          email: "aluno@example.test",
          name: "Lead",
          roles: ["client"],
          active_role: "client",
          role_statuses: { client: "lead" },
          status: "lead",
        },
      }),
    );
    await page.route("**/api/v1/checkout/create", (route) =>
      route.fulfill({
        json: {
          payment_id: "pay-1",
          checkout_url: "https://pay.infinitepay.io/controlled-order",
          status: "pending",
        },
      }),
    );
    await page.route("**/pay.infinitepay.io/**", (route) =>
      route.fulfill({ contentType: "text/html", body: "<h1>InfinitePay Mock</h1>" }),
    );

    await page.goto("/student/lead/payment");
    await page.getByRole("button", { name: /Ir para pagamento seguro InfinitePay/i }).click();
    await page.waitForURL("https://pay.infinitepay.io/controlled-order");
  });

  test("retorno InfinitePay confirma em /api/v1/student/payment/card-confirmation e segue para matrícula", async ({ page }) => {
    let cardConfirmed = false;
    await page.route("**/api/v1/auth/whoami", (route) => {
      const status = cardConfirmed ? "pre_enrolled" : "lead";
      const substatus = cardConfirmed ? "rg_pending" : null;
      return route.fulfill({
        json: {
          authenticated: true,
          id: "u-lead",
          external_id: "u-lead",
          phone: "5511999999999",
          cpf: "11144477735",
          email: "aluno@example.test",
          roles: ["client"],
          active_role: "client",
          role_statuses: { client: status },
          status,
          substatus,
        },
      });
    });

    let postedRefs: unknown = null;
    await page.route("**/api/v1/student/payment/card-confirmation", async (route) => {
      cardConfirmed = true;
      postedRefs = route.request().postDataJSON();
      await route.fulfill({
        json: {
          success: true,
          paid: true,
          status: "paid",
          payment_id: "pay-1",
          order_nsu: "order-123",
        },
      });
    });

    await page.goto("/student/lead?order_nsu=order-123&transaction_nsu=tx-456&slug=slug-789");
    await page.waitForURL(/\/student\/enrollment/);
    expect(postedRefs).toEqual({
      order_nsu: "order-123",
      transaction_nsu: "tx-456",
      slug: "slug-789",
    });
  });
});
