import { test, expect } from "@playwright/test";

test.describe("Wizard Guia do Dock no Status Aluno > Lead (/student/lead)", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.addInitScript(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem(
          "supletivo.login",
          JSON.stringify({
            access_token: "mock-student-token",
            refresh_token: "mock-refresh-token",
            roles: ["student"],
            role_statuses: { student: "lead" },
          })
        );
      } catch {}
    });

    // Mock do refresh para evitar deslogar em caso de 401
    await page.route("**/api/v1/clients/auth/refresh*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "mock-student-token",
          refresh_token: "mock-refresh-token",
          token_type: "bearer",
        }),
      });
    });

    // Mock de whoami para estabilidade de sessão
    await page.route("**/api/v1/clients/whoami*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          authenticated: true,
          roles: ["student"],
          active_role: "student",
          user: { name: "Aluno Teste", external_id: "lead-12345" },
        }),
      });
    });

    // Mock padrão do lead para ambiente de teste isolado
    await page.route("**/api/v1/clients/lead/me*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          external_id: "lead-12345",
          status: "lead",
          created_at: new Date().toISOString(),
          customer: { name: "Aluno Teste", phone: "11999999999", email: "aluno@teste.com" },
          promoter: {},
          checkout: null,
        }),
      });
    });
  });

  test("dock deve renderizar como wizard guia com botão 2 desabilitado inicialmente", async ({ page }) => {
    await page.goto("/student/lead");
    await expect(page.locator("h1").first()).toBeVisible();

    // Valida que o dock nativo no rodapé renderizou
    const navBar = page.locator(
      "nav[aria-label='Navegação principal do student'], nav[aria-label='Navegação principal do aluno']"
    );
    await expect(navBar).toBeVisible();

    // Valida que existem estritamente as duas fases: 1. Modalidade e 2. Checkout
    const btnModalidade = navBar.getByRole("button", { name: /1\. Modalidade/i });
    const btnCheckout = navBar.getByRole("button", { name: /2\. Checkout/i });

    await expect(btnModalidade).toBeVisible();
    await expect(btnCheckout).toBeVisible();

    // REGRA DE OURO: O segundo botão NÃO deve estar disponível inicialmente
    await expect(btnCheckout).toBeDisabled();

    // Valida que opções padrão de navegação (Meu Curso, Sair, etc.) NÃO estão presentes no dock em lead
    await expect(navBar.getByText("Meu Curso")).toHaveCount(0);
    await expect(navBar.getByText("Sair")).toHaveCount(0);
  });

  test("deve entrar em loop de preparação ao escolher PIX e habilitar botão 2 do dock quando pronto", async ({ page }) => {
    // Intercepta a criação do checkout PIX com simulação realista e delay
    await page.route("**/api/v1/clients/lead/checkout*", async (route) => {
      await new Promise((r) => setTimeout(r, 600));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          payment_method: "pix",
          provider: "asaas",
          amount: "999.00",
          is_paid: false,
          qrcode_payload: "00020126580014br.gov.bcb.pix0136mock-pix-payload-test-1234567890",
          qrcode_image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          short_url: "https://supletivo.net.br/pix/mock-token-123",
          checkout_url: "https://supletivo.net.br/pix/mock-token-123",
        }),
      });
    });

    await page.route("**/api/v1/clients/lead/pix/*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          amount: "999.00",
          is_paid: false,
          qrcode_payload: "00020126580014br.gov.bcb.pix0136mock-pix-payload-test-1234567890",
          qrcode_image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        }),
      });
    });

    await page.goto("/student/lead");
    const navBar = page.locator(
      "nav[aria-label='Navegação principal do student'], nav[aria-label='Navegação principal do aluno']"
    );
    await expect(navBar).toBeVisible();

    const btnModalidade = navBar.getByRole("button", { name: /1\. Modalidade/i });
    const btnCheckout = navBar.getByRole("button", { name: /2\. Checkout/i });

    // Inicialmente bloqueado
    await expect(btnCheckout).toBeDisabled();

    // Clica no card PIX Oficial
    const btnPix = page.getByRole("button", { name: /Pagar com PIX Oficial/i });
    await expect(btnPix).toBeVisible();
    await btnPix.click();

    // Aguarda conclusão do loop e transição para o checkout PIX
    await expect(btnCheckout).toBeEnabled({ timeout: 10000 });
    await expect(page.getByText(/PIX Bancário Oficial/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Copiar código PIX/i })).toBeVisible();

    // Testa navegação de retorno via Dock: clica em '1. Modalidade'
    await btnModalidade.click();
    await expect(page.getByText(/Conclua sua matrícula para liberar as aulas/i)).toBeVisible();

    // Botão 2 continua habilitado permitindo ao aluno retornar ao checkout gerado
    await expect(btnCheckout).toBeEnabled();

    // Clica em '2. Checkout' no Dock para voltar à visualização do PIX
    await btnCheckout.click();
    await expect(page.getByText(/PIX Bancário Oficial/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Copiar código PIX/i })).toBeVisible();
  });

  test("deve entrar em loop ao escolher Cartão e redirecionar para URL externa da InfinitePay", async ({ page }) => {
    // Intercepta a criação do checkout de Cartão com simulação InfinitePay
    await page.route("**/api/v1/clients/lead/checkout*", async (route) => {
      await new Promise((r) => setTimeout(r, 400));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          payment_method: "credit_card",
          provider: "infinitepay",
          amount: "1932.00",
          is_paid: false,
          checkout_url: "https://pay.infinitepay.io/mock-order-123",
          short_url: "https://supletivo.net.br/pix/mock-order-123",
        }),
      });
    });

    // Intercepta navegação externa para o domínio InfinitePay
    await page.route("**/pay.infinitepay.io/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<html><body>InfinitePay Checkout Mock</body></html>",
      });
    });

    await page.goto("/student/lead");
    const btnCredit = page.getByRole("button", { name: /Pagar no Cartão \(InfinitePay\)/i });
    await expect(btnCredit).toBeVisible();

    // Aguarda o redirecionamento de saída para a InfinitePay
    await btnCredit.click();
    await page.waitForURL(/pay\.infinitepay\.io\/mock-order-123/, { timeout: 10000 });
    expect(page.url()).toContain("pay.infinitepay.io/mock-order-123");
  });

  test("deve processar o retorno da InfinitePay, verificar pagamento e avançar para o ambiente de matrícula com banner de confirmação", async ({ page }) => {
    // Mock do backend informando que o checkout foi aprovado via webhook/gateway
    await page.route("**/api/v1/clients/lead/me*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          external_id: "lead-returning-card-test",
          name: "Aluno Retorno Cartão",
          phone: "11988887777",
          status: "paid",
          checkout: {
            payment_method: "credit_card",
            provider: "infinitepay",
            amount: "1932.00",
            is_paid: true,
            checkout_url: "https://pay.infinitepay.io/mock-order-123",
          },
        }),
      });
    });

    // Simula retorno do checkout da InfinitePay com query param
    await page.goto("/student/lead?from=infinitepay&order_nsu=mock-order-123");

    // Deve auto-avançar para o ambiente de matrícula (/student/enrollment)
    await page.waitForURL(/\/student\/enrollment/, { timeout: 10000 });
    expect(page.url()).toContain("/student/enrollment");

    // Verifica que o banner de celebração de pagamento confirmado via InfinitePay é exibido
    const banner = page.getByTestId("payment-confirmed-banner");
    await expect(banner).toBeVisible();
    await expect(page.getByText(/Pagamento Confirmado via InfinitePay!/i)).toBeVisible();
    await expect(page.getByText(/Matrícula Garantida/i)).toBeVisible();
  });
});
