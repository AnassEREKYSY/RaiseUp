import { Page, Route } from '@playwright/test';

function respondJson(route: Route, status: number, body: any) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

export async function mockInvestorsList(page: Page, items: any[] = []) {
  await page.route('**/api/investors**', async (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    return respondJson(route, 200, { items });
  });
}

export async function mockStartupsList(page: Page, items: any[] = []) {
  await page.route('**/api/startups**', async (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    return respondJson(route, 200, { items });
  });
}
