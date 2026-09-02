import { expect, test } from '@playwright/test';

test('production deployment loads and renders a grid', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.goto('/');
  await expect(page).toHaveTitle(/JSON Grid/);
  await page.getByRole('button', { name: 'Render grid' }).click();

  await expect(page.getByRole('region', { name: 'Data grid output' })).toContainText('squadName');
  await expect(page.locator('[data-json-pointer="/members/0/name"]')).toHaveText('Bentley Clayton');
  expect(consoleErrors).toEqual([]);
});

test('production deployment exposes hosting metadata', async ({ request }) => {
  const [cname, robots, sitemap] = await Promise.all([
    request.get('/CNAME'),
    request.get('/robots.txt'),
    request.get('/sitemap.xml'),
  ]);

  expect(cname.ok()).toBe(true);
  expect((await cname.text()).trim()).toBe('www.jsongrid.dev');
  expect(await robots.text()).toContain('Sitemap: https://www.jsongrid.dev/sitemap.xml');
  expect(await sitemap.text()).toContain('<loc>https://www.jsongrid.dev/</loc>');
});