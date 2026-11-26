import { chromium } from '@playwright/test';

const BASE_URL = (process.env.AUDIT_BASE_URL || 'http://127.0.0.1:3108').replace(/\/+$/, '');
const parsedBase = new URL(BASE_URL);

const sessionData = {
  access_token: process.env.AUDIT_ACCESS_TOKEN || 'mock-audit-access-token',
  refresh_token: process.env.AUDIT_REFRESH_TOKEN || 'mock-audit-refresh-token',
  external_id: '9823a0a4-223a-4e15-9522-192ceb89315c',
  roles: ['client', 'admin'],
  active_role: 'admin',
  role_statuses: { client: 'enrolled', admin: 'active' },
  phone: '5543996648750',
  user: {
    external_id: '9823a0a4-223a-4e15-9522-192ceb89315c',
    name: 'Admin Audit',
    phone: '5543996648750',
  },
};

const pagesToTest = [
  // Public & Auth pages
  { url: `${BASE_URL}/`, name: 'App Root / Login' },
  { url: `${BASE_URL}/autenticacao/otp?tel=11999999999`, name: 'Tela de OTP' },
  { url: `${BASE_URL}/tabs-status`, name: 'Tabs Status Demo / Auditoria' },

  // Student pages
  { url: `${BASE_URL}/student/lead/payment`, name: 'Student Lead / Checkout' },
  { url: `${BASE_URL}/student/enrollment`, name: 'Student Enrollment (Central)' },
  { url: `${BASE_URL}/student/enrollment/rg`, name: 'Student Enrollment RG' },
  { url: `${BASE_URL}/student/enrollment/address`, name: 'Student Enrollment Address' },
  { url: `${BASE_URL}/student/enrollment/education`, name: 'Student Enrollment Education' },
  { url: `${BASE_URL}/student/enrollment/selfie`, name: 'Student Enrollment Selfie' },
  { url: `${BASE_URL}/student/active/dashboard`, name: 'Student Active Dashboard' },
  { url: `${BASE_URL}/student/active/documents`, name: 'Student Active Documents' },
  { url: `${BASE_URL}/student/active/assessments`, name: 'Student Active Assessments' },
  { url: `${BASE_URL}/student/veteran/dashboard`, name: 'Student Veteran Dashboard' },
  { url: `${BASE_URL}/student/veteran/diploma`, name: 'Student Veteran Diploma' },

  // Unified Admin pages (/admin/*)
  { url: `${BASE_URL}/admin/dashboard`, name: 'Admin Painel Geral' },
  { url: `${BASE_URL}/admin/documentos`, name: 'Admin Mesa de Documentos' },
  { url: `${BASE_URL}/admin/credenciais-siga`, name: 'Admin Credenciais SIGA' },
  { url: `${BASE_URL}/admin/taxa-parceira`, name: 'Admin Taxa Parceira' },
  { url: `${BASE_URL}/admin/provas`, name: 'Admin Provas' },
  { url: `${BASE_URL}/admin/diplomas`, name: 'Admin Diplomas' },
];

