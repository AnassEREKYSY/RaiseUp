import { Page, Locator } from '@playwright/test';

export class RegisterPage {
  readonly page: Page;
  readonly roleSelect: Locator;
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly eyeButton: Locator;
  readonly submitButton: Locator;
  readonly errorBanner: Locator;
  readonly successBanner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.roleSelect = page.locator('#role');
    this.fullNameInput = page.locator('#fullName');
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.eyeButton = page.locator('.eye-btn');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorBanner = page.locator('.error-banner');
    this.successBanner = page.locator('.success-banner');
  }

  async goto() {
    await this.page.goto('/register');
  }

  async selectRole(role: 'STARTUP' | 'INVESTOR') {
    await this.roleSelect.selectOption(role);
  }

  async fillFullName(name: string) {
    await this.fullNameInput.fill(name);
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillPassword(pwd: string) {
    await this.passwordInput.fill(pwd);
  }

  async togglePasswordVisibility() {
    await this.eyeButton.click();
  }

  async submit() {
    await this.submitButton.click();
  }
}
