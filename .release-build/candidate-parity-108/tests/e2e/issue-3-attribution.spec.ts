import { test, expect } from "@playwright/test";
import { getConsultantPricing } from "../../src/lib/payment";

test.describe("Atribuição e Manutenção de Preço de Consultor (Issue #3)", () => {
  test("1. Cálculo de Preço de Consultor (Lote 01 vs Tabela Cheia)", async () => {
    // Com indicação ativa de consultor
    const withRef = getConsultantPricing(true);
    expect(withRef.hasRef).toBe(true);
    expect(withRef.pix).toBe("999.00");
    expect(withRef.card.installments).toBe(12);
    expect(withRef.card.installment).toBe("99.00");
    expect(withRef.card.total).toBe("1188.00");
    expect(withRef.economyBrl).toBe("616,00");
    expect(withRef.label).toContain("Consultor Autorizado");

    // Sem indicação (preço de tabela cheia)
    const withoutRef = getConsultantPricing(false);
    expect(withoutRef.hasRef).toBe(false);
    expect(withoutRef.pix).toBe("1615.00");
    expect(withoutRef.card.installments).toBe(12);
    expect(withoutRef.card.installment).toBe("161.00");
    expect(withoutRef.card.total).toBe("1932.00");
    expect(withoutRef.economyBrl).toBeUndefined();
  });

  test("2. Preservação de Atribuição na rota de login", async ({ page }) => {
    await page.goto("/?role=promotor&ref=consultor-123&utm_source=meta&utm_campaign=promo-eja");

    // Avalia execução do client e persistência
    const currentUrl = new URL(page.url());
    expect(currentUrl.searchParams.get("ref")).toBe("consultor-123");
    expect(currentUrl.searchParams.get("utm_source")).toBe("meta");
    expect(currentUrl.searchParams.get("utm_campaign")).toBe("promo-eja");
  });

  test("3. Preservação de Atribuição na rota /autenticacao/otp", async ({ page }) => {
    await page.goto("/autenticacao/otp?id=uuid-123&tel=11999998888&ref=polo-sp");

    const currentUrl = new URL(page.url());
    expect(currentUrl.searchParams.get("id")).toBe("uuid-123");
    expect(currentUrl.searchParams.get("tel")).toBe("11999998888");
    expect(currentUrl.searchParams.get("ref")).toBe("polo-sp");
  });
});
