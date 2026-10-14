import { test, expect, type Page } from "@playwright/test";

// Controlled API fixtures exercise browser failure paths; they are not payment evidence.
const pixCheckout = {
  payment_method: "pix", provider: "asaas", amount: "999.00", is_paid: false,
  qrcode_payload: "00020126580014br.gov.bcb.pix0136controlled-test-payload",
  qrcode_image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  checkout_url: "https://app.supletivo.net.br/pix/test-token",
};
const cardCheckout = {
  payment_method: "credit_card", provider: "infinitepay", amount: "1932.00", is_paid: false,
  checkout_url: "https://pay.infinitepay.io/controlled-order",
};
function leadData(checkout: Record<string, unknown> | null = null, extra: Record<string, unknown> = {}) {
  return {
    external_id: "controlled-lead", status: "pending", created_at: "2026-10-13T10:00:00Z",
    customer: { name: "Aluno Teste", phone: "11999999999", email: "aluno@example.test" },
    promoter: {}, checkout,
    pricing: { pix: "999.00", card: { installments: 12, installment: "161.00", total: "1932.00" } },
    payment_status: { stage: "pending", continuation_url: null },
    ...extra,
  };
}
function dock(page: Page) { return page.locator("nav[data-app-dock]"); }
async function serveLead(page: Page, body: ReturnType<typeof leadData>) {
  await page.route("**/api/v1/clients/lead/me", route => route.fulfill({ json: body }));
}

