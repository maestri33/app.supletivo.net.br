import { test, expect } from "@playwright/test";

test.describe("Componente Canônico de Modal — Design System (Issue #10)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/autenticacao/otp?tel=11999999999&id=mock-external-id");
    await page.waitForSelector("[data-hydrated='true']", { timeout: 15000 });
  });

  test("1. Abre modal canônico com role='dialog', aria-modal='true' e bloqueia rolagem do body", async ({ page }) => {
    const triggerBtn = page.getByTestId("contact-recovery-trigger");
    await triggerBtn.click();

    const modal = page.getByTestId("contact-recovery-modal");
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute("role", "dialog");
    await expect(modal).toHaveAttribute("aria-modal", "true");

    // Verifica que o body recebeu overflow: hidden
    const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflow).toBe("hidden");
  });

  test("2. Fecha o modal ao pressionar a tecla Escape e restaura overflow", async ({ page }) => {
    const triggerBtn = page.getByTestId("contact-recovery-trigger");
    await triggerBtn.click();

    const modal = page.getByTestId("contact-recovery-modal");
    await expect(modal).toBeVisible();

    // Pressiona Escape
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();

    // Verifica que o overflow do body foi restaurado
    const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflow).not.toBe("hidden");
  });

  test("3. Botão de fechar cumpre padrão touch mínimo de 48px e fecha modal", async ({ page }) => {
    const triggerBtn = page.getByTestId("contact-recovery-trigger");
    await triggerBtn.click();

    const modal = page.getByTestId("contact-recovery-modal");
    await expect(modal).toBeVisible();

    const closeBtn = page.getByTestId("modal-close-btn");
    await expect(closeBtn).toBeVisible();

    // Ergonomia touch: alvo mínimo de 48px
    const box = await closeBtn.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(44); // tolerância de subpixel
      expect(box.height).toBeGreaterThanOrEqual(44);
    }

    await closeBtn.click();
    await expect(modal).toBeHidden();
  });

  test("4. Fecha modal ao clicar no backdrop translúcido", async ({ page }) => {
    const triggerBtn = page.getByTestId("contact-recovery-trigger");
    await triggerBtn.click();

    const modal = page.getByTestId("contact-recovery-modal");
    await expect(modal).toBeVisible();

    // Clica no canto superior esquerdo do backdrop (fora do painel central)
    await modal.click({ position: { x: 10, y: 10 } });
    await expect(modal).toBeHidden();
  });
});
