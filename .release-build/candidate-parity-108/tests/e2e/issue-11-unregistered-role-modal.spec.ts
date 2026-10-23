import { test, expect } from "@playwright/test";

test.describe("Modal de Escolha de Papel para WhatsApp Não Cadastrado (Issue #11)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/autenticacao/login");
    await page.waitForSelector("[data-hydrated='true']", { timeout: 15000 });
  });

  test("1. Número com WhatsApp ativo e sem cadastro abre modal com 2 cards e SVGs animados", async ({ page }) => {
    await page.route("**/api/v1/clients/auth/check", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          found: false,
          registered: false,
          external_id: null,
          whatsapp: true,
        }),
      });
    });

    const phoneInput = page.locator("#phone");
    await phoneInput.fill("11987654321");

    // Modal deve abrir automaticamente
    const modal = page.getByTestId("unregistered-role-modal");
    await expect(modal).toBeVisible({ timeout: 10000 });
    await expect(modal.getByText("Como deseja continuar?")).toBeVisible();

    // Dois cards visíveis com SVGs animados
    const cardAluno = page.getByTestId("card-role-aluno");
    const cardPromotor = page.getByTestId("card-role-promotor");

    await expect(cardAluno).toBeVisible();
    await expect(cardAluno).toContainText("Quero ser Aluno");
    await expect(cardAluno).toContainText("Ensino Médio");
    await expect(cardAluno.locator("svg")).toBeVisible();

    await expect(cardPromotor).toBeVisible();
    await expect(cardPromotor).toContainText("Quero ser Promotor");
    await expect(cardPromotor).toContainText("Renda Extra");
    await expect(cardPromotor.locator("svg")).toBeVisible();
  });

  test("2. Selecionar 'Quero ser Promotor' leva para a landing page de promotor", async ({ page }) => {
    await page.route("**/api/v1/clients/auth/check", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          found: false,
          registered: false,
          whatsapp: true,
        }),
      });
    });

    const phoneInput = page.locator("#phone");
    await phoneInput.fill("11987654321");

    const cardPromotor = page.getByTestId("card-role-promotor");
    await expect(cardPromotor).toBeVisible({ timeout: 10000 });

    // Verifica que o link aponta para promotor.supletivo.net.br com os parâmetros
    const href = await cardPromotor.getAttribute("href");
    expect(href).toContain("https://promotor.supletivo.net.br");
    expect(href).toContain("tel=11987654321");
    expect(href).toContain("modal=cadastro");
  });

  test("3. Selecionar 'Quero ser Aluno' leva para a landing page de aluno", async ({ page }) => {
    await page.route("**/api/v1/clients/auth/check", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          found: false,
          registered: false,
          whatsapp: true,
        }),
      });
    });

    const phoneInput = page.locator("#phone");
    await phoneInput.fill("11987654321");

    const cardAluno = page.getByTestId("card-role-aluno");
    await expect(cardAluno).toBeVisible({ timeout: 10000 });

    // Verifica que o link aponta para supletivo.net.br com os parâmetros
    const href = await cardAluno.getAttribute("href");
    expect(href).toContain("https://supletivo.net.br");
    expect(href).toContain("tel=11987654321");
    expect(href).toContain("modal=cadastro");
  });

  test("4. Pressionar ESC ou fechar fecha o modal e mantém o número para edição", async ({ page }) => {
    await page.route("**/api/v1/clients/auth/check", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          found: false,
          registered: false,
          whatsapp: true,
        }),
      });
    });

    const phoneInput = page.locator("#phone");
    await phoneInput.fill("11987654321");

    const modal = page.getByTestId("unregistered-role-modal");
    await expect(modal).toBeVisible({ timeout: 10000 });

    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();

    // O input continua com o valor digitado para o usuário editar
    await expect(phoneInput).toHaveValue("(11) 98765-4321");
  });
});
