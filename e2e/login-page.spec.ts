import { test, expect } from '@playwright/test';

/**
 * E2E tests for the login page.
 *
 * Prerequisites: Start dev server first with `npm run web`
 *
 * Note: React Native Web Pressable doesn't use proper button role,
 * so we use text-based selectors.
 */
test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    // Wait for React to hydrate
    await page.waitForSelector('text=Cairn', { timeout: 30000 });
  });

  test('displays branding and sign-in button', async ({ page }) => {
    // Verify branding
    await expect(page.getByText('Cairn')).toBeVisible();
    await expect(page.getByText(/stack your habits/i)).toBeVisible();
    await expect(page.getByText(/mark your journey/i)).toBeVisible();

    // Verify sign-in button (RN Web Pressable uses div, not button)
    await expect(page.getByText('Continue with Google')).toBeVisible();
  });

  test('sign-in button initiates OAuth flow', async ({ page }) => {
    const signInButton = page.getByText('Continue with Google');

    // Set up popup listener before clicking
    const popupPromise = page.waitForEvent('popup', { timeout: 10000 });
    await signInButton.click();

    // Verify OAuth popup opens
    const popup = await popupPromise;
    expect(popup.url()).toMatch(/accounts\.google\.com|auth\.expo\.io/);
    await popup.close();
  });
});
