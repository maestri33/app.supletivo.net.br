import { test, expect } from "@playwright/test";

test.describe("Recuperação de Conta e Troca de Número de WhatsApp por CPF (Issue #12)", () => {
  test("1. Rota /autenticacao/recuperar-numero com query params redireciona para /autenticacao/otp e abre o modal de recuperação", async ({ page }) => {
    await page.goto("/autenticacao/recuperar-numero?cpf=11144477735&novo_telefone=43988889999&role=promoter");

    // Deve redirecionar para a tela de OTP com open_recovery=true
    await expect(page).toHaveURL(/\/autenticacao\/otp.*open_recovery=true/);

    // O modal deve abrir automaticamente
    const modal = page.getByTestId("contact-recovery-modal");
    await expect(modal).toBeVisible({ timeout: 15000 });
    await expect(modal.getByText("Atualização Segura de Contato")).toBeVisible();

    // Os campos devem estar pré-preenchidos a partir dos parâmetros da URL
    const cpfInput = page.getByTestId("recovery-cpf-input");
    await expect(cpfInput).toHaveValue("111.444.777-35");

    const phoneInput = page.getByTestId("recovery-phone-input");
    await expect(phoneInput).toHaveValue("(43) 98888-9999");
  });

  test("2. Rota legada /recuperar-numero redireciona com 308 para /autenticacao/recuperar-numero", async ({ request }) => {
    const response = await request.get("/recuperar-numero?cpf=11144477735&novo_telefone=43988889999", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    const location = response.headers().location || "";
    expect(location).toContain("/autenticacao/recuperar-numero");
    expect(location).toContain("cpf=11144477735");
  });

  test("3. Modal suporta seleção do método de Data de Nascimento e validação assistida", async ({ page }) => {
    await page.goto("/autenticacao/otp?tel=43999999999&id=mock-user-12");
    await page.waitForSelector("[data-hydrated='true']", { timeout: 15000 });

    const triggerBtn = page.getByTestId("contact-recovery-trigger");
    await triggerBtn.click();

    const modal = page.getByTestId("contact-recovery-modal");
    await expect(modal).toBeVisible();

    // Seleciona confirmação por data de nascimento
    const birthDateRadio = modal.getByText("Confirmação por Data de Nascimento");
    await birthDateRadio.click();

    // Campo de data de nascimento deve ficar visível
    const birthDateInput = page.getByTestId("recovery-birthdate-input");
    await expect(birthDateInput).toBeVisible();
    await birthDateInput.fill("15051992");
    await expect(birthDateInput).toHaveValue("15/05/1992");
  });

  test("4. API /api/v1/auth/recovery/contact responde com protocolo e formato padronizado", async ({ request }) => {
    const response = await request.post("/api/v1/auth/recovery/contact", {
      data: {
        cpf: "11144477735",
        new_phone: "43988889999",
        birth_date: "15/05/1992",
        method: "birth_date",
      },
    });

    expect([200, 404]).toContain(response.status());
    const data = await response.json();
    expect(data.protocol).toMatch(/^SEC-REC-/);
  });
});
