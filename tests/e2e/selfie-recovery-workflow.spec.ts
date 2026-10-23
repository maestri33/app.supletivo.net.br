import { test, expect, type Page } from '@playwright/test';

async function setup(page: Page, role: 'student' | 'promoter', selfie = { exists: false, analysis_status: '' }) {
  await page.addInitScript(() => {
    localStorage.setItem('supletivo.login', JSON.stringify({ access_token: 'fixture', refresh_token: 'fixture' }));
    localStorage.setItem('supletivo.session', JSON.stringify({ phone: '11900000000', externalId: 'fixture' }));
  });
  await page.route('**/api/v1/clients/whoami', route => route.fulfill({ json: { external_id: 'fixture', roles: [role === 'student' ? 'enrollment' : 'candidate'], role_statuses: { [role]: role === 'student' ? 'enrollment' : 'candidate' } } }));
  await page.route('**/localidades/estados**', route => route.fulfill({ json: [] }));
  await page.route('**/contract/current', route => route.fulfill({ json: { text: 'Contrato exclusivo de teste', version: 'test' } }));
  const doc = { number: '123', doc_type: 'rg', full_photo: 'test.jpg', analysis_status: 'approved', validation_status: 'approved', missing_fields: [] };
  const state = { status: 'selfie', selfie, documents: { rg: doc }, address_proof: { exists: true, status: 'approved' }, address: { street: 'Rua', number: '1', city: 'Cidade', state: 'PR', zipcode: '80000000' }, ref_url: 'https://supletivo.net.br', profile: {}, pix_validated: true };
  await page.route('**/api/v1/clients/enrollment/me', route => route.fulfill({ json: state }));
  await page.route('**/api/v1/collaborators/candidate/me', route => route.fulfill({ json: state }));
  await page.route('**/api/v1/collaborators/candidate/document', route => route.fulfill({ json: doc }));
  await page.goto(role === 'student' ? '/student/enrollment/selfie' : '/promoter/candidate');
}

for (const role of ['student', 'promoter'] as const) {
  test(`${role}: live camera frame is captured and sent once`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, permissions: ['camera'] });
    const page = await context.newPage();
    await page.addInitScript(() => {
      // In-memory video frames exercise canvas capture without uploading personal data.
      navigator.mediaDevices.getUserMedia = async () => {
        const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 480;
        const ctx = canvas.getContext('2d')!; ctx.fillRect(0, 0, 640, 480);
        const stream = canvas.captureStream(10);
        setInterval(() => ctx.fillRect(0, 0, 640, 480), 100);
        return stream;
      };
    });
    let uploads = 0;
    await setup(page, role);
    const path = role === 'student' ? '**/api/v1/clients/enrollment/selfie' : '**/api/v1/collaborators/candidate/selfie';
    await page.route(path, route => {
      uploads++;
      expect(route.request().headers()['content-type']).toContain('multipart/form-data');
      return route.fulfill({ status: 503, json: { detail: 'Falha controlada de teste' } });
    });
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Abrir câmera para selfie' }).click();
    await expect(page.getByRole('button', { name: 'Fotografar e enviar selfie' })).toBeEnabled();
    await page.getByRole('button', { name: 'Fotografar e enviar selfie' }).click();
    await expect(page.getByText('Falha controlada de teste', { exact: true })).toBeVisible();
    expect(uploads).toBe(1);
    await expect(page.getByRole('button', { name: 'Abrir câmera para selfie' })).toBeEnabled();
    await context.close();
  });
  test(`${role}: permission ignored allows cancellation and retry`, async ({ page }) => {
    await page.addInitScript(() => { navigator.mediaDevices.getUserMedia = () => new Promise(() => {}); });
    await setup(page, role);
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Abrir câmera para selfie' }).click();
    await page.getByRole('button', { name: 'Cancelar abertura' }).click();
    await expect(page.getByRole('button', { name: 'Abrir câmera para selfie' })).toBeEnabled();
    await page.getByRole('button', { name: 'Abrir câmera para selfie' }).click();
    await expect(page.getByRole('alert')).toContainText('A câmera não respondeu', { timeout: 18000 });
    await expect(page.getByRole('button', { name: 'Abrir câmera para selfie' })).toBeEnabled();
  });
  test(`${role}: occupied camera explains recovery`, async ({ page }) => {
    await page.addInitScript(() => { navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('busy', 'NotReadableError')); });
    await setup(page, role);
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Abrir câmera para selfie' }).click();
    await expect(page.getByRole('alert')).toContainText('Feche outros apps');
    await expect(page.getByRole('button', { name: 'Abrir câmera para selfie' })).toBeEnabled();
  });
  test(`${role}: review shows actual next step without requesting another selfie`, async ({ page }) => {
    await setup(page, role, { exists: true, analysis_status: 'review' });
    await expect(page.getByText('Sua selfie foi recebida e precisa de conferência do polo. Você não precisa enviar outra foto agora.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Abrir câmera para selfie' })).toHaveCount(0);
  });
}

test('student resumes pending analysis after reload', async ({ page }) => {
  await setup(page, 'student', { exists: true, analysis_status: 'pending' });
  let reads = 0;
  await page.route('**/api/v1/clients/enrollment/me', route => { reads++; return route.fulfill({ json: { status: 'selfie', selfie: { exists: true, analysis_status: reads > 1 ? 'review' : 'pending' } } }); });
  await page.reload();
  await expect(page.getByText('Sua selfie foi recebida e precisa de conferência do polo. Você não precisa enviar outra foto agora.')).toBeVisible();
  expect(reads).toBeGreaterThan(1);
});
