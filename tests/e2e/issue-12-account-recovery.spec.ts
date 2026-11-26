import { test, expect } from "@playwright/test";

test.describe("Recuperação de Conta via /autenticacao/recuperar-numero (Issue #12 — v2)", () => {
  test("1. Rota /autenticacao/recuperar-numero pré-preenche CPF e novo telefone na tela de OTP", async ({ page }) => {
    await page.goto("/autenticacao/recuperar-numero?cpf=11144477735&novo_telefone=43988889999");

    await expect(page).toHaveURL(/\/autenticacao\/otp.*open_recovery=true/);
    const modal = page.getByTestId("contact-recovery-modal");
    await expect(modal).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("recovery-cpf-input")).toHaveValue("111.444.777-35");
  });

  test("2. Rota legada /recuperar-numero redireciona com 308 para /autenticacao/recuperar-numero", async ({ request }) => {
    const response = await request.get("/recuperar-numero?cpf=11144477735&novo_telefone=43988889999", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    const location = response.headers().location || "";
    expect(location).toContain("/autenticacao/recuperar-numero");
    expect(location).toContain("cpf=11144477735");
  });
});
