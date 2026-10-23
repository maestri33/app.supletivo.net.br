import { test, expect } from "@playwright/test";

test.describe("Componente de Verificação de Documento RG/CNH (Issue #6)", () => {
  test.beforeEach(async ({ page }) => {
    // Autentica localmente e navega para /aluno
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "supletivo.login",
        JSON.stringify({ access_token: "test-token", refresh_token: "refresh-token", token_type: "bearer" }),
      );
      window.localStorage.setItem(
        "supletivo.session",
        JSON.stringify({ phone: "11999999999", externalId: "3f8b1c2e-0a4d-4f11-9e77-2b6d5c8a1e90", role: "aluno" }),
      );
    });
    await page.goto("/aluno");
    await page.waitForSelector("[data-hydrated='true']", { timeout: 15000 });
  });

  test("1. Botão de status renderiza estado inicial Não Completo (Vermelho)", async ({ page }) => {
    const statusBtn = page.getByTestId("doc-verifier-status-btn");
    await expect(statusBtn).toBeVisible({ timeout: 10000 });
    await expect(statusBtn).toContainText("Identidade: Não Enviado");
    await expect(statusBtn).toHaveClass(/border-red-500/);
  });

  test("2. Toque no botão abre bottom sheet com 2 ações minimalistas", async ({ page }) => {
    const statusBtn = page.getByTestId("doc-verifier-status-btn");
    await statusBtn.click();

    const modal = page.getByTestId("doc-verifier-modal");
    await expect(modal).toBeVisible();
    await expect(modal.getByText("Anexar documento")).toBeVisible();
    await expect(modal.getByText("Tirar foto")).toBeVisible();
  });

  test("3. IA no front bloqueia imagem ilegível/embaçada com copy de orientação", async ({ page }) => {
    const statusBtn = page.getByTestId("doc-verifier-status-btn");
    await statusBtn.click();

    const fileInput = page.getByTestId("input-doc-file");
    const fakeBlurFile = {
      name: "rg_blur_embaçado.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.alloc(1024 * 10, "a"),
    };
    await fileInput.setInputFiles(fakeBlurFile);

    const errorBox = page.getByTestId("triage-error");
    await expect(errorBox).toBeVisible({ timeout: 5000 });
    await expect(errorBox).toContainText("A imagem ficou embaçada ou com reflexo");
  });

  test("4. IA no front valida CNH oficial em PDF vs scan", async ({ page }) => {
    const statusBtn = page.getByTestId("doc-verifier-status-btn");
    await statusBtn.click();

    // Seleciona CNH
    const cnhTab = page.getByTestId("cnh-tab-btn");
    await cnhTab.click();

    const fileInput = page.getByTestId("input-doc-file");
    const fakeScanPdf = {
      name: "cnh_scan_foto.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.alloc(1024 * 12, "pdf"),
    };
    await fileInput.setInputFiles(fakeScanPdf);

    const errorBox = page.getByTestId("triage-error");
    await expect(errorBox).toBeVisible({ timeout: 5000 });
    await expect(errorBox).toContainText("Para CNH em PDF, envie apenas o arquivo oficial exportado");
  });

  test("5. Fluxo completo Frente + Verso -> Laranja (Em análise) -> Glass (Aprovado)", async ({ page }) => {
    const statusBtn = page.getByTestId("doc-verifier-status-btn");
    await statusBtn.click();

    const fileInput = page.getByTestId("input-doc-file");

    // Envia Frente
    const frontFile = {
      name: "rg_frente.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.alloc(1024 * 15, "front"),
    };
    await fileInput.setInputFiles(frontFile);

    // Deve pedir Verso
    await expect(page.getByText("Frente recebida! Agora envie o VERSO.")).toBeVisible({ timeout: 5000 });

    // Envia Verso
    const backFile = {
      name: "rg_verso.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.alloc(1024 * 15, "back"),
    };
    await fileInput.setInputFiles(backFile);

    // Modal fecha e botão transita para Laranja (Em análise)
    await expect(statusBtn).toContainText("Em Análise", { timeout: 8000 });
    await expect(statusBtn).toHaveClass(/border-amber-500/);

    // Após processamento, transita para Glass (Aprovado / Homologado)
    await expect(statusBtn).toContainText("Documento Aprovado", { timeout: 10000 });
    await expect(statusBtn).toHaveClass(/glass-panel/);
  });
});
