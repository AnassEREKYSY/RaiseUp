import { Page } from '@playwright/test';

export async function mockCreateStartupProfile(page: Page) {
  await page.route('**/api/startups/create', async (route) => {
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Startup profile created' }),
    });
  });
}

export async function mockCreateInvestorProfile(page: Page) {
  await page.route('**/api/investors/create', async (route) => {
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Investor profile created' }),
    });
  });
}
