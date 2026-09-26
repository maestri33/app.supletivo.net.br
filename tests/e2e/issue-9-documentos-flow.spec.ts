import { test, expect } from "@playwright/test";

test.describe("Fluxo Contínuo de Validação de Documentos e Desbloqueio (/documentos) (Issue #9)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "supletivo.login",
        JSON.stringify({ access_token: "test-token", refresh_token: "refresh-token", token_type: "bearer" }),
      );
      window.localStorage.setItem(
        "supletivo.session",
        JSON.stringify({ phone: "11999999999", externalId: "student-1", role: "aluno", name: "Víctor Teste" }),
      );
    });

    await page.route("**/api/v1/clients/whoami", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ external_id: "student-1", roles: ["aluno"], name: "Víctor Teste" }),
      }),
    );
  });

  test("Upload de conta real homologa titular próprio sem alucinação e libera avanço para o painel", async ({ page }) => {
    await page.goto("/documentos");

    // 1. Validação de Identidade (RG Frente + Verso)
    const docBtn = page.getByTestId("doc-verifier-status-btn");
    await expect(docBtn).toBeVisible({ timeout: 10000 });
    await docBtn.click();

    const docInput = page.getByTestId("input-doc-file");
    const rgFront = {
      name: "foto_rg_frente.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.alloc(1024 * 10, "rg-front"),
    };
    await docInput.setInputFiles(rgFront);

    // Envia verso
    const rgBack = {
      name: "foto_rg_verso.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.alloc(1024 * 10, "rg-back"),
    };
    await docInput.setInputFiles(rgBack);
    await expect(docBtn).toContainText("Documento Aprovado", { timeout: 10000 });

    // 2. Validação de Residência com nome de conta real (sem parentesco fictício)
    const addressBtn = page.getByTestId("address-verifier-status-btn");
    await expect(addressBtn).toBeVisible();
    await addressBtn.click();

    const addressInput = page.getByTestId("input-address-file");
    const realBill = {
      name: "fatura_enel_setembro.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.alloc(1024 * 12, "bill"),
    };
    await addressInput.setInputFiles(realBill);

    // Deve homologar direto como titular próprio sem abrir modal de parentesco
    await expect(addressBtn).toContainText("Endereço Homologado", { timeout: 10000 });

    // 3. Banner de conclusão e avanço é exibido
    const banner = page.getByTestId("docs-completion-banner");
    await expect(banner).toBeVisible({ timeout: 5000 });
    await expect(banner).toContainText("Documentação 100% Homologada pela IA!");
    await expect(banner).toContainText("Acessar Meu Painel Agora");
  });
});
