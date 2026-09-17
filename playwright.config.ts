import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Configuration for Sansata Shattyq Real-Estate Visualizer.
 * Supports Desktop Chrome (1920x1080), Desktop Smaller (1366x768), Tablet (768x1024), and Mobile (393x851).
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'test-results/html-report' }]
  ],
  outputDir: 'test-results/artifacts',
  timeout: 45000,
  expect: {
    timeout: 10000
  },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off'
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        extraHTTPHeaders: {
          'x-forwarded-for': '10.10.1.1'
        }
      }
    },
    {
      name: 'Desktop Smaller',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 },
        extraHTTPHeaders: {
          'x-forwarded-for': '10.10.2.1'
        }
      }
    },
    {
      name: 'Tablet',
      use: {
        browserName: 'chromium',
        viewport: { width: 768, height: 1024 },
        hasTouch: true,
        isMobile: true,
        extraHTTPHeaders: {
          'x-forwarded-for': '10.10.3.1'
        }
      }
    },
    {
      name: 'Mobile',
      use: {
        ...devices['Pixel 5'],
        extraHTTPHeaders: {
          'x-forwarded-for': '10.10.4.1'
        }
      }
    }
  ],
  webServer: {
    command: process.platform === 'win32' ? 'npm.cmd run dev' : 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      TRUST_PROXY: 'true'
    }
  }
});
