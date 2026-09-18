import { expect, test } from '@playwright/test';

test('Luma cloud tour is dedicated on /cloud-tour and supports exterior and interior scene switching', async ({ page }) => {
  await page.route('https://lumalabs.ai/embed/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<main>3D scene ready</main>' })
  );

  // 1. Check dedicated /cloud-tour
  await page.goto('/cloud-tour');
  await expect(page.getByRole('heading', { name: 'Облачный 3D-тур' })).toBeVisible();

  // Scene switcher tabs exist
  const exteriorTab = page.getByRole('tab', { name: 'Экстерьер' });
  const interiorTab = page.getByRole('tab', { name: 'Интерьер' });
  await expect(exteriorTab).toBeVisible();
  await expect(interiorTab).toBeVisible();
  await expect(exteriorTab).toHaveAttribute('aria-selected', 'true');

  const frame = page.locator('.luma-tour-frame iframe');
  await expect(frame).toHaveAttribute(
    'src',
    /https:\/\/lumalabs\.ai\/embed\/4f362242-ad43-4851-9b04-88adf71f24f5/
  );
  await expect(page.getByRole('link', { name: 'Открыть оригинал на Luma Labs' })).toHaveAttribute(
    'href',
    'https://lumalabs.ai/capture/4f362242-ad43-4851-9b04-88adf71f24f5'
  );

  // Switch to interior scene
  await interiorTab.click();
  await expect(interiorTab).toHaveAttribute('aria-selected', 'true');
  await expect(frame).toHaveAttribute(
    'src',
    /https:\/\/lumalabs\.ai\/embed\/b271fff7-37dd-47b1-8921-6375cd069c91/
  );
  await expect(page.getByRole('link', { name: 'Открыть оригинал на Luma Labs' })).toHaveAttribute(
    'href',
    'https://lumalabs.ai/capture/b271fff7-37dd-47b1-8921-6375cd069c91'
  );
  await expect(page.locator('.luma-tour-caption')).toContainText('Grand Central Terminal');

  // Switch back to exterior scene
  await exteriorTab.click();
  await expect(exteriorTab).toHaveAttribute('aria-selected', 'true');
  await expect(frame).toHaveAttribute(
    'src',
    /https:\/\/lumalabs\.ai\/embed\/4f362242-ad43-4851-9b04-88adf71f24f5/
  );

  // 2. Check /tour
  await page.goto('/tour');
  await expect(page.getByRole('heading', { name: 'Архитектура и пространство.' })).toBeVisible();

  // Verify that /tour has NO tabs for "Облачный 3D-тур" and NO "3D-интерьер квартиры"
  await expect(page.getByRole('tab', { name: 'Облачный 3D-тур' })).toHaveCount(0);
  await expect(page.getByRole('tab', { name: '3D-интерьер квартиры' })).toHaveCount(0);
});
