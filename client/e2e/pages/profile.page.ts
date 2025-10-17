import { Page } from '@playwright/test';

export class ProfilePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/profile');
  }

  get backBtn() { return this.page.locator('.back-btn'); }
  get editFab() { return this.page.locator('.edit-fab'); }
  get saveBtn() { return this.page.locator('button:has-text("Save Changes")'); }
  get cancelBtn() { return this.page.locator('button:has-text("Cancel")'); }

  get name() { return this.page.locator('.identity .name'); }
  get roleChip() { return this.page.locator('.role-chip'); }

  get companyInput() { return this.page.locator('input[formcontrolname="companyName"]'); }
  get websiteInput() { return this.page.locator('input[formcontrolname="website"]'); }

  async toggleEdit() { await this.editFab.click(); }
  async saveProfile() { await this.saveBtn.click(); }
}
