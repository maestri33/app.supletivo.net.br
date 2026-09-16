import { test, expect } from "@playwright/test";

test.describe("Autenticação Canônica do Aluno (Issue #2 & #3)", () => {
  test("deve renderizar /autenticacao/login com design system canônico", async ({ page }) => {
    await page.goto("/autenticacao/login");

    // Verifica presença do container de login e título
    await expect(page.locator("h1")).toHaveText("Acesse sua conta");
    const input = page.locator("#student-phone");
    await expect(input).toBeVisible();

    // Botão inicialmente desabilitado
    const submitBtn = page.locator("button[type='submit']");
    await expect(submitBtn).toBeDisabled();

    // Digita telefone válido
    await input.fill("11987654321");
    await expect(input).toHaveValue("(11) 98765-4321");
    await expect(submitBtn).toBeEnabled();
  });

  test("deve redirecionar /autenticacao/otp para /autenticacao/login se não houver dados de sessão", async ({ page }) => {
    await page.goto("/autenticacao/otp");
    // Sem sessão salva e sem query params, deve voltar para o login
    await page.waitForURL("/autenticacao/login");
    expect(page.url()).toContain("/autenticacao/login");
  });

  test("deve carregar /autenticacao/otp com sucesso quando parâmetros forem fornecidos via query", async ({ page }) => {
    await page.goto("/autenticacao/otp?id=mock-external-id&tel=11987654321");

    await expect(page.locator("h1")).toHaveText("Digite seu código");
    await expect(page.locator(".font-mono.text-emerald-300")).toContainText("(11) 98765-4321");

    // Deve haver 6 campos de OTP
    const otpInputs = page.locator("input[id^='otp-']");
    await expect(otpInputs).toHaveCount(6);
  });
});
