import { chromium } from '@playwright/test';

const sessionData = {
  access_token: process.env.AUDIT_ACCESS_TOKEN || "mock-audit-access-token",
  refresh_token: process.env.AUDIT_REFRESH_TOKEN || "mock-audit-refresh-token",
  external_id: "9823a0a4-223a-4e15-9522-192ceb89315c",
  roles: ["student", "promoter", "hub", "admin", "candidate", "enrollment", "staff"],
  phone: "5543996648750",
  user: {
    external_id: "9823a0a4-223a-4e15-9522-192ceb89315c",
    name: "Victor Vanderley Maestri",
    phone: "5543996648750",
    is_superuser: true,
    is_staff: true,
  }
};

const pagesToTest = [
  // App pages
  { url: "https://app.supletivo.net.br/", name: "App Root / Login" },
  { url: "https://app.supletivo.net.br/autenticacao/login", name: "Login Geral" },
  { url: "https://app.supletivo.net.br/autenticacao/otp", name: "Tela de OTP" },
  { url: "https://app.supletivo.net.br/student", name: "Student Triage" },
  { url: "https://app.supletivo.net.br/student/enrollment", name: "Student Enrollment (Envio Documentos)" },
  { url: "https://app.supletivo.net.br/student/lead", name: "Student Lead / Checkout" },
  { url: "https://app.supletivo.net.br/tabs-status", name: "Tabs Status Demo / Auditoria" },
  { url: "https://app.supletivo.net.br/promoter/candidate", name: "Promotor Candidato" },
  { url: "https://app.supletivo.net.br/promoter/active", name: "Promotor Ativo" },
  { url: "https://app.supletivo.net.br/promoter/leads", name: "Promotor Leads" },
  { url: "https://app.supletivo.net.br/promoter/comissoes", name: "Promotor Comissões" },
  { url: "https://app.supletivo.net.br/promoter/training", name: "Promotor Treinamento" },
  { url: "https://app.supletivo.net.br/hub/index", name: "Hub Triage" },
  { url: "https://app.supletivo.net.br/hub/active", name: "Hub Ativo" },
  { url: "https://app.supletivo.net.br/hub/review", name: "Hub Revisão" },

  // Admin pages
  { url: "https://admin.supletivo.net.br/auditoria", name: "Admin Auditoria" },
  { url: "https://admin.supletivo.net.br/documentos", name: "Admin Documentos / Dossiê" },
  { url: "https://admin.supletivo.net.br/financeiro", name: "Admin Financeiro" },
  { url: "https://admin.supletivo.net.br/polos", name: "Admin Polos" },
  { url: "https://admin.supletivo.net.br/precos", name: "Admin Preços" },
  { url: "https://admin.supletivo.net.br/treinamento", name: "Admin Treinamento" },
  { url: "https://admin.supletivo.net.br/usuarios", name: "Admin Usuários" },
  { url: "https://admin.supletivo.net.br/notificacoes", name: "Admin Notificações" },
];

async function run() {
  console.log("=== INICIANDO AUDITORIA PROFUNDA DE UI/UX E NAVEGAÇÃO ===");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // Mobile first (iPhone 14 / modern smartphone)
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
  });

  // Configura cookies globais com domain explícito
  await context.addCookies([
    {
      name: "supletivo.session",
      value: sessionData.access_token,
      domain: "app.supletivo.net.br",
      path: "/",
      secure: true,
    },
    {
      name: "supletivo.admin.session",
      value: sessionData.access_token,
      domain: "admin.supletivo.net.br",
      path: "/",
      secure: true,
    },
    {
      name: "supletivo.session",
      value: sessionData.access_token,
      domain: "supletivo.net.br",
      path: "/",
      secure: true,
    },
  ]);

  const results = [];

  for (const target of pagesToTest) {
    const page = await context.newPage();
    const consoleLogs = [];
    const pageErrors = [];
    const failedRequests = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleLogs.push(msg.text());
      }
    });

    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });

    page.on("response", (res) => {
      if (res.status() >= 400 && !res.url().includes("favicon")) {
        failedRequests.push(`${res.status()} ${res.url()}`);
      }
    });

    // Injeta localStorage antes do carregamento
    await page.addInitScript((data) => {
      try {
        localStorage.setItem("supletivo.login", JSON.stringify(data));
        localStorage.setItem("supletivo.admin.login", JSON.stringify(data));
        localStorage.setItem("supletivo.session", JSON.stringify({
          phone: data.phone,
          externalId: data.external_id,
          name: data.name,
          roles: data.roles
        }));
      } catch {}
    }, sessionData);

    try {
      console.log(`\n[VISITANDO] ${target.name} (${target.url})`);
      const response = await page.goto(target.url, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForTimeout(1500); // espera hidratação Svelte/React

      const finalUrl = page.url();
      const status = response ? response.status() : "no-resp";

      // Verifica elementos chave de UI
      const hasHeader = await page.locator("header, [data-testid='app-header'], .app-header").count() > 0;
      const hasDock = await page.locator("nav, [data-testid='nav-dock'], .floating-dock").count() > 0;
      const title = await page.title();
      const bodyText = (await page.locator("body").innerText()).slice(0, 200).replace(/\n+/g, " ");

      const result = {
        name: target.name,
        targetUrl: target.url,
        finalUrl,
        httpStatus: status,
        title,
        hasHeader,
        hasDock,
        bodySnippet: bodyText,
        consoleErrors: consoleLogs,
        pageErrors,
        failedRequests,
      };

      results.push(result);

      const pass = pageErrors.length === 0 && (status === 200 || status === 308);
      console.log(`  -> Final: ${finalUrl} | Status: ${status} | Pass: ${pass} | Header: ${hasHeader} | Dock: ${hasDock}`);
      if (pageErrors.length > 0) console.log(`  ❌ Page Errors: ${pageErrors.join("; ")}`);
      if (failedRequests.length > 0) console.log(`  ⚠️ Failed Requests: ${failedRequests.join("; ")}`);
      if (consoleLogs.length > 0) console.log(`  ⚠️ Console Errors: ${consoleLogs.join("; ")}`);
    } catch (err) {
      console.log(`  💥 Exceção ao abrir página: ${err.message}`);
      results.push({
        name: target.name,
        targetUrl: target.url,
        finalUrl: "FAILED",
        error: err.message,
      });
    } finally {
      await page.close();
    }
  }

  await browser.close();

  console.log("\n================ RESUMO FINAL DA AUDITORIA ================");
  let hasIssues = false;
  for (const r of results) {
    const issues = [];
    if (r.error) issues.push(r.error);
    if (r.pageErrors && r.pageErrors.length > 0) issues.push(...r.pageErrors);
    if (r.failedRequests && r.failedRequests.length > 0) issues.push(...r.failedRequests);
    
    if (issues.length > 0) {
      hasIssues = true;
      console.log(`❌ ${r.name} (${r.targetUrl}):`);
      issues.forEach(i => console.log(`   - ${i}`));
    } else {
      console.log(`✅ ${r.name}: 100% LIMPO (${r.finalUrl})`);
    }
  }

  if (!hasIssues) {
    console.log("\n🎉 TODAS AS PÁGINAS TESTADAS ESTÃO 100% OPERACIONAIS E SEM ERROS DE RUNTIME!");
  }
}

run().catch(console.error);
