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

test('mobile layout keeps every primary surface usable without page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Render grid' }).click();

  const layout = await page.evaluate(() => ({
    viewportWidth: innerWidth,
    bodyWidth: document.body.scrollWidth,
    editorHeight: document.querySelector('.editor-panel').getBoundingClientRect().height,
    toolbarHeight: document.querySelector('.toolbar').getBoundingClientRect().height,
    gridHeight: document.querySelector('.grid-panel').getBoundingClientRect().height,
    pathBottom: document.querySelector('#json-path-panel').getBoundingClientRect().bottom,
    actionsScrollable:
      document.querySelector('.toolbar-actions').scrollWidth >
      document.querySelector('.toolbar-actions').clientWidth,
  }));

  expect(layout.bodyWidth).toBe(layout.viewportWidth);
  expect(layout.editorHeight).toBeGreaterThan(220);
  expect(layout.toolbarHeight).toBeGreaterThanOrEqual(80);
  expect(layout.gridHeight).toBeGreaterThan(250);
  expect(layout.pathBottom).toBe(844);
  expect(layout.actionsScrollable).toBe(true);
});

test('mobile export menu and schema panel stay inside the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Render grid' }).click();

  const exportButton = page.getByRole('button', { name: 'Export data' });
  await exportButton.scrollIntoViewIfNeeded();
  await exportButton.click();
  const menuBox = await page.locator('#export-menu').boundingBox();
  expect(menuBox.x).toBeGreaterThanOrEqual(0);
  expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(320);
  expect(menuBox.y).toBeGreaterThanOrEqual(0);
  expect(menuBox.y + menuBox.height).toBeLessThanOrEqual(568);

  await page.getByRole('button', { name: 'Infer JSON Schema' }).click();
  const schemaBox = await page.locator('#schema-panel').boundingBox();
  expect(schemaBox.x).toBe(0);
  expect(schemaBox.width).toBe(320);
  expect(schemaBox.height).toBeLessThanOrEqual(568);
});

test('mobile diff mode gives both editors usable height', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle diff mode' }).click();

  const panes = await page.locator('.diff-pane').evaluateAll((elements) =>
    elements.map((element) => element.getBoundingClientRect().height)
  );
  expect(panes).toHaveLength(2);
  expect(Math.min(...panes)).toBeGreaterThan(180);
});