import { expect, test } from '@playwright/test';

test('SAF chessboard keeps object selection intact and opens a layout by block and level', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/projects');
  await expect(page.getByRole('heading', { name: 'Выберите объект.' })).toBeVisible();
  await expect(page.locator('.saf-chessboard-fab')).toHaveCount(0);
  await page.goto('/saf');
  const chessboardButton = page.getByRole('link', { name: 'Шахматка, выбрать квартиру или нежилое помещение' });
  const buttonBounds = await chessboardButton.boundingBox();
  expect(buttonBounds?.width).toBe(100);
  expect(buttonBounds?.height).toBe(100);
  await expect(chessboardButton).toHaveCSS('border-radius', '50%');
  await expect(chessboardButton).toHaveCSS('background-color', 'rgb(53, 79, 213)');
  await chessboardButton.click();
  await expect(page).toHaveURL(/\/saf\/chessboard$/);
  await expect(page.locator('.saf-app')).toHaveClass(/sensata-chessboard-page/);
  await expect(page.locator('.saf-chessboard-matrix thead th')).toHaveCount(8);
  await page.getByRole('button', { name: 'Блок 2', exact: true }).click();
  await expect(page.locator('.saf-chessboard-matrix thead th')).toHaveCount(2);
  await page.getByRole('button', { name: 'Этаж 2', exact: true }).click();
  await expect(page).toHaveURL(/block=2&level=E2/);
  await expect(page.locator('.saf-chessboard-cells button')).toHaveCount(4);
  await page.getByRole('tab', { name: 'Шахматка +' }).click();
  await expect(page.locator('.saf-chessboard-grid')).toHaveClass(/expanded/);
  const firstVariant = page.locator('.saf-chessboard-cells button').first();
  if (await page.evaluate(() => matchMedia('(pointer: coarse)').matches)) await firstVariant.tap();
  else { await firstVariant.focus(); await page.keyboard.press('Enter'); }
  await expect(page.getByRole('dialog', { name: 'Планировка KV-P2-E2-S1' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Закрыть карточку' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Блок 2', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.saf-chessboard-cells button')).toHaveCount(4);
  await page.getByRole('tab', { name: 'Помещения' }).click();
  await expect(page.getByRole('heading', { name: '364 помещения в снимке шахматки' })).toBeVisible();
  await page.getByRole('tab', { name: 'Планировки' }).click();
  await expect(page.locator('.saf-chessboard-table-wrap tbody tr')).toHaveCount(4);
  await expect(page.getByRole('link', { name: 'Официальная шахматка' })).toHaveAttribute('href', /www\.sensata\.kz\/project\/saf-avenue#/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2)).toBe(true);
  expect(errors).toEqual([]);
});

