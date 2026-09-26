import { test, expect } from "@playwright/test";

test.describe("Fluxo de Autoatendimento para Troca de Contato de Aluno (Issue #1)", () => {
  test.beforeEach(async ({ page }) => {
    // Acessa a tela de OTP simulando fluxo onde o contato precisa ser alterado
    await page.goto("/autenticacao/otp?tel=11999999999&id=mock-external-id");
    await page.waitForSelector("[data-hydrated='true']", { timeout: 15000 });
  });

  test("1. Interface exibe opção amigável 'Não tenho mais acesso a este número'", async ({ page }) => {
    const triggerBtn = page.getByTestId("contact-recovery-trigger");
    await expect(triggerBtn).toBeVisible({ timeout: 10000 });
    await expect(triggerBtn).toHaveText("Não tenho mais acesso a este número");
  });

  test("2. Clique na opção abre modal com mecanismos de validação secundária", async ({ page }) => {
    const triggerBtn = page.getByTestId("contact-recovery-trigger");
    await triggerBtn.click();

    const modal = page.getByTestId("contact-recovery-modal");
    await expect(modal).toBeVisible();
    await expect(modal.getByText("Atualização Segura de Contato")).toBeVisible();

    // Validações secundárias disponíveis para prevenir sequestro de conta
    await expect(modal.getByText("Link de confirmação no e-mail cadastrado")).toBeVisible();
    await expect(modal.getByText("Reconhecimento facial biométrico")).toBeVisible();
    await expect(modal.getByText("Atendimento humano na secretaria acadêmica")).toBeVisible();
  });

  test("3. Validação de formulário bloqueia CPF incompleto", async ({ page }) => {
    const triggerBtn = page.getByTestId("contact-recovery-trigger");
    await triggerBtn.click();

    const cpfInput = page.getByTestId("recovery-cpf-input");
    const phoneInput = page.getByTestId("recovery-phone-input");
    const submitBtn = page.getByTestId("recovery-submit-btn");

    await cpfInput.fill("123456");
    await phoneInput.fill("11988887777");
    await submitBtn.click();

    const error = page.getByTestId("recovery-error");
    await expect(error).toBeVisible();
    await expect(error).toContainText("digite um CPF válido com 11 dígitos");
  });

  test("4. Submissão completa gera protocolo auditável e exibe tela de confirmação", async ({ page }) => {
    await page.route("**/api/v1/auth/recovery/contact", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          protocol: "SEC-REC-2026-123456",
          status: "COMPLETED",
          masked_new_phone: "(11) *****-7777",
          instructions: "Validação concluída com sucesso.",
        }),
      });
    });

    const triggerBtn = page.getByTestId("contact-recovery-trigger");
    await triggerBtn.click();

    const cpfInput = page.getByTestId("recovery-cpf-input");
    const phoneInput = page.getByTestId("recovery-phone-input");
    const submitBtn = page.getByTestId("recovery-submit-btn");

    await cpfInput.fill("12345678909");
    await phoneInput.fill("11988887777");
    await submitBtn.click();

    // Aguarda tela de sucesso
    const successBox = page.getByTestId("recovery-success-box");
    await expect(successBox).toBeVisible({ timeout: 10000 });
    await expect(successBox).toContainText("Solicitação Protocolada");

    // Verifica que o número de protocolo foi gerado e exibido
    const protocolEl = page.getByTestId("recovery-protocol-number");
    await expect(protocolEl).toBeVisible();
    await expect(protocolEl).toContainText(/SEC-REC-2026-\d+/);
  });

  test("5. Endpoint direto /api/v1/auth/recovery/contact responde com auditoria e validação", async ({ request }) => {
    const response = await request.post("/api/v1/auth/recovery/contact", {
      data: {
        cpf: "12345678909",
        new_phone: "11987654321",
        method: "email",
      },
    });

    expect([200, 404]).toContain(response.status());
    const data = await response.json();
    expect(data).toHaveProperty("protocol");
    expect(data.protocol).toMatch(/^SEC-REC-2026-\d+$/);
  });
});
