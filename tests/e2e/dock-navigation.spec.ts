import { test, expect } from "@playwright/test";

test.describe("Navegação Global e Adaptativa (RoleAdaptiveNavDock)", () => {
  test("não deve renderizar a dock flutuante em rotas públicas de autenticação", async ({ page }) => {
    await page.goto("/autenticacao/login");
    const dock = page.getByTestId("role-adaptive-dock");
    await expect(dock).toHaveCount(0);
  });

  test("deve exibir a dock adaptativa globalmente no painel quando autenticado", async ({ page }) => {
    const externalId = "22222222-2222-4222-8222-222222222222";

    // Simula sessão de login autenticado
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "supletivo.login",
        JSON.stringify({
          access_token: "mock-access-token",
          refresh_token: "mock-refresh-token",
          token_type: "bearer",
          roles: ["aluno"],
          user: {
            external_id: "22222222-2222-4222-8222-222222222222",
            roles: ["aluno"],
          },
          savedAt: Date.now(),
        })
      );
    });

    await page.route("**/api/v1/clients/whoami", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          external_id: externalId,
          roles: ["aluno"],
          name: "Maria Silva",
        }),
      });
    });

    await page.route("**/api/v1/clients/lead/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          external_id: externalId,
          status: "active",
          checkout: { is_paid: true },
        }),
      });
    });

    await page.route("**/api/v1/clients/student/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          external_id: externalId,
          status: "awaiting_documents",
          pendencies: [{ id: "doc-1", type: "id_card" }],
          platform: { url: "https://ava.parceiro.com.br" },
        }),
      });
    });

    await page.goto("/painel");

    // Dock visível
    const dock = page.getByTestId("role-adaptive-dock");
    await expect(dock).toBeVisible({ timeout: 10000 });

    // Item de Documentação com link ativo ou presente
    const docItem = page.locator("a[href='/documentos']").first();
    await expect(docItem).toBeVisible();

    // Navega para /documentos e verifica que o dock permanece globalmente
    await page.goto("/documentos");
    const dockOnDocs = page.getByTestId("role-adaptive-dock");
    await expect(dockOnDocs).toBeVisible({ timeout: 10000 });
  });

  test("deve transmutar itens do dock ao alternar tabs em usuário multi-role", async ({ page }) => {
    const externalId = "33333333-3333-4333-8333-333333333333";

    await page.addInitScript(() => {
      window.localStorage.setItem(
        "supletivo.login",
        JSON.stringify({
          access_token: "mock-multi-role-token",
          refresh_token: "mock-refresh-token",
          token_type: "bearer",
          roles: ["aluno", "promotor"],
          user: {
            external_id: "33333333-3333-4333-8333-333333333333",
            roles: ["aluno", "promotor"],
          },
          savedAt: Date.now(),
        })
      );
    });

    await page.route("**/api/v1/clients/whoami", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          external_id: externalId,
          roles: ["aluno", "promotor"],
          name: "Carlos Consultor",
        }),
      });
    });

    await page.route("**/api/v1/clients/lead/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          external_id: externalId,
          status: "active",
          checkout: { is_paid: true },
        }),
      });
    });

    await page.route("**/api/v1/clients/student/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          external_id: externalId,
          status: "exam_released",
          pendencies: [],
        }),
      });
    });

    await page.goto("/painel");

    // As duas tabs superiores devem ser exibidas
    const tabAluno = page.locator("button:has-text('Aluno')");
    const tabPromotor = page.locator("button:has-text('Promotor')");
    await expect(tabAluno).toBeVisible({ timeout: 10000 });
    await expect(tabPromotor).toBeVisible();

    // Inicialmente dock tem /documentos
    await expect(page.locator("a[href='/documentos']").first()).toBeVisible();

    // Clica na tab Promotor
    await tabPromotor.click();

    // O dock deve transmutar para os itens do Promotor (/promotor/leads, /promotor/comissoes)
    await expect(page.locator("a[href='/promotor/leads']").first()).toBeVisible();
    await expect(page.locator("a[href='/promotor/comissoes']").first()).toBeVisible();
  });
});
