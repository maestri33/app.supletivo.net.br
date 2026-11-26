import { test, expect } from "@playwright/test";

test.describe("Recuperação segura de contato em 3 etapas (Issue #1 — v2)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/autenticacao/otp?tel=11999999999");
    await page.waitForSelector("[data-hydrated='true']", { timeout: 15000 });
  });

  test("1. Exibe botão 'Não tenho mais acesso a este número' e abre modal v2", async ({ page }) => {
    const triggerBtn = page.getByTestId("contact-recovery-trigger");
    await expect(triggerBtn).toBeVisible({ timeout: 10000 });
    await triggerBtn.click();

    const modal = page.getByTestId("contact-recovery-modal");
    await expect(modal).toBeVisible();
    await expect(modal.getByTestId("recovery-cpf-input")).toBeVisible();
  });

  test("2. Validação bloqueia CPF incompleto na etapa 1", async ({ page }) => {
    await page.getByTestId("contact-recovery-trigger").click();
    await page.getByTestId("recovery-cpf-input").fill("123456");
    await page.getByTestId("recovery-phone-input").fill("11988887777");
    await page.getByTestId("recovery-submit-btn").click();
    await expect(page.getByTestId("recovery-error")).toBeVisible();
  });

  test("3. Fluxo completo lookup -> send-otp -> verify-and-link conclui troca de telefone", async ({ page }) => {
    await page.route("**/api/v1/auth/recover/lookup", (route) =>
      route.fulfill({
        json: {
          found: true,
          has_email: true,
          name_preview: "Aluno",
          masked_email: "al***@example.com",
          masked_phone: "(11) *****-9999",
        },
      }),
    );
    await page.route("**/api/v1/auth/recover/send-otp", (route) =>
      route.fulfill({ json: { sent: true, channel: "email", cooldown_seconds: 60 } }),
    );
    await page.route("**/api/v1/auth/recover/verify-and-link", (route) =>
      route.fulfill({
        json: {
          success: true,
          access_token: "recovered-access",
          refresh_token: "recovered-refresh",
          new_phone: "5511988887777",
        },
      }),
    );

    await page.getByTestId("contact-recovery-trigger").click();
    await page.getByTestId("recovery-cpf-input").fill("11144477735");
    await page.getByTestId("recovery-phone-input").fill("11988887777");
    await page.getByTestId("recovery-submit-btn").click();

    await expect(page.getByTestId("recovery-challenge-box")).toBeVisible();
    await page.getByTestId("recovery-otp-input").fill("123456");
    await page.getByTestId("recovery-verify-otp-btn").click();

    await expect(page.getByTestId("recovery-success-box")).toBeVisible({ timeout: 10000 });
  });
});
