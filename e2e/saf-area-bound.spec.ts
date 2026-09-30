import { expect, test } from '@playwright/test';

test('zero upper area bound filters out positive area plans in both catalog views', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/saf');
  const catalogueMax = page.getByRole('spinbutton', { name: 'До', exact: true });
  await catalogueMax.fill('0');
  await expect(page.locator('.saf-empty')).toBeVisible();
  await catalogueMax.fill('');
  await expect(page.locator('.saf-plan-card').first()).toBeVisible();

  await page.goto('/saf/chessboard');
  const boardMax = page.getByRole('spinbutton', { name: 'До', exact: true });
  await boardMax.fill('0');
  await expect(page.getByRole('heading', { name: 'Варианты не найдены' })).toBeVisible();
  await boardMax.fill('');
  await expect(page.locator('.saf-chessboard-matrix')).toBeVisible();
  expect(errors).toEqual([]);
});
