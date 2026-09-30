import { expect, test } from '@playwright/test';

test('malformed SAF apartment and plan identifiers do not crash navigation', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/saf');
  for (const prefix of ['/saf/plan/', '/saf/apartment/']) {
    for (const id of ['%FF', '%E0%A0', 'invalid%2', 'slug%zz']) {
      await page.evaluate(path => {
        history.pushState(null, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, prefix + id);
      await expect(page.getByRole('heading', { name: 'Страница не найдена.' })).toBeVisible();
    }
  }
  expect(errors).toEqual([]);
});

test('unknown URLs show a not-found page while retired routes keep their guidance', async ({ page }) => {
  await page.goto('/not-a-page');
  await expect(page.getByRole('heading', { name: 'Страница не найдена.' })).toBeVisible();
  await expect(page).toHaveTitle('Страница не найдена | Sensata');
  await expect(page.locator('.saf-chessboard-fab')).toHaveCount(0);

  await page.goto('/saf/plan/INVALID');
  await expect(page.getByRole('heading', { name: 'Страница не найдена.' })).toBeVisible();

  await page.goto('/cloud-tour');
  await expect(page.getByRole('heading', { name: 'Раздел обновлён.' })).toBeVisible();
});

test('switching to the plan closes the interior editor', async ({ page }) => {
  await page.goto('/saf/plan/KV-P7-E3-S1');
  const editorButton = page.getByRole('button', { name: 'Интерьер', exact: true });
  await editorButton.click();
  await expect(page.getByRole('button', { name: 'Сохранить на устройстве' })).toBeVisible();
  await page.getByRole('button', { name: 'Планировка', exact: true }).click();
  await expect(editorButton).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'Объёмный вид', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Сохранить на устройстве' })).toHaveCount(0);
});

test('the floating chessboard shortcut stays on selection pages and does not cover detail actions', async ({ page }) => {
  await page.goto('/saf');
  await expect(page.locator('.saf-chessboard-fab')).toBeVisible();
  await page.goto('/saf/plan/KV-P7-E3-S1');
  await expect(page.locator('.saf-chessboard-fab')).toHaveCount(0);
  await page.getByRole('button', { name: 'Сравнить', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Убрать из сравнения' })).toBeVisible();
});
