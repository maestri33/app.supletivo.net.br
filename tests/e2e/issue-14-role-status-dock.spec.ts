import { test, expect } from "@playwright/test";

test.describe("Tabs de Status e Dock Adaptativo v2 (/tabs-status)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tabs-status");
    await expect(page.locator('[data-testid="role-status-tabs-root"][data-hydrated="true"]')).toBeVisible({ timeout: 10000 });
  });

  test("renderiza apenas os perfis Aluno e Administrador e etapas canônicas", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Tabs de Status com Dock Adaptativo", level: 1 })).toBeVisible();

    const root = page.getByTestId("role-status-tabs-root");
    await expect(root.getByRole("button", { name: /Aluno/i })).toBeVisible();
    await expect(root.getByRole("button", { name: /Admin/i })).toBeVisible();
    await expect(root.getByRole("button", { name: /Promotor|Polo/i })).toHaveCount(0);

    await expect(page.getByRole("tab", { name: /1\. Pagamento/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /2\. Matrícula & Documentos/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /3\. Aluno Ativo & Provas/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /4\. Conclusão & Diploma/i })).toBeVisible();

    const navBar = page.locator("nav[aria-label='Navegação principal do student']");
    await expect(navBar).toBeVisible();
  });

  test("alterna para Administrador e atualiza o dock para os módulos /admin/*", async ({ page }) => {
    await page.getByTestId("role-status-tabs-root").getByRole("button", { name: /Admin/i }).click();
    const adminDock = page.locator("nav[aria-label='Navegação principal do admin']");
    await expect(adminDock).toBeVisible();
    await expect(page.getByText(/Navegação administrativa entre Painel, Documentos/i)).toBeVisible();
  });

  test("alterna o estilo do dock entre Barra Nativa e Cápsula Flutuante", async ({ page }) => {
    await expect(page.locator("nav[aria-label='Navegação principal do student']")).toBeVisible();
    await page.getByRole("button", { name: "Cápsula Flutuante" }).click();
    await expect(page.getByTestId("role-adaptive-dock")).toBeVisible();
  });
});
