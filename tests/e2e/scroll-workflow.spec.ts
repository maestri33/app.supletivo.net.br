import { test, expect, type Page } from '@playwright/test';

async function openSelfie(page: Page, role: 'student' | 'promoter') {
  await page.addInitScript(() => {
    localStorage.setItem('supletivo.login', JSON.stringify({ access_token: 'fixture', refresh_token: 'fixture' }));
    localStorage.setItem('supletivo.session', JSON.stringify({ phone: '11900000000', externalId: 'fixture' }));
  });
  await page.route('**/api/v1/clients/whoami', route => route.fulfill({ json: { external_id: 'fixture', roles: [role === 'student' ? 'enrollment' : 'candidate'], role_statuses: { [role]: role === 'student' ? 'enrollment' : 'candidate' } } }));
  await page.route('**/localidades/estados**', route => route.fulfill({ json: [] }));
  await page.route('**/contract/current', route => route.fulfill({ json: { text: 'Texto extenso do contrato para exercício de rolagem.\n'.repeat(45), version: 'test' } }));
  const doc = { number: '123', doc_type: 'rg', full_photo: 'test.jpg', analysis_status: 'approved', validation_status: 'approved', missing_fields: [] };
  const state = { status: 'selfie', selfie: { exists: false }, documents: { rg: doc }, address_proof: { exists: true, status: 'approved' }, address: { street: 'Rua', number: '1', city: 'Cidade', state: 'PR', zipcode: '80000000' }, ref_url: 'https://supletivo.net.br', profile: {}, pix_validated: true };
  await page.route('**/api/v1/clients/enrollment/me', route => route.fulfill({ json: state }));
  await page.route('**/api/v1/collaborators/candidate/me', route => route.fulfill({ json: state }));
  await page.route('**/api/v1/collaborators/candidate/document', route => route.fulfill({ json: doc }));
  await page.goto(role === 'student' ? '/student/enrollment/selfie' : '/promoter/candidate');
  await expect(page.getByRole('checkbox')).toBeVisible();
}

async function appScrollTop(page: Page) {
  return page.evaluate(() => document.querySelector<HTMLElement>('#conteudo')?.scrollTop ?? window.scrollY);
}

for (const role of ['student', 'promoter'] as const) {
  test(`${role}: wheel scrolls the page outside the contract`, async ({ page }) => {
    await page.setViewportSize({ width: 502, height: 648 });
    await openSelfie(page, role);
    await page.mouse.move(350, 180);
    await page.mouse.wheel(0, 350);
    await expect.poll(() => appScrollTop(page), { timeout: 3000 }).toBeGreaterThan(30);
    await page.getByRole('checkbox').scrollIntoViewIfNeeded();
    const box = await page.getByRole('checkbox').boundingBox();
    const dock = await page.locator('nav[aria-label^="Navegação principal"]').boundingBox();
    expect(box).not.toBeNull(); expect(dock).not.toBeNull();
    expect(box!.y + box!.height).toBeLessThanOrEqual(dock!.y);
  });

  test(`${role}: touch gesture scrolls the page`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 700 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await openSelfie(page, role);
    const cdp = await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 270, y: 250 }] });
    for (const y of [220, 190, 160, 130, 100]) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 270, y }] });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(() => appScrollTop(page), { timeout: 3000 }).toBeGreaterThan(30);
    await context.close();
  });
}

test('student: scrolling past the contract end continues on the page', async ({ page }) => {
  await page.setViewportSize({ width: 502, height: 648 });
  await openSelfie(page, 'student');
  const contract = page.getByLabel('Texto do contrato');
  await contract.scrollIntoViewIfNeeded();
  const rect = await contract.boundingBox();
  expect(rect).not.toBeNull();
  await page.mouse.move(rect!.x + rect!.width / 2, Math.min(450, rect!.y + 60));
  await page.mouse.wheel(0, 3000);
  await expect.poll(() => contract.evaluate(el => el.scrollTop), { timeout: 3000 }).toBeGreaterThan(0);
  const before = await appScrollTop(page);
  await page.mouse.wheel(0, 350);
  await expect.poll(() => appScrollTop(page), { timeout: 3000 }).toBeGreaterThan(before);
});