test.describe("Pagamento do lead: servidor, recuperação e dock", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem("supletivo.login", JSON.stringify({
        access_token: "controlled-token", refresh_token: "controlled-refresh",
        roles: ["lead"], role_statuses: { student: "lead" },
      }));
    });
    await page.route("**/api/v1/clients/whoami", route => route.fulfill({ json: {
      external_id: "controlled-user", authenticated: true, roles: ["lead"],
      active_role: "student", role_statuses: { student: "lead" },
    } }));
    await serveLead(page, leadData());
  });

  test("dock mantém somente uma fase ativa e checkout bloqueado sem cobrança", async ({ page }) => {
    await page.goto("/student/lead/payment");
    await expect(dock(page)).toBeVisible();
    await expect(dock(page).getByRole("button", { name: "Checkout", exact: true })).toBeDisabled();
    await expect(dock(page).locator("[aria-current='page']")).toHaveCount(1);
    await expect(dock(page).getByRole("button", { name: "Forma de pagamento" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByText(/LIBERAÇÃO IMEDIATA|pagamento em uma parcela/i)).toHaveCount(0);
    await expect(page.getByText("R$ 1.932,00", { exact: true })).toBeVisible();
    await expect(page.getByText(/taxas da operadora são repassadas ao comprador/i)).toBeVisible();
  });

  test("PIX pronto permite revisar e retomar sem emitir outra cobrança", async ({ page }) => {
    let emissions = 0;
    await page.route("**/api/v1/clients/lead/checkout", async route => {
      emissions++;
      await serveLead(page, leadData(pixCheckout));
      await route.fulfill({ json: pixCheckout });
    });
    await page.goto("/student/lead/payment");
    await page.getByRole("button", { name: /Pagar com PIX Oficial/i }).click();
    await expect(page.getByRole("button", { name: "Copiar Código PIX", exact: true })).toBeVisible();
    await expect(dock(page).locator("[aria-current='page']")).toHaveCount(1);
    await expect(dock(page).getByRole("button", { name: "Checkout PIX" })).toHaveAttribute("aria-current", "page");
    await dock(page).getByRole("button", { name: "Forma de pagamento" }).click();
    await expect(page.getByRole("heading", { name: /Conclua sua matrícula/i })).toBeVisible();
    await expect(dock(page).locator("[aria-current='page']")).toHaveCount(1);
    await dock(page).getByRole("button", { name: "Checkout PIX" }).click();
    await expect(page.getByRole("button", { name: "Copiar Código PIX", exact: true })).toBeVisible();
    expect(emissions).toBe(1);
  });

  test("cartão usa o link vigente devolvido pelo backend", async ({ page }) => {
    await page.route("**/api/v1/clients/lead/checkout", route => route.fulfill({ json: cardCheckout }));
    await page.route("**/pay.infinitepay.io/**", route => route.fulfill({ contentType: "text/html", body: "<p>Checkout controlado</p>" }));
    await page.goto("/student/lead/payment");
    await page.getByRole("button", { name: /Pagar no Cartão/i }).click();
    await page.waitForURL("https://pay.infinitepay.io/controlled-order");
  });

  test("retorno envia referências ao backend e segue somente o destino autorizado", async ({ page }) => {
    let references: unknown = null;
    await page.route("**/api/v1/clients/lead/card-confirmation", async route => {
      expect(route.request().method()).toBe("POST");
      references = route.request().postDataJSON();
      await route.fulfill({ json: leadData({ ...cardCheckout, is_paid: true }, {
        status: "paid", payment_status: { stage: "completed", continuation_url: "/student/enrollment" },
      }) });
    });
    await page.goto("/student/lead?order_nsu=order-123&transaction_nsu=transaction-456&slug=invoice-789");
    await page.waitForURL(/\/student\/enrollment/);
    expect(references).toEqual({ order_nsu: "order-123", transaction_nsu: "transaction-456", slug: "invoice-789" });
  });

  test("flag antiga de cartão não troca um checkout PIX vigente", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("supletivo_pending_card_checkout", "true");
      localStorage.setItem("supletivo_card_checkout_url", "https://pay.infinitepay.io/another-account");
    });
    await serveLead(page, leadData(pixCheckout));
    await page.goto("/student/lead/checkout?from=infinitepay&success=true");
    await expect(page.getByRole("button", { name: "Copiar Código PIX", exact: true })).toBeVisible();
    await expect(dock(page).getByRole("button", { name: "Checkout PIX" })).toBeEnabled();
    expect(await page.evaluate(() => localStorage.getItem("supletivo_pending_card_checkout"))).toBeNull();
  });

  test("pagamento recebido bloqueia nova cobrança enquanto finaliza matrícula", async ({ page }) => {
    await serveLead(page, leadData(cardCheckout, { payment_status: {
      stage: "provider_confirmed", continuation_url: null, paid_amount: "1980.00", actual_capture_method: "credit_card",
    } }));
    await page.goto("/student/lead");
    await expect(page.getByRole("heading", { name: "Pagamento recebido; finalizando matrícula" })).toBeVisible();
    await expect(page.getByText(/não é necessário pagar novamente/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Reabrir checkout/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Pagar no Cartão/i })).toHaveCount(0);
    expect(page.url()).toContain("/student/lead");
  });

  test("permissão negada oferece ambiente autorizado e desabilita pagamento", async ({ page }) => {
    await page.route("**/api/v1/clients/lead/me", route => route.fulfill({ status: 403, json: { detail: "Acesso negado" } }));
    await page.goto("/student/lead/payment");
    await expect(page.getByRole("link", { name: "Abrir meu ambiente" })).toHaveAttribute("href", "/");
    await expect(page.getByRole("button", { name: /Pagar com PIX Oficial/i })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Consultar proposta novamente" })).toHaveCount(0);
  });

  test("falha do clipboard seleciona código sem anunciar cópia", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
        writeText: async () => { throw new DOMException("Cópia bloqueada", "NotAllowedError"); },
      } });
    });
    await serveLead(page, leadData(pixCheckout));
    await page.goto("/student/lead/checkout");
    await page.getByRole("button", { name: "Copiar Código PIX", exact: true }).click();
    await expect(page.getByText(/Não conseguimos copiar automaticamente/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Código PIX Copiado!", exact: true })).toHaveCount(0);
    expect(await page.locator("#pix-payload").evaluate((field: HTMLTextAreaElement) => field.selectionEnd - field.selectionStart)).toBe(pixCheckout.qrcode_payload.length);
  });

  test("cópia concluída corresponde ao código na área de transferência", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await serveLead(page, leadData(pixCheckout));
    await page.goto("/student/lead/checkout");
    await page.getByRole("button", { name: "Copiar Código PIX", exact: true }).click();
    await expect(page.getByRole("button", { name: "Código PIX Copiado!", exact: true })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(pixCheckout.qrcode_payload);
  });

  test("checkout móvel mantém código, ação e dock sem transbordar", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await serveLead(page, leadData(pixCheckout));
    await page.goto("/student/lead/checkout");
    const button = page.getByRole("button", { name: "Copiar Código PIX", exact: true });
    await button.scrollIntoViewIfNeeded();
    await expect(button).toBeVisible();
    const bounds = await button.boundingBox();
    const dockBounds = await dock(page).boundingBox();
    expect(bounds?.height).toBeGreaterThanOrEqual(48);
    expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(375);
    expect((bounds?.y ?? 0) + (bounds?.height ?? 0)).toBeLessThanOrEqual(dockBounds?.y ?? 812);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  });

  test("consulta Pix falhando conserva QR e exibe estado indisponível", async ({ page }) => {
    await page.route("**/api/v1/clients/lead/pix/test-token", route => route.fulfill({ json: pixCheckout }));
    await page.goto("/pix/test-token");
    await expect(page.locator("#pix-payload")).toHaveValue(pixCheckout.qrcode_payload);
    await page.route("**/api/v1/clients/lead/pix/test-token", route => route.fulfill({ status: 503, json: { detail: "Consulta indisponível" } }));
    await expect(page.getByText("Não conseguimos atualizar agora.", { exact: false })).toBeVisible();
    await expect(page.locator("#pix-payload")).toHaveValue(pixCheckout.qrcode_payload);
    await expect(page.getByRole("button", { name: "Consultar pagamento novamente" })).toBeVisible();
    await expect(page.getByText(/Radar Bancário Ativo/i)).toHaveCount(0);
  });

  test("token público pago oferece recibo e conta sem abrir matrícula", async ({ page }) => {
    await page.route("**/api/v1/clients/lead/pix/test-token", route => route.fulfill({ json: {
      ...pixCheckout, is_paid: true, receipt_url: "https://example.test/receipt",
    } }));
    await page.goto("/pix/test-token");
    await expect(page.getByRole("heading", { name: "Pagamento Confirmado!" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Entrar na minha conta/i })).toHaveAttribute("href", "/");
    await expect(page.getByRole("link", { name: /Ver comprovante/i })).toHaveAttribute("href", "https://example.test/receipt");
    await page.waitForTimeout(2300);
    expect(page.url()).toContain("/pix/test-token");
  });
});
