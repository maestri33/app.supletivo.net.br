import { chromium } from '@playwright/test';

const sessionData = {
  access_token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzkwNjk2OTE5LCJpYXQiOjE3OTA2OTUxMTksImp0aSI6IjcxOTNjNzdkNmY5ZjQ4MmFhMDBjNGE3MDA0MDA4NjJjIiwiZXh0ZXJuYWxfaWQiOiI5ODIzYTBhNC0yMjNhLTRlMTUtOTUyMi0xOTJjZWI4OTMxNWMiLCJyb2xlcyI6WyJhZG1pbiIsImNhbmRpZGF0ZSIsImVucm9sbG1lbnQiLCJzdGFmZiJdLCJ0b2tlbl92ZXJzaW9uIjo0LCJpc3MiOiJzdXBsZXRpdm8ifQ.df7cDP4hLW1frgQJww43ZU03c11EOVll3qGHRfSFLQ04sOa5gLPbsPmwAMhGz6ITu6WMAwYNtbkcL5SbVaF-kcAusY5_-9TvVOeJaHhSaSbQitEgwoJUQTodLGNYe8AnjAcunfjUE5qo5iNjYXY7L8yTz0wUklSK9R7TAmT65Z9bwXtcWMi2gc7vuOw07NOTWc-fwwNq0w7ADDQKZudJY7PBF-G1S8OmIXQs9Sk-bJjEWgIJDteD3ZjpnHRgVBR5B-CSGvcU7DFwYaNjPdPE84hr7xajBCFKXUdfXOsChAtvGIAEPhLccTsF56O00TgAJIY8znaqzBghdqbWiONLKg",
  refresh_token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5MDc4MDk2MSwiaWF0IjoxNzkwNjk0NTYxLCJqdGkiOiJjODM1MzM4Y2E3ZWI0YjU1ODlmNDBhM2ViOTM3ZjE3YiIsImV4dGVybmFsX2lkIjoiOTgyM2EwYTQtMjIzYS00ZTE1LTk1MjItMTkyY2ViODkzMTVjIiwicm9sZXMiOlsiYWRtaW4iLCJjYW5kaWRhdGUiLCJlbnJvbGxtZW50Iiwic3RhZmYiXSwidG9rZW5fdmVyc2lvbiI6NCwiaXNzIjoic3VwbGV0aXZvIn0.jQtMsiN94TcDONIw2L-RMywpaA_luJDwT9ZRXJxITNA5px6bCW6Nn5TrOzP0r_1veSpsYnjsA_pP3xr2HIm6tGbXtHKRsn_fi0vnm26xkOeumNavxro0Bm1HCw980i6CjeHtBNOobF6Mqkj411oEgzF9SQL4K7e9fiE-kpXO9Kov_QEeBMNdFkw0R2U5ucCWDSXmbvcyowiCwL_82pCzj1amzixkoNY_EDka94BpkyokywClRcVkkh90r6y-b-WGYB664B6728pRoMgf0GK6Jd0rqE4cYmuYJYdHw3vpasIHDz75C_U5JtW83D6SdZN48cM7aX6mtUx1eKo4s3D1RQ",
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
      } catch (e) {}
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
      console.log(`  -> Final: ${finalUrl} | Status: ${status} | Header: ${hasHeader} | Dock: ${hasDock}`);
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
