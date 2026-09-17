import { test, expect } from '@playwright/test';

test.describe('Challenger Stress: Routing & Visualizer Boundaries', () => {
  test('handles invalid section route gracefully without white-screen or crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/visual/section/99');
    await expect(page.locator('.experience-page')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Такой секции или этажа нет');

    const backLink = page.locator('a:has-text("Вернуться на генплан")');
    await expect(backLink).toBeVisible();
    await backLink.click();

    await expect(page).toHaveURL(/\/visual$/);
    await expect(page.locator('.masterplan-stage')).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('handles invalid floor route gracefully without white-screen or crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/visual/section/1/floor/99');
    await expect(page.locator('.experience-page')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Такой секции или этажа нет');

    const backLink = page.locator('a:has-text("Вернуться на генплан")');
    await expect(backLink).toBeVisible();
    await backLink.click();

    await expect(page).toHaveURL(/\/visual$/);
    expect(errors).toEqual([]);
  });

  test('handles alphanumeric invalid section and floor gracefully', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    // Non-numeric section
    await page.goto('/visual/section/invalid_sec');
    await expect(page.locator('.experience-page')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Такой секции или этажа нет');

    // Non-numeric floor
    await page.goto('/visual/section/1/floor/invalid_fl');
    await expect(page.locator('.experience-page')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Такой секции или этажа нет');

    // Zero floor (out of 1..9 range)
    await page.goto('/visual/section/1/floor/0');
    await expect(page.locator('.experience-page')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Такой секции или этажа нет');

    // Out-of-bounds floor 10
    await page.goto('/visual/section/1/floor/10');
    await expect(page.locator('.experience-page')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Такой секции или этажа нет');

    expect(errors).toEqual([]);
  });

  test('handles non-existent flat ID gracefully', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/flat/non-existent-flat-uuid-99999');
    await expect(page.locator('.experience-page')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Планировка не найдена');

    const allFlatsLink = page.locator('a:has-text("Все планировки")');
    await expect(allFlatsLink).toBeVisible();
    await allFlatsLink.click();

    await expect(page).toHaveURL(/\/parametric-search/);
    await expect(page.locator('.experience-page h1')).toContainText('Найдите свою квартиру');

    expect(errors).toEqual([]);
  });

  test('handles valid section/floor with no published plans without crashing', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    // Section 2 Floor 7 has no published plans in current catalog
    await page.goto('/visual/section/2/floor/7');
    await expect(page.locator('.floor-stage')).toBeVisible();
    await expect(page.locator('.floor-empty')).toBeVisible();
    await expect(page.locator('.floor-empty h3')).toContainText('Чертежи этого этажа пока не опубликованы');

    expect(errors).toEqual([]);
  });

  test('deep link navigation and full browser history (back / forward)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    // 1. Direct load to deep link: Section 1, Floor 7 (which has 4 published plans)
    await page.goto('/visual/section/1/floor/7');
    await expect(page.locator('.floor-stage')).toBeVisible();
    await expect(page.locator('.floor-map')).toBeVisible();
    await expect(page.locator('.floor-map-heading')).toContainText('СЕКЦИЯ 1 / ЭТАЖ 7');
    await expect(page.locator('.floor-rail button.active')).toHaveAttribute('aria-label', 'Этаж 7');

    // 2. Select a flat from floor
    const firstFlat = page.locator('.floor-diagram button.floor-unit').first();
    await expect(firstFlat).toBeVisible();
    await firstFlat.click();

    await expect(page).toHaveURL(/\/flat\/[a-zA-Z0-9-]+/);
    await expect(page.locator('.flat-experience')).toBeVisible();

    // 3. Test view switching within flat
    const planTab = page.locator('.flat-view-tabs button:has-text("Планировка")');
    await expect(planTab).toBeVisible();
    await planTab.click();
    await expect(page).toHaveURL(/view=plan/);
    await expect(page.locator('.original-plan')).toBeVisible();

    const floorTab = page.locator('.flat-view-tabs button:has-text("На этаже")');
    await expect(floorTab).toBeVisible();
    await floorTab.click();
    await expect(page).toHaveURL(/view=floor/);
    await expect(page.locator('.flat-floor-view')).toBeVisible();

    // 4. Test Browser Back button: returns to view=plan
    await page.goBack();
    await expect(page).toHaveURL(/view=plan/);
    await expect(page.locator('.original-plan')).toBeVisible();

    // 5. Test Browser Back button: returns to tour view
    await page.goBack();
    await expect(page).toHaveURL(/\/flat\/[a-zA-Z0-9-]+/);

    // 6. Test Browser Back button: returns to Floor 7
    await page.goBack();
    await expect(page).toHaveURL(/\/visual\/section\/1\/floor\/7$/);
    await expect(page.locator('.floor-stage')).toBeVisible();
    await expect(page.locator('.floor-map-heading')).toContainText('СЕКЦИЯ 1 / ЭТАЖ 7');

    // 7. Test Browser Forward button: returns to Flat
    await page.goForward();
    await expect(page).toHaveURL(/\/flat\/[a-zA-Z0-9-]+/);
    await expect(page.locator('.flat-experience')).toBeVisible();

    expect(errors).toEqual([]);
  });
});
