import { test, expect } from '../fixtures/auth-fixture';
import { mockRegisterSuccess,mockRegisterEmailExists,mockRegisterBadRequest,mockRegisterNetworkError } from '../mocks/auth.mock';
import { RegisterPage } from '../pages/register.page';

test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();
  });

  test('shows validation errors when submitting empty form', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.submit();
    await expect(page.locator('.field-error')).toHaveCount(3);
  });

  test('toggles password visibility', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.togglePasswordVisibility();
    await expect(registerPage.passwordInput).toHaveAttribute('type', 'text');
  });

  test('shows error banner for network error', async ({ page }) => {
    await mockRegisterNetworkError(page);
    const registerPage = new RegisterPage(page);

    await registerPage.selectRole('STARTUP');
    await registerPage.fillFullName('John Doe');
    await registerPage.fillEmail('john@company.com');
    await registerPage.fillPassword('password123');

    await Promise.all([
      registerPage.submit(),
      page.waitForRequest('**/api/auth/register'),
    ]);

    await expect(registerPage.errorBanner).toContainText('Network error');
    await expect(page).toHaveURL(/\/register$/);
  });

  test('shows error banner when email already exists (409)', async ({ page }) => {
    await mockRegisterEmailExists(page);
    const registerPage = new RegisterPage(page);

    await registerPage.selectRole('INVESTOR');
    await registerPage.fillFullName('Jane Doe');
    await registerPage.fillEmail('jane@company.com');
    await registerPage.fillPassword('password123');

    await Promise.all([
      registerPage.submit(),
      page.waitForResponse((res) => res.url().includes('/api/auth/register') && res.status() === 409),
    ]);

    await expect(registerPage.errorBanner).toContainText('already exists');
    await expect(page).toHaveURL(/\/register$/);
  });

  test('shows error banner for 400 bad request', async ({ page }) => {
    await mockRegisterBadRequest(page);
    const registerPage = new RegisterPage(page);

    await registerPage.selectRole('STARTUP');
    await registerPage.fillFullName('Invalid User');
    await registerPage.fillEmail('invalid@company.com');
    await registerPage.fillPassword('password123');

    await Promise.all([
      registerPage.submit(),
      page.waitForResponse((res) => res.url().includes('/api/auth/register') && res.status() === 400),
    ]);

    await expect(registerPage.errorBanner).toContainText('Invalid data');
  });

  test('shows success banner then redirects to /login on success', async ({ page }) => {
    await mockRegisterSuccess(page);
    const registerPage = new RegisterPage(page);

    await registerPage.selectRole('STARTUP');
    await registerPage.fillFullName('John Good');
    await registerPage.fillEmail('good@company.com');
    await registerPage.fillPassword('password123');

    await Promise.all([
      registerPage.submit(),
      page.waitForResponse((res) => res.url().includes('/api/auth/register') && res.status() === 201),
    ]);

    await expect(registerPage.successBanner).toContainText('Registration successful');

    await page.waitForURL(/\/login$/, { timeout: 8000 });
  });
});
