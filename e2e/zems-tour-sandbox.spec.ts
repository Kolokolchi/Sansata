import { expect, test } from '@playwright/test';

test('Zemsdesign tour stays isolated and fills the viewport', async ({ page }) => {
  await page.goto('/sandbox/zems-tour', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle('Тестовый 3D-тур Земсдизайн');

  const frame = page.getByTitle('Земсдизайн — экскурсия по квартире');
  await expect(frame).toBeVisible();
  await expect(frame).toHaveAttribute('src', 'https://ep.matterport.host/index/?m=RQ6XPTgW9Du&title=0');
  const bounds = await frame.boundingBox();
  const viewport = page.viewportSize()!;
  expect(bounds?.x).toBe(0);
  expect(bounds?.y).toBe(0);
  expect(bounds?.width).toBe(viewport.width);
  expect(bounds?.height).toBe(viewport.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  const close = page.getByRole('button', { name: 'Закрыть 3D-тур' });
  await close.focus();
  await page.keyboard.press('Enter');
  await expect(frame).toHaveCount(0);
  const reopen = page.getByRole('button', { name: 'Открыть экскурсию' });
  if (await page.evaluate(() => matchMedia('(pointer: coarse)').matches)) await reopen.tap();
  else await reopen.click();
  await expect(frame).toBeVisible();
  const shortcut = page.locator('.saf-chessboard-fab');
  await expect(shortcut).toBeVisible();
  await shortcut.click();
  await expect(page).toHaveURL(/\/saf\/chessboard$/);
  await expect(page.getByRole('heading', { name: 'Шахматка планировок.', exact: true })).toBeVisible();
  await expect(shortcut).toHaveCount(0);
});
