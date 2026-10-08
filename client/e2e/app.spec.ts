import { expect, test } from '@playwright/test';
import { mockApi } from './mock-api';

test('signing in sends you back to the page you asked for', async ({ page }) => {
  await mockApi(page);
  await page.goto('/analytics');
  await expect(page).toHaveURL(/\/login\?next=%2Fanalytics/);
  await page.getByLabel('Email').fill('anna@fund.test');
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('alert')).toHaveText('Email or password is incorrect.');
  await page.getByLabel('Password').fill('right-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/analytics$/);
  await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
});

test('registration checks the form before calling the API', async ({ page }) => {
  const api = await mockApi(page);
  await page.goto('/register');
  await page.getByLabel('Full name').fill('Al Founder');
  await page.getByLabel('Email').fill('al@startup.test');
  await page.getByLabel('Password').fill('short');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('alert')).toContainText('8 characters');
  expect(api.calls.some(c => c.path === '/auth/register')).toBe(false);
});

test('home shows recommendations with a match score and answers a request', async ({ page }) => {
  await mockApi(page, { signedIn: true });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hello, Anna' })).toBeVisible();
  await expect(page.getByRole('img', { name: '92% match' })).toBeVisible();
  await page.getByRole('button', { name: 'Accept' }).click();
  await expect(page.getByText('You are now connected with Lena Varga')).toBeVisible();
});

test('discover filters by industry through the URL', async ({ page }) => {
  await mockApi(page, { signedIn: true });
  await page.goto('/discover');
  await expect(page.getByText('VisionQA', { exact: true })).toBeVisible();
  await page.getByLabel('Industry').selectOption('FINTECH');
  await expect(page).toHaveURL(/industry=FINTECH/);
  await expect(page.getByText('Ledgerly', { exact: true })).toBeVisible();
});

test('sending a message in the inbox', async ({ page }) => {
  const api = await mockApi(page, { signedIn: true });
  await page.goto('/inbox/c1');
  await expect(page.getByText('Hello Anna').last()).toBeVisible();
  await page.getByLabel('Message').fill('Can you share the deck?');
  await page.getByLabel('Message').press('Enter');
  await expect(page.getByText('Can you share the deck?')).toBeVisible();
  expect(api.calls.find(c => c.method === 'POST' && c.path === '/connections/c1/messages')?.body).toEqual({ content: 'Can you share the deck?' });
});

test('moving a deal in the pipeline', async ({ page }) => {
  const api = await mockApi(page, { signedIn: true });
  await page.goto('/pipeline');
  await page.getByText('VisionQA', { exact: true }).click();
  await page.getByLabel('Stage').selectOption('MEETING');
  await expect.poll(() => api.calls.find(c => c.method === 'PUT' && c.path === '/pipeline/s1')?.body?.stage).toBe('MEETING');
});
