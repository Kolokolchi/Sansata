import { expect, test } from '@playwright/test';

test('local brochures, floor sheets and original assets work with keyboard and touch', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const failed: string[] = [];
  page.on('response', response => { if (response.status() >= 400) failed.push(new URL(response.url()).pathname); });
  await page.goto('/saf/materials?tab=floors&block=7');
  await expect(page.locator('.saf-floor-sheets article')).toHaveCount(2);
  const button = page.getByRole('button', { name: 'Открыть страницу 25' });
  if (await page.evaluate(() => matchMedia('(pointer: coarse)').matches)) await button.tap();
  else { await button.hover(); await button.focus(); await page.keyboard.press('Enter'); }
  await expect(page).toHaveURL(/page=25/);
  await expect(page.locator('.saf-brochure-page img')).toHaveAttribute('alt', /страница 25/);
  await expect.poll(() => page.locator('.saf-brochure-page img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.reload();
  await expect(page.getByLabel('Страница', { exact: true })).toHaveValue('25');
  await page.getByRole('button', { name: 'Далее' }).click();
  await expect(page.getByLabel('Страница', { exact: true })).toHaveValue('26');
  await page.goBack();
  await expect(page.getByLabel('Страница', { exact: true })).toHaveValue('25');
  await page.getByRole('tab', { name: 'Планы с сайта', exact: true }).click();
  await expect(page.locator('.plan-media img')).toHaveCount(27);
  await page.getByRole('tab', { name: 'Коммерция', exact: true }).click();
  await expect(page.locator('.plan-media img')).toHaveCount(18);
  const downloadPromise = page.waitForEvent('download');
  await page.locator('.saf-material-documents a').first().click();
  const download = await downloadPromise;
  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2)).toBe(true);
  expect(errors).toEqual([]); expect(failed).toEqual([]);
});

test('snapshot preserves actual sections and floors, historic statuses and linked layouts', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/saf/stock?section=8');
  await expect(page.getByText('Найдено: 2', { exact: true })).toBeVisible();
  await expect(page.locator('.saf-stock-matrix button')).toHaveCount(2);
  await expect(page.getByText(/Не актуальное наличие/)).toBeVisible();
  await page.getByLabel('Секция', { exact: true }).selectOption('1');
  await page.getByLabel('Этаж', { exact: true }).selectOption('2');
  await expect(page.locator('.saf-stock-matrix button')).toHaveCount(5);
  const unit = page.getByRole('button', { name: 'Секция 1, этаж 2, № 1, Свободно на дату снимка', exact: true });
  if (await page.evaluate(() => matchMedia('(pointer: coarse)').matches)) await unit.tap();
  else { await unit.hover(); await unit.focus(); await page.keyboard.press('Enter'); }
  await expect(page.getByRole('heading', { name: 'Квартира № 1', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Квартира № 1', exact: true })).toBeVisible();
  await page.getByRole('link', { name: /Открыть планировку в конструкторе/ }).click();
  await expect(page).toHaveURL(/\/saf\/plan\/KV-P1-E2-S1/);
  await expect(page.getByRole('heading', { name: 'Связанные квартиры в снимке' })).toBeVisible();
  await page.goto('/saf/stock?status=reserved&view=table');
  await expect(page.locator('.saf-stock-table tbody tr')).toHaveCount(2);
  await page.getByLabel('Номер или код').fill('does-not-exist');
  await expect(page.getByText('Помещений с такими параметрами в снимке нет.')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2)).toBe(true);
  expect(errors).toEqual([]);
});
