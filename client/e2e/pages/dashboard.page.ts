import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly createBtn: Locator;
  readonly startupListTag: Locator;
  readonly investorListTag: Locator;
  readonly emptyState: Locator;
  readonly projectModalTag: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createBtn = page.locator('.create-btn');
    this.startupListTag = page.locator('app-startup-list');
    this.investorListTag = page.locator('app-investor-list');
    this.emptyState = page.locator('.empty-state');
    this.projectModalTag = page.locator('app-project-modal');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async openCreateProject() {
    await this.createBtn.click();
  }
}
