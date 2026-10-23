import { test, expect } from '@playwright/test';

async function session(page: import('@playwright/test').Page, roles: string[], statuses: Record<string, string>) {
  await page.addInitScript(({ roles, statuses }) => localStorage.setItem('supletivo.login', JSON.stringify({
    access_token: 'test-access', refresh_token: 'test-refresh', roles, role_statuses: statuses,
  })), { roles, statuses });
  await page.route('**/api/v1/clients/whoami', route => route.fulfill({ json: {
    external_id: 'test-user', roles, role_statuses: statuses,
  } }));
}

test('an active student resumes at the real student portal', async ({ page }) => {
  await session(page, ['student'], { student: 'active' });
  await page.route('**/api/v1/clients/student/me', route => route.fulfill({ json: {status: 'awaiting_documents', documents: []} }));
  await page.goto('/student');
  await expect(page).toHaveURL(/\/student\/active\/dashboard$/);
});

test('promoter entry reports backend outage without entering active state', async ({ page }) => {
  await session(page, ['promoter'], { promoter: 'candidate' });
  await page.route('**/api/v1/clients/whoami', route => route.fulfill({ status: 503, json: { detail: 'Serviço indisponível' } }));
  await page.goto('/promoter');
  await expect(page.getByRole('alert')).toContainText('Serviço indisponível');
  await expect(page).toHaveURL(/\/promoter$/);
});

test('a suspended promoter cannot enter active screens by changing the URL', async ({ page }) => {
  await session(page, ['promoter'], { promoter: 'suspended' });
  await page.goto('/promoter/active');
  await expect(page).toHaveURL(/\/promoter\/suspended\/notice$/);
  await expect(page.getByRole('heading', { name: 'Acesso Suspenso', exact: true })).toBeVisible();
});

test('unknown role state shows recovery instead of a successful default', async ({ page }) => {
  await session(page, ['student'], { student: 'unrecognized' });
  await page.goto('/student');
  await expect(page.getByRole('alert')).toContainText('identificar a etapa');
  await expect(page).toHaveURL(/\/student$/);
});

test('temporary refresh outage preserves the session for retry', async ({ page }) => {
  await session(page, ['student'], { student: 'lead' });
  await page.route('**/api/v1/clients/whoami', route => route.fulfill({ status: 401, json: {detail: 'Unauthorized'} }));
  await page.route('**/api/v1/clients/auth/refresh', route => route.fulfill({ status: 503, json: {detail: 'Serviço indisponível'} }));
  await page.goto('/student');
  await expect(page.getByRole('alert')).toContainText('Serviço indisponível');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('supletivo.login') || '{}').refresh_token)).toBe('test-refresh');
});

test('administrator-only login routes to the separate admin panel', async ({ page }) => {
  await session(page, ['admin'], { admin: 'active' });
  await page.route('https://admin.supletivo.net.br/**', route => route.fulfill({ contentType: 'text/html', body: '<h1>Admin</h1>' }));
  await page.goto('/');
  await expect(page).toHaveURL('https://admin.supletivo.net.br/');
});

test('identity upload acknowledgement cannot approve a document still under analysis', async ({ page }) => {
  await session(page, ['student'], { student: 'enrollment' });
  await page.route('**/api/v1/clients/enrollment/me', route => route.fulfill({ json: {
    status: 'rg', profile: {}, rg: null,
  } }));
  await page.route('**/api/v1/clients/enrollment/documents/rg/photo/**', route => route.fulfill({ json: {analysis_status: 'pending'} }));
  await page.goto('/student/enrollment/rg');
  await page.getByRole('button', { name: 'CNH (Digital ou Física)' }).click();
  await page.locator('input[type=file]').first().setInputFiles({name: 'cnh.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7 fixture')});
  await expect(page.getByRole('heading', { name: 'Documento de Identidade Homologado!' })).not.toBeVisible();
  await expect(page.getByText('Enviado — Em Análise')).toBeVisible();
});

test('address screen never displays a fabricated approved address', async ({ page }) => {
  await session(page, ['student'], { student: 'enrollment' });
  await page.route('**/api/v1/clients/enrollment/me', route => route.fulfill({ json: {status: 'address', profile: {name:'Pessoa'}, address_proof: null} }));
  await page.goto('/student/enrollment/address');
  await expect(page.getByText('Rua Marechal Deodoro')).not.toBeVisible();
  await expect(page.getByText('Endereço Residencial Homologado!')).not.toBeVisible();
});
