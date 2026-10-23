import { test, expect } from '@playwright/test';
for (const pending of [false, true]) {
  test(`CPF waits for queued identity, pending=${pending}`, async ({ page }) => {
    test.setTimeout(20000);
    await page.addInitScript(() => localStorage.setItem('supletivo.login', JSON.stringify({access_token:'test',roles:['lead'],role_statuses:{student:'lead'}})));
    await page.route('**/api/v1/clients/whoami', r => r.fulfill({json:{roles:['lead'],role_statuses:{student:'lead'}}}));
    await page.route('**/api/v1/clients/lead/me*', r => r.fulfill({json:{external_id:'test-lead',created_at:'2026-10-14T12:00:00Z',status:'pending',customer:{},promoter:{},pricing:{pix:'1615',card:{installments:12,installment:'159.90',total:'1918.80'},has_discount:false}}}));
    let payments=0;
    await page.route('**/api/v1/clients/lead/checkout', r => {payments++; return r.fulfill({status:409,json:{detail:'Complete o cadastro',code:'PROFILE_INCOMPLETE',extra:{missing_fields:['cpf']}}});});
    let posts=0, reads=0;
    await page.route('**/api/v1/clients/lead/identity', r => {posts++; return r.fulfill({json:{cpf:'09126367939',pending,status:pending?'pending':'success'}});});
    await page.route('**/api/v1/clients/lead/identity/status', r => {reads++; return r.fulfill({json:{cpf:'09126367939',pending,status:pending?'pending':'success'}});});
    await page.goto('/student/lead/payment');
    await page.getByRole('button',{name:/Pagar com PIX Oficial/}).click();
    await page.getByLabel('Seu CPF',{exact:true}).fill('09126367939');
    await page.getByRole('button',{name:/Confirmar e Ir/}).click();
    if (pending) {
      await expect(page.getByText(/Seu CPF está em conferência/)).toBeVisible({timeout:35000});
      expect(payments).toBe(1);
      expect(reads).toBe(0);
      await expect(page.getByRole('button',{name:/Confirmar e Ir/})).toBeEnabled();
      await page.getByRole('button',{name:/Voltar às opções/}).click();
      await expect(page.getByRole('button',{name:/Pagar com PIX Oficial/})).toBeEnabled();
    } else {
      await expect.poll(()=>payments).toBe(2);
      expect(reads).toBe(0);
    }
    expect(posts).toBe(1);
  });
}
