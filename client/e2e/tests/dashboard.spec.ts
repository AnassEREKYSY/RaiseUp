import { test, expect } from '../fixtures/auth-fixture';
import { DashboardPage } from '../pages/dashboard.page';
import { loginAs, logout } from '../utils/auth-state';
import { mockAuthMe } from '../mocks/auth.mock';
import { mockInvestorsList, mockStartupsList } from '../mocks/dashboard.mock';
import { Role } from '../../src/app/core/enums/role.enum';

test.describe('Dashboard', () => {
  test('STARTUP role: sees Create Project + investor list', async ({ page }) => {
    await loginAs(page, Role.STARTUP);
    await mockAuthMe(page, 'STARTUP');
    await mockInvestorsList(page, []);
    await mockStartupsList(page, []);

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await page.waitForSelector('.dashboard-header .create-btn', { timeout: 10000 });
    await expect(dashboard.createBtn).toBeVisible();
  });

  test('INVESTOR role: sees startup list, no Create button', async ({ page }) => {
    await loginAs(page, Role.INVESTOR);
    await mockAuthMe(page, 'INVESTOR');
    await mockStartupsList(page, []);
    await mockInvestorsList(page, []);

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await page.waitForSelector('app-startup-list', { timeout: 10000 });
    await expect(dashboard.createBtn).toHaveCount(0);
    await expect(dashboard.startupListTag).toBeVisible();
  });

  test('No user: redirects to /login', async ({ page }) => {
    await logout(page);
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await expect(page).toHaveURL(/\/login$/);
  });
});
