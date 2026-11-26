import { test, expect } from "@playwright/test";

test.describe("Checkout e completude cadastral (409 PROFILE_INCOMPLETE -> CPF Lookup)", () => {
  test("solicita CPF após 409 PROFILE_INCOMPLETE, consulta /api/v1/auth/cpf/lookup e retenta checkout", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      (window as unknown as { __TEST_TURNSTILE_TOKEN__?: string }).__TEST_TURNSTILE_TOKEN__ =
        "e2e-turnstile-ok";
      localStorage.setItem(
        "supletivo.login",
        JSON.stringify({
          access_token: "test-token",
          refresh_token: "test-refresh",
          roles: ["client"],
          role_statuses: { client: "lead" },
        }),
      );
    });

    let hasCpf = true; // Initially true in whoami so checkout triggers backend 409 guard
    let cpfSaved = false;

    await page.route("**/api/v1/catalog/pricing", (r) =>
      r.fulfill({ json: { pix: "999.00", promo_pix: "999.00", card: null, promo_card: null } }),
    );
    await page.route("**/api/v1/catalog/contact", (r) =>
      r.fulfill({ json: { email: "contato@supletivo.net.br", whatsapp_number: null } }),
    );
    await page.route("**/api/v1/student/payment/current", (r) =>
      r.fulfill({ status: 404, json: { error: "none" } }),
    );
    await page.route("**/api/v1/auth/whoami", (r) =>
      r.fulfill({
        json: {
          authenticated: true,
          id: "u-lead",
          external_id: "u-lead",
          phone: "5511999999999",
          cpf: hasCpf && cpfSaved ? "09126367939" : hasCpf ? "09126367939" : null,
          email: "aluno@example.test",
          name: "Lead",
          roles: ["client"],
          active_role: "client",
          role_statuses: { client: "lead" },
          status: "lead",
        },
      }),
    );

    let checkouts = 0;
    await page.route("**/api/v1/checkout/create", (r) => {
      checkouts += 1;
      if (checkouts === 1) {
        hasCpf = false;
        return r.fulfill({
          status: 409,
          json: {
            error: "Complete seu cadastro antes de gerar o checkout.",
            code: "PROFILE_INCOMPLETE",
            missing_fields: ["cpf"],
          },
        });
      }
      return r.fulfill({
        json: {
          payment_id: "pay-retry-1",
          checkout_url: "https://pay.infinitepay.io/retry-ok",
          status: "pending",
        },
      });
    });

    let cpfPosts = 0;
    let postedBody: Record<string, unknown> | null = null;
    await page.route("**/api/v1/auth/cpf/lookup", (r) => {
      cpfPosts += 1;
      postedBody = r.request().postDataJSON();
      cpfSaved = true;
      hasCpf = true;
      return r.fulfill({ json: { valid: true, cpf: "09126367939", name: "Lead Confirmado" } });
    });
    await page.route("**/pay.infinitepay.io/**", (r) =>
      r.fulfill({ contentType: "text/html", body: "<h1>InfinitePay OK</h1>" }),
    );

    await page.goto("/student/lead/payment");
    await page.getByRole("button", { name: /Ir para pagamento seguro InfinitePay/i }).click();

    await expect(page.getByLabel("CPF do aluno")).toBeVisible();
    await page.getByLabel("CPF do aluno").fill("09126367939");
    await page.getByRole("button", { name: /Salvar dados e ir para pagamento/i }).click();

    await page.waitForURL("https://pay.infinitepay.io/retry-ok");
    expect(cpfPosts).toBe(1);
    expect(postedBody).toMatchObject({ cpf: "09126367939", turnstile_token: "e2e-turnstile-ok" });
    expect(checkouts).toBe(2);
  });

  test("exibe erro de validação do CPF sem disparar checkout", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      (window as unknown as { __TEST_TURNSTILE_TOKEN__?: string }).__TEST_TURNSTILE_TOKEN__ =
        "e2e-turnstile-ok";
      localStorage.setItem(
        "supletivo.login",
        JSON.stringify({
          access_token: "test-token",
          refresh_token: "test-refresh",
          roles: ["client"],
          role_statuses: { client: "lead" },
        }),
      );
    });

    await page.route("**/api/v1/catalog/pricing", (r) =>
      r.fulfill({ json: { pix: "999.00", promo_pix: "999.00", card: null, promo_card: null } }),
    );
    await page.route("**/api/v1/catalog/contact", (r) =>
      r.fulfill({ json: { email: "contato@supletivo.net.br", whatsapp_number: null } }),
    );
    await page.route("**/api/v1/student/payment/current", (r) =>
      r.fulfill({ status: 404, json: { error: "none" } }),
    );
    await page.route("**/api/v1/auth/whoami", (r) =>
      r.fulfill({
        json: {
          authenticated: true,
          id: "u-lead",
          external_id: "u-lead",
          phone: "5511999999999",
          cpf: null,
          email: "aluno@example.test",
          name: "Lead",
          roles: ["client"],
          active_role: "client",
          role_statuses: { client: "lead" },
          status: "lead",
          substatus: "awaiting_cpf",
        },
      }),
    );

    let checkouts = 0;
    await page.route("**/api/v1/checkout/create", (r) => {
      checkouts += 1;
      return r.fulfill({ json: { payment_id: "x", checkout_url: "https://pay.infinitepay.io/x", status: "pending" } });
    });
    await page.route("**/api/v1/auth/cpf/lookup", (r) =>
      r.fulfill({ status: 422, json: { error: "CPF não encontrado na base cadastral." } }),
    );

    await page.goto("/student/lead/payment");
    await page.getByLabel("CPF do aluno").fill("09126367939");
    await page.getByRole("button", { name: /Salvar dados e ir para pagamento/i }).click();

    await expect(page.getByRole("alert")).toContainText("CPF não encontrado na base cadastral.");
    expect(checkouts).toBe(0);
  });
});
