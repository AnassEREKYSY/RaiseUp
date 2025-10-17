import { Page, Route } from '@playwright/test';

function respondJson(route: Route, status: number, body: any) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

export async function mockLoginDashboard(page: Page) {
  await page.route('**/api/auth/login', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    return respondJson(route, 200, {
      token: 'fake-jwt-token',
      refreshToken: 'fake-refresh',
      user: { id: '123', email: 'john@company.com', hasProfile: true }
    });
  });
}

export async function mockLoginOnboarding(page: Page) {
  await page.route('**/api/auth/login', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    return respondJson(route, 200, {
      token: 'fake-jwt-token',
      refreshToken: 'fake-refresh',
      user: { id: '456', email: 'jane@company.com', hasProfile: false }
    });
  });
}

export async function mockInvalidCredentials(page: Page) {
  await page.route('**/api/auth/login', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    return respondJson(route, 401, { error: 'Invalid email or password.' });
  });
}

export async function mockRegisterSuccess(page: Page) {
  await page.route('**/api/auth/register', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    return respondJson(route, 201, { message: 'Registered' });
  });
}

export async function mockRegisterEmailExists(page: Page) {
  await page.route('**/api/auth/register', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    return respondJson(route, 409, { error: 'An account with this email already exists.' });
  });
}

export async function mockRegisterBadRequest(page: Page) {
  await page.route('**/api/auth/register', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    return respondJson(route, 400, { error: 'Invalid data. Please verify your inputs.' });
  });
}

export async function mockRegisterNetworkError(page: Page) {
  await page.route('**/api/auth/register', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    return route.abort('failed');
  });
}

export async function mockAuthMe(page: Page, role: 'STARTUP' | 'INVESTOR') {
  await page.route('**/api/auth/me', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: 'u-' + role.toLowerCase(),
          email: `${role.toLowerCase()}@test.com`,
          role,
          hasProfile: true
        }
      })
    });
  });
}



