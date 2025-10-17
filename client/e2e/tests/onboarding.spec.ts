import { test, expect } from '@playwright/test';
import { OnboardingPage } from '../pages/onboarding.page';
import { loginAs } from '../utils/auth-state';
import { mockAuthMe } from '../mocks/auth.mock';
import { mockCreateStartupProfile, mockCreateInvestorProfile } from '../mocks/onboarding.mock';
import { Role } from '../../src/app/core/enums/role.enum';

test.describe('Onboarding Flow', () => {
  test('Startup completes onboarding and gets redirected to dashboard', async ({ page }) => {
    await loginAs(page, Role.STARTUP);
    await mockAuthMe(page, 'STARTUP');
    await mockCreateStartupProfile(page);

    const onboarding = new OnboardingPage(page);
    await onboarding.goto();

    await onboarding.waitForStep1();
    await onboarding.companyNameInput.fill('NovaTech');
    await onboarding.websiteInput.fill('https://novatech.io');
    await onboarding.countryInput.fill('Morocco');
    await onboarding.teamSizeInput.fill('8');
    await onboarding.nextBtn.click();

    await onboarding.waitForStep2();
    await onboarding.descriptionTextarea.fill('We build next-gen AI software for logistics.');
    await onboarding.selectIndustry('Technology');
    await onboarding.selectStage('Seed');
    await onboarding.fundingInput.fill('100000');
    await onboarding.nextBtn.click();

    await onboarding.waitForStep3();
    await onboarding.tractionInput.fill('200 beta users');
    await onboarding.pitchInput.fill('https://pitch.com/deck.pdf');
    await onboarding.finishBtn.click();

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('Investor completes onboarding and gets redirected to dashboard', async ({ page }) => {
    await loginAs(page, Role.INVESTOR);
    await mockAuthMe(page, 'INVESTOR');
    await mockCreateInvestorProfile(page);

    const onboarding = new OnboardingPage(page);
    await onboarding.goto();

    await onboarding.waitForStep1();
    await onboarding.invCompanyName.fill('Alpha Ventures');
    await onboarding.invLocation.fill('Paris, France');
    await onboarding.nextBtn.click();

    await onboarding.waitForStep2();
    await onboarding.invRange.fill('$10k - $1M');
    await onboarding.selectIndustries('Technology', 'Health');
    await page.mouse.click(10, 10);
    await onboarding.selectStagePreferences('Seed', 'MVP');
    await onboarding.nextBtn.click();

    await onboarding.waitForStep3();
    await onboarding.invBio.fill('We invest in scalable tech startups across Europe.');
    await onboarding.finishBtn.click();

    await expect(page).toHaveURL(/\/dashboard/);
  });
});
