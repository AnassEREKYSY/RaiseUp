import { test, expect } from '@playwright/test';
import { ProfilePage } from '../pages/profile.page';
import { mockStartupProfile, mockInvestorProfile } from '../mocks/profile.mock';
import { setLocalUser } from '../utils/auth-state';
import { Role } from '../../src/app/core/enums/role.enum';

test.describe('Profile Page', () => {
  test('Startup profile displays projects and info correctly', async ({ page }) => {
    await setLocalUser(page, Role.STARTUP);
    await mockStartupProfile(page);
    const profile = new ProfilePage(page);
    await profile.goto();
    await expect(profile.name).toHaveText('NovaTech');
    await expect(profile.roleChip).toHaveText('STARTUP');
    await expect(page.locator('.projects-card h3')).toHaveText('Projects');
    await expect(page.locator('.project-card')).toHaveCount(2);
  });

  test('Investor profile displays matches and info correctly', async ({ page }) => {
    await setLocalUser(page, Role.INVESTOR);
    await mockInvestorProfile(page);
    const profile = new ProfilePage(page);
    await profile.goto();
    await expect(profile.name).toHaveText('Alpha Ventures');
    await expect(profile.roleChip).toHaveText('INVESTOR');
    await expect(page.locator('.projects-card h3')).toHaveText('Matched startups');
    await expect(page.locator('.project-card')).toHaveCount(1);
  });

  test('Edit mode toggles correctly', async ({ page }) => {
    await setLocalUser(page, Role.STARTUP);
    await mockStartupProfile(page);
    const profile = new ProfilePage(page);
    await profile.goto();
    await profile.toggleEdit();
    await expect(profile.companyInput).toBeVisible();
    await profile.cancelBtn.click();
    await expect(profile.companyInput).toHaveCount(0);
  });
});
