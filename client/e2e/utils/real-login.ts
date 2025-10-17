import { Page } from '@playwright/test';

export async function realLogin(page: Page, email: string, password: string) {
  const response = await page.request.post('http://localhost:4000/api/auth/login', {
    data: { email, password },
  });
  if (!response.ok()) {
    throw new Error(`Login failed for ${email}: ${response.status()} ${response.statusText()}`);
  }

  const body = await response.json();
  const { token, user } = body;

  await page.addInitScript(([t, u]) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
  }, [token, user]);

  return { token, user };
}
