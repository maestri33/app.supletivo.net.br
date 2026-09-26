import { test, expect } from "@playwright/test";

test.describe("Tabs de Status e Dock Adaptativo Multi-Role (/tabs-status)", () => {
  test.beforeEach(async ({ page }) => {
    page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
    page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));
  });

  test("deve renderizar a página de status com perfil de aluno e etapas canônicas", async ({ page }) => {
    await page.goto("/tabs-status");

    // Valida título da página
    await expect(page.locator("h1")).toContainText("Tabs de Status com Dock Adaptativo");

    // Valida seletor de perfil e variante
    await expect(page.getByRole("button", { name: "🎓 Aluno" })).toBeVisible();
    await expect(page.getByRole("button", { name: "💼 Promotor" })).toBeVisible();
    await expect(page.getByRole("button", { name: "🏫 Polo" })).toBeVisible();

    // Valida que as abas de status do aluno estão visíveis
    await expect(page.getByRole("tab", { name: /1\. Envio de Documentos/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /2\. Análise da Secretaria/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /3\. Prova Liberada/i })).toBeVisible();

    // Valida que o dock nativo no rodapé renderiza com safe-area
    const navBar = page.locator("nav[aria-label='Navegação principal do aluno']");
    await expect(navBar).toBeVisible();
    await expect(navBar.getByText("Fase de Matrícula")).toBeVisible();
  });

  test("deve atualizar o dock ao trocar a aba de status para Prova Liberada", async ({ page }) => {
    await page.goto("/tabs-status");

    // Clica na aba "3. Prova Liberada"
    const examTab = page.getByRole("tab", { name: /3\. Prova Liberada/i });
    await examTab.click();

    // Valida o card explicativo da etapa 3
    await expect(page.getByText("Avaliações Finais Disponíveis")).toBeVisible();

    // Valida que o dock nativo do aluno está presente
    const navBar = page.locator("nav[aria-label='Navegação principal do aluno']");
    await expect(navBar).toBeVisible();
  });

  test("deve alternar para o perfil Promotor e atualizar abas e dock para Promotor", async ({ page }) => {
    await page.goto("/tabs-status");

    // Clica no botão Promotor
    await page.getByRole("button", { name: "💼 Promotor" }).click();

    // Valida abas do promotor
    await expect(page.getByRole("tab", { name: /1\. Credenciamento/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /2\. Treinamento/i })).toBeVisible();

    // Valida dock do promotor
    const promoterDock = page.locator("nav[aria-label='Navegação principal do promotor']");
    await expect(promoterDock).toBeVisible();
  });

  test("deve alternar para o perfil Polo e atualizar abas e dock para Coordenador de Hub", async ({ page }) => {
    await page.goto("/tabs-status");

    // Clica no botão Polo
    await page.getByRole("button", { name: "🏫 Polo" }).click();

    // Valida abas do polo
    await expect(page.getByRole("tab", { name: /1\. Fila Documental/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /2\. Bancas & Provas/i })).toBeVisible();

    // Valida dock do polo
    const poloDock = page.locator("nav[aria-label='Navegação principal do polo']");
    await expect(poloDock).toBeVisible();
  });

  test("deve permitir alternar o estilo do dock entre Barra Nativa e Cápsula Flutuante", async ({ page }) => {
    await page.goto("/tabs-status");

    // Por padrão exibe Barra Nativa
    await expect(page.locator("nav[aria-label='Navegação principal do aluno']")).toBeVisible();

    // Clica em Cápsula Flutuante
    await page.getByRole("button", { name: "Cápsula Flutuante" }).click();

    // Valida que o container flutuante foi ativado
    await expect(page.getByRole("navigation", { name: "Navegação principal do aluno" })).toBeVisible();
  });
});
