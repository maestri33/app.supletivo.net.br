import { test, expect } from "@playwright/test";

test.describe("Autenticação Canônica do Aluno na Raiz (Login Universal)", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.addInitScript(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
    });
  });

  test("deve renderizar a raiz / com design system canônico e fluxo zero-button", async ({ page }) => {
    await page.goto("/");

    // Verifica presença do container de login e título unificado na raiz
    await expect(page.locator("h1")).toHaveText("Acesse sua conta");
    const input = page.locator("#phone");
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute("data-hydrated", "true");

    // Digita telefone válido (11 dígitos)
    await input.fill("11987654321");
    await expect(input).toHaveValue("(11) 98765-4321");

    // Em fluxo zero-button, não existe botão de submit manual
    await expect(page.locator("button[type='submit']")).toHaveCount(0);
  });

  test("deve redirecionar /autenticacao/otp para a raiz / se não houver dados de sessão", async ({ page }) => {
    await page.goto("/autenticacao/otp");
    // Sem sessão salva e sem query params, deve voltar para o login na raiz
    await page.waitForURL((url) => url.pathname === "/" || url.pathname === "");
    expect(new URL(page.url()).pathname).toBe("/");
  });

  test("deve carregar /autenticacao/otp com sucesso quando parâmetros forem fornecidos via query", async ({ page }) => {
    await page.goto("/autenticacao/otp?id=mock-external-id&tel=11987654321");

    await expect(page.locator("h1")).toHaveText("Digite seu código");
    await expect(page.locator(".font-mono.text-emerald-300")).toContainText("(11) 98765-4321");

    // Deve haver 6 campos de OTP
    const otpInputs = page.locator("input[id^='otp-']");
    await expect(otpInputs).toHaveCount(6);

    // Em fluxo zero-button, não há botão manual de submissão no OTP
    await expect(page.locator("button[type='submit']")).toHaveCount(0);
  });
});
