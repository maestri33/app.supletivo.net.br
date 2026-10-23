import { test, expect, type Page } from '@playwright/test';

async function identity(page: Page, role: string, status: string) {
  await page.addInitScript(({ role, status }) => localStorage.setItem('supletivo.login', JSON.stringify({
    access_token: 'fixture-token', refresh_token: 'fixture-refresh', roles: [role], role_statuses: { [role]: status },
  })), { role, status });
  await page.route('**/api/**', route => route.fulfill({ status: 404, json: { detail: 'No fixture' } }));
  await page.route('**/api/v1/clients/whoami', route => route.fulfill({ json: {
    external_id: 'user-id', roles: [role], role_statuses: { [role]: status }, name: 'Pessoa de teste',
  } }));
}

const profile = { external_id: 'promoter-entity-id', status: 'active', locked: false, payout_locked: false,
  ref_url: 'https://supletivo.net.br/?ref=user-id', name: 'Pessoa de teste', pending_materials: [], pix_key: 'fixture-key' };
const ledger = [
  { status: 'pending', amount: '25.10' }, { status: 'processed', amount: '50.01' },
  { status: 'cancelled', amount: '999.00' }, { status: 'failed', amount: '999.00' }, { status: 'paid', amount: '100.00' },
].map((item, index) => ({ ...item, external_id: `commission-${index}`, source: 'lead', created_at: '2026-10-09T12:00:00Z' }));

test('promoter dashboard uses the backend referral URL, summary and real ledger', async ({ page }) => {
  await identity(page, 'promoter', 'active');
  await page.route('**/api/v1/collaborators/promoter/me', route => route.fulfill({ json: profile }));
  await page.route('**/api/v1/collaborators/promoter/summary', route => route.fulfill({ json: {
    week_paid_leads: 1, week_goal: 5, week_commission_total: '25.10', lifetime: { total_students: 3, total_received: '100.00', goals_hit: 0 },
  } }));
  await page.route('**/api/v1/collaborators/promoter/leads', route => route.fulfill({ json: Array.from({ length: 5 }, (_, index) => ({ external_id: `lead-${index}`, status: 'paid' })) }));
  await page.route('**/api/v1/collaborators/promoter/commissions', route => route.fulfill({ json: ledger }));
  await page.goto('/promoter/active');
  await expect(page.locator('code')).toHaveText(profile.ref_url);
  await expect(page.getByText('Comissões Recebidas')).toBeVisible();
  await expect(page.getByText(/100,00/)).toBeVisible();
  await expect(page.getByText('Comissão a Receber na Semana')).toBeVisible();
  await expect(page.getByText(/75,11/)).toBeVisible();
  await expect(page.getByText('Nesta semana: 1 matrícula(s) paga(s)')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('failed promoter summary remains visibly unavailable instead of showing zero sales', async ({ page }) => {
  await identity(page, 'promoter', 'active');
  await page.route('**/api/v1/collaborators/promoter/me', route => route.fulfill({ json: profile }));
  await page.route('**/api/v1/collaborators/promoter/summary', route => route.fulfill({ status: 503, json: { detail: 'Resumo indisponível' } }));
  await page.route('**/api/v1/collaborators/promoter/leads', route => route.fulfill({ json: [] }));
  await page.route('**/api/v1/collaborators/promoter/commissions', route => route.fulfill({ json: [] }));
  await page.goto('/promoter/active');
  await expect(page.getByRole('alert')).toContainText('Resumo indisponível');
  await expect(page.getByText('Matrículas Pagas', { exact: true })).not.toBeVisible();
});

test('commission balance excludes cancelled and failed records and exposes their actual status', async ({ page }) => {
  await identity(page, 'promoter', 'active');
  await page.route('**/api/v1/collaborators/promoter/me', route => route.fulfill({ json: profile }));
  await page.route('**/api/v1/collaborators/promoter/commissions', route => route.fulfill({ json: ledger }));
  await page.goto('/promoter/active/commissions');
  await expect(page.getByText(/75,11/)).toBeVisible();
  await expect(page.getByText('Comissão cancelada')).toBeVisible();
  await expect(page.getByText('Falha no repasse')).toBeVisible();
  await expect(page.getByText('Repasse em processamento')).toBeVisible();
});

test('RG and selfie for the same enrollment remain distinct and student documents use the document endpoint', async ({ page }) => {
  await identity(page, 'hub', 'active');
  await page.route('**/api/v1/leadership/reviews', route => route.fulfill({ json: {
    enrollment_rg: [{ external_id: 'enrollment-id', type: 'enrollment', kind: 'rg', name: 'Pessoa RG' }],
    enrollment_selfie: [{ external_id: 'enrollment-id', type: 'enrollment', kind: 'selfie', name: 'Pessoa selfie' }],
    enrollment_address_proof: [{ external_id: 'enrollment-id', type: 'enrollment', kind: 'address_proof', name: 'Pessoa endereço' }],
    student_documents: [{ external_id: 'document-id', student_external_id: 'student-id', document_external_id: 'document-id', type: 'student', kind: 'document', name: 'Pessoa histórico', doc_type: 'transcript' }],
  } }));
  const actions: string[] = [];
  await page.route('**/api/v1/leadership/**/decide', route => {
    actions.push(new URL(route.request().url()).pathname);
    return route.fulfill({ json: { status: 'approved' } });
  });
  await page.goto('/hub/review');
  await expect(page.getByRole('button', { name: '✓ Aprovar', exact: true })).toHaveCount(4);
  await page.getByRole('button', { name: '✓ Aprovar', exact: true }).nth(0).click();
  await expect(page.getByRole('button', { name: '✓ Aprovar', exact: true })).toHaveCount(3);
  await page.getByRole('button', { name: '✓ Aprovar', exact: true }).nth(0).click();
  await expect(page.getByRole('button', { name: '✓ Aprovar', exact: true })).toHaveCount(2);
  await page.getByRole('button', { name: '✓ Aprovar', exact: true }).nth(0).click();
  await expect(page.getByRole('button', { name: '✓ Aprovar', exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: '✓ Aprovar', exact: true }).click();
  await expect(page.getByText('✓ Aprovação registrada')).toHaveCount(4);
  expect(actions).toEqual([
    '/api/v1/leadership/enrollments/enrollment-id/rg/decide',
    '/api/v1/leadership/enrollments/enrollment-id/selfie/decide',
    '/api/v1/leadership/enrollments/enrollment-id/address-proof/decide',
    '/api/v1/leadership/students/student-id/documents/document-id/decide',
  ]);
});

test('an active student keeps active navigation while academic documents await review', async ({ page }) => {
  await identity(page, 'student', 'active');
  await page.route('**/api/v1/clients/student/me', route => route.fulfill({ json: { status: 'documents_under_review', documents: [], pendencies: [] } }));
  await page.goto('/student/active/documents');
  await expect(page.getByRole('link', { name: 'Documentos', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: '1. RG / CNH', exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Enviar comprovante de documento militar')).toBeVisible();
});
