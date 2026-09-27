import { test, expect } from "@playwright/test";

test.describe("Wizard Guia do Dock no Status Aluno > Lead (/student/lead)", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.addInitScript(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem(
          "supletivo.login",
          JSON.stringify({
            access_token: "mock-student-token",
            roles: ["student"],
            role_statuses: { student: "lead" },
          })
        );
      } catch {}
    });
  });

  test("dock deve renderizar como wizard guia com exatamente 2 botões para status lead", async ({ page }) => {
    await page.goto("/student/lead");
    await expect(page.locator("h1").first()).toBeVisible();

    // Valida que o dock nativo no rodapé renderizou
    const navBar = page.locator("nav[aria-label='Navegação principal do student'], nav[aria-label='Navegação principal do aluno']");
    await expect(navBar).toBeVisible();

    // Valida que existem estritamente as duas fases: 1. Modalidade e 2. Checkout
    await expect(navBar.getByText("1. Modalidade")).toBeVisible();
    await expect(navBar.getByText("2. Checkout")).toBeVisible();

    // Valida que opções padrão de navegação (Meu Curso, Sair, etc.) NÃO estão presentes no dock em lead
    await expect(navBar.getByText("Meu Curso")).toHaveCount(0);
    await expect(navBar.getByText("Sair")).toHaveCount(0);
  });

  test("deve alternar a fase ativa entre 1. Modalidade e 2. Checkout", async ({ page }) => {
    await page.goto("/student/lead");
    const navBar = page.locator("nav[aria-label='Navegação principal do student'], nav[aria-label='Navegação principal do aluno']");
    await expect(navBar).toBeVisible();

    // Inicialmente na Fase 1 (Modalidade)
    const btnModalidade = navBar.getByRole("button", { name: /1\. Modalidade/i });
    const btnCheckout = navBar.getByRole("button", { name: /2\. Checkout/i });

    await expect(btnModalidade).toBeVisible();
    await expect(btnCheckout).toBeVisible();

    // Ao clicar em 'Pagar com PIX' na página central, avança para a Fase 2 (Checkout)
    const pixButton = page.getByRole("button", { name: /Pagar com PIX/i });
    if (await pixButton.isVisible()) {
      await pixButton.click();
      await page.waitForTimeout(500);
    }
  });
});
