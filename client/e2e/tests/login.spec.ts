import { test, expect } from '../fixtures/auth-fixture';
import { mockLoginDashboard, mockLoginOnboarding, mockInvalidCredentials } from '../mocks/auth.mock';

test.describe('Login Page', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('should show validation errors for empty fields', async ({ loginPage }) => {
    await loginPage.clickLogin();
    await expect(loginPage.page.locator('.field-error')).toHaveCount(2);
  });

  test('should toggle password visibility', async ({ loginPage }) => {
    await loginPage.togglePasswordVisibility();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');
  });

  test('should display error for invalid credentials', async ({ page, loginPage }) => {
    await mockInvalidCredentials(page);
    await loginPage.fillEmail('john@company.com');
    await loginPage.fillPassword('wrongpassword');

    await Promise.all([
      loginPage.clickLogin(),
      page.waitForResponse((res) => res.url().includes('/api/auth/login') && res.status() === 401),
    ]);

    await expect(loginPage.errorBanner).toContainText('Invalid email or password');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('should redirect to dashboard when hasProfile = true', async ({ page, loginPage }) => {
    await mockLoginDashboard(page);
    await loginPage.fillEmail('john@company.com');
    await loginPage.fillPassword('correctpassword');

    await Promise.all([
      page.waitForURL(/\/dashboard$/, { timeout: 10000 }),
      loginPage.clickLogin(),
    ]);
  });

  test('should redirect to onboarding when hasProfile = false', async ({ page, loginPage }) => {
    await mockLoginOnboarding(page);
    await loginPage.fillEmail('jane@company.com');
    await loginPage.fillPassword('correctpassword');

    await Promise.all([
      page.waitForURL(/\/onboarding$/, { timeout: 10000 }),
      loginPage.clickLogin(),
    ]);
  });
});