async function installMockRoutes(page) {
  await page.route('**/api/v1/**', (route) => {
    const url = route.request().url();
    if (url.includes('/auth/whoami')) {
      return route.fulfill({
        json: {
          authenticated: true,
          id: sessionData.external_id,
          external_id: sessionData.external_id,
          phone: sessionData.phone,
          name: sessionData.user.name,
          cpf: '11144477735',
          email: 'audit@example.test',
          roles: sessionData.roles,
          active_role: url.includes('student') ? 'client' : 'admin',
          role_statuses: sessionData.role_statuses,
          status: 'enrolled',
          substatus: 'siga_active',
        },
      });
    }
    if (url.includes('/catalog/pricing')) {
      return route.fulfill({ json: { pix: '999.00', promo_pix: '999.00', card: null, promo_card: null, anchor_full: '1615.00' } });
    }
    if (url.includes('/catalog/contact')) {
      return route.fulfill({ json: { email: 'contato@supletivo.net.br', whatsapp_number: null } });
    }
    if (url.includes('/student/payment/current')) {
      return route.fulfill({ status: 404, json: { error: 'none' } });
    }
    if (url.includes('/enrollment/status')) {
      return route.fulfill({
        json: {
          student_role_id: 'r1',
          current_status: 'pre_enrolled',
          substatus: 'pending_siga',
          step: 5,
          all_basic_docs_ready: true,
          checklist: {},
        },
      });
    }
    if (url.includes('/enrollment/documents/rg')) {
      return route.fulfill({ json: { submitted: false, rg_section: {} } });
    }
    if (url.includes('/enrollment/education')) {
      return route.fulfill({ json: { submitted: false, data: null } });
    }
    if (url.includes('/contract/current')) {
      return route.fulfill({ json: { version: 'v2', hash: 'audit-hash', text: 'Contrato de auditoria' } });
    }
    if (url.includes('/student/me')) {
      return route.fulfill({
        json: {
          user: { id: sessionData.external_id, phone: sessionData.phone, cpf: '11144477735', name: 'Aluno Audit', full_name: 'Aluno Audit', gender: 'F', blood_type: 'O+' },
          role: { id: 'r1', role: 'client', status: 'enrolled', substatus: 'siga_active', paid_at: Date.now() },
          siga_credentials: null,
          document_progress: { blood_type_registered: true, military_exempt: true, academic_documents_ready: true, checklist: {} },
        },
      });
    }
    if (url.includes('/student/documents')) {
      return route.fulfill({ json: { documents: [], pending_requirements: [] } });
    }
    if (url.includes('/student/exams')) {
      return route.fulfill({ json: { eligibility: { exam_can_schedule: false, exam_available_at: '' }, exams: [] } });
    }
    if (url.includes('/student/diploma')) {
      return route.fulfill({
        json: {
          status: 'graduated',
          message: 'Disponível',
          registration: {},
          documents: { diploma_download_url: null, transcript_download_url: null },
          pickup: null,
        },
      });
    }
    return route.fulfill({
      json: {
        success: true,
        total: 0,
        page: 1,
        limit: 15,
        total_pages: 1,
        items: [],
        documents: [],
        students: [],
        exams: [],
        metrics: {
          total_revenue_cents: 0,
          total_revenue: 'R$ 0,00',
          total_paid_count: 0,
          total_pending_count: 0,
          total_failed_count: 0,
          total_refunded_count: 0,
          total_refunded_cents: 0,
          total_refunded_amount: 'R$ 0,00',
        },
      },
    });
  });
}

async function run() {
  console.log(`=== INICIANDO AUDITORIA PROFUNDA DE UI/UX E NAVEGAÇÃO (${BASE_URL}) ===`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
  });

  await context.addCookies([
    {
      name: 'supletivo.session',
      value: sessionData.access_token,
      domain: parsedBase.hostname,
      path: '/',
      secure: parsedBase.protocol === 'https:',
    },
  ]);

  const results = [];

  for (const target of pagesToTest) {
    const page = await context.newPage();
    const consoleLogs = [];
    const pageErrors = [];
    const failedRequests = [];

    if (process.env.AUDIT_MOCK_API !== '0') {
      await installMockRoutes(page);
    }

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleLogs.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    page.on('response', (res) => {
      if (res.status() >= 400 && !res.url().includes('favicon') && !res.url().includes('/student/payment/current')) {
        failedRequests.push(`${res.status()} ${res.url()}`);
      }
    });

    await page.addInitScript((data) => {
      try {
        localStorage.setItem('supletivo.login', JSON.stringify(data));
        localStorage.setItem('supletivo.session', JSON.stringify({
          phone: data.phone,
          externalId: data.external_id,
          name: data.user.name,
          roles: data.roles,
        }));
      } catch {}
    }, sessionData);

    try {
      const response = await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(800);

      const finalUrl = page.url();
      const status = response ? response.status() : 'no-resp';

      results.push({
        name: target.name,
        targetUrl: target.url,
        finalUrl,
        httpStatus: status,
        consoleErrors: consoleLogs,
        pageErrors,
        failedRequests,
      });

      const pass = pageErrors.length === 0 && (status === 200 || status === 308);
      console.log(`  -> ${target.name}: Final=${finalUrl} | Status=${status} | Pass=${pass}`);
      if (pageErrors.length > 0) console.log(`  ❌ Page Errors: ${pageErrors.join('; ')}`);
      if (failedRequests.length > 0) console.log(`  ⚠️ Failed Requests: ${failedRequests.join('; ')}`);
      if (consoleLogs.length > 0) console.log(`  ⚠️ Console Errors: ${consoleLogs.join('; ')}`);
    } catch (err) {
      console.log(`  💥 Exceção em ${target.name}: ${err.message}`);
      results.push({
        name: target.name,
        targetUrl: target.url,
        finalUrl: 'FAILED',
        error: err.message,
      });
    } finally {
      await page.close();
    }
  }

  await browser.close();

  const failed = results.filter((r) => r.error || (r.pageErrors?.length ?? 0) > 0 || (r.failedRequests?.length ?? 0) > 0);
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
