import { Page } from '@playwright/test';
import { Role } from '../../src/app/core/enums/role.enum';

export async function loginAs(page: Page, role: Role) {
  await page.addInitScript(([r]) => {
    const fakeUser = {
      id: 'u-' + r.toLowerCase(),
      email: `${r.toLowerCase()}@test.com`,
      role: r,
      hasProfile: true 
    };
    localStorage.setItem('token', 'fake-jwt-token');
    localStorage.setItem('user', JSON.stringify(fakeUser));
  }, [role]);
}

export async function logout(page: Page) {
  await page.addInitScript(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  });
}

export async function setLocalUser(page: Page, role: Role) {
  const user = {
    id: role === 'STARTUP' ? 'u1' : 'u2',
    email: role === 'STARTUP' ? 'startup1@mail.com' : 'investor1@mail.com',
    role,
    profileId: role === 'STARTUP' ? 'startup-1' : 'investor-1',
    token: 'fake-jwt'
  };
  await page.addInitScript(value => {
    localStorage.setItem('user', value);
    localStorage.setItem('token', 'fake-jwt');
  }, JSON.stringify(user));
}

