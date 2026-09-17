import { test, expect } from "@playwright/test";

test.describe("Componente Zero-Form de Residência (Issue #7)", () => {
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
    await page.waitForLoadState("domcontentloaded");
  });

  test("1. Botão de status renderiza estado inicial Pendente (Vermelho)", async ({ page }) => {
    const statusBtn = page.getByTestId("address-verifier-status-btn");
    await expect(statusBtn).toBeVisible({ timeout: 10000 });
    await expect(statusBtn).toContainText("Pendente de Envio");
    await expect(statusBtn).toHaveClass(/border-red-500/);
  });

  test("2. IA no front bloqueia envio de documento incompatível (ex: RG)", async ({ page }) => {
    const statusBtn = page.getByTestId("address-verifier-status-btn");
    await statusBtn.click();

    const fileInput = page.getByTestId("input-address-file");
    const fakeRgFile = {
      name: "meu_rg_frente.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.alloc(1024 * 10, "rg"),
    };
    await fileInput.setInputFiles(fakeRgFile);

    const errorBox = page.getByTestId("address-triage-error");
    await expect(errorBox).toBeVisible({ timeout: 5000 });
    await expect(errorBox).toContainText("isso parece um documento de identidade");
  });

  test("3. Caso A: Titular próprio -> extração direta sem formulário -> Glass (Homologado)", async ({ page }) => {
    const statusBtn = page.getByTestId("address-verifier-status-btn");
    await statusBtn.click();

    const fileInput = page.getByTestId("input-address-file");
    const contaAluno = {
      name: "fatura_luz_titular_proprio.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.alloc(1024 * 15, "conta"),
    };
    await fileInput.setInputFiles(contaAluno);

    // Deve transitar para Laranja (Em análise) e depois Glass (Homologado)
    await expect(statusBtn).toContainText("Endereço Homologado", { timeout: 10000 });
    await expect(statusBtn).toHaveClass(/glass-panel/);

    // Card com endereço extraído aparece sem nenhuma digitação
    const addressCard = page.getByTestId("confirmed-address-card");
    await expect(addressCard).toBeVisible();
    await expect(addressCard).toContainText("Av. Paulista, 1000");
    await expect(addressCard).toContainText("Bela Vista");
  });

  test("4. Caso B: Titular de terceiro -> abre RelationshipPicker -> 1 toque homologa", async ({ page }) => {
    const statusBtn = page.getByTestId("address-verifier-status-btn");
    await statusBtn.click();

    const fileInput = page.getByTestId("input-address-file");
    const contaTerceiro = {
      name: "conta_energia_mae.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.alloc(1024 * 15, "conta"),
    };
    await fileInput.setInputFiles(contaTerceiro);

    // Deve abrir o micro-componente de seleção de vínculo em 1 toque
    const relModal = page.getByTestId("relationship-picker-modal");
    await expect(relModal).toBeVisible({ timeout: 8000 });
    await expect(relModal).toContainText("Conta identificada no nome de:");
    await expect(relModal).toContainText("Maria Aparecida Maestri");

    // 1 Toque na opção "Pai / Mãe"
    const parentBtn = page.getByTestId("rel-btn-parents");
    await parentBtn.click();

    // Modal fecha e o endereço é homologado com badge de vínculo
    await expect(relModal).not.toBeVisible();
    await expect(statusBtn).toContainText("Endereço Homologado", { timeout: 5000 });
    await expect(statusBtn).toHaveClass(/glass-panel/);

    const addressCard = page.getByTestId("confirmed-address-card");
    await expect(addressCard).toBeVisible();
    await expect(addressCard).toContainText("Vínculo: Pai / Mãe");
  });
});
