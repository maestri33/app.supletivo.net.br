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
          role_statuses: { student: "active" },
          user: {
            external_id: "22222222-2222-4222-8222-222222222222",
            roles: ["aluno"],
            role_statuses: { student: "active" },
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
          role_statuses: { student: "active" },
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
          status: "active",
          pendencies: [{ id: "doc-1", type: "id_card" }],
          platform: { url: "https://ava.parceiro.com.br" },
        }),
      });
    });

    await page.goto("/student/active/dashboard");

    // Permanece no dock globalmente
    const homeItem = page.locator("a[href='/student/active/dashboard']").first();
    await expect(homeItem).toBeVisible({ timeout: 10000 });

    const docItem = page.locator("a[href='/student/active/documents']").first();
    await expect(docItem).toBeVisible({ timeout: 10000 });
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
          role_statuses: { student: "enrollment", promoter: "candidate" },
          user: {
            external_id: "33333333-3333-4333-8333-333333333333",
            roles: ["aluno", "promotor"],
            role_statuses: { student: "enrollment", promoter: "candidate" },
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
          role_statuses: { student: "enrollment", promoter: "candidate" },
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

    await page.goto("/tabs-status");

    // As duas tabs superiores devem ser exibidas
    const root = page.getByTestId("role-status-tabs-root");
    const tabAluno = root.getByRole("button", { name: "🎓 Aluno" });
    const tabPromotor = root.getByRole("button", { name: "💼 Promotor" });
    await expect(tabAluno).toBeVisible({ timeout: 10000 });
    await expect(tabPromotor).toBeVisible();

    // Inicialmente dock do aluno no status awaiting_documents tem itens de documentação
    await expect(page.locator("a[href='/student/enrollment/rg']").first()).toBeVisible();

    // Clica na tab Promotor
    await tabPromotor.click();

    // O dock deve transmutar para os itens de credenciamento do candidato (#documents, #pix, etc.)
    await expect(page.locator("a[href='#pix']").first()).toBeVisible();

    // Alterna para o status de Promotor Ativo
    await page.locator("button[role='tab']:has-text('Promotor Ativo')").click();

    // O dock deve transmutar para os itens do Promotor Ativo (/promoter/active/dashboard e /promoter/active/leads)
    await expect(page.locator("a[href='/promoter/active/dashboard']").first()).toBeVisible();
    await expect(page.locator("a[href='/promoter/active/leads']").first()).toBeVisible();
  });
});
