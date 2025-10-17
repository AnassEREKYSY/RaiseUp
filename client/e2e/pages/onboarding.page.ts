import { Page } from '@playwright/test';

export class OnboardingPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/onboarding');
  }

  async waitForStep1() {
    await this.page.waitForSelector('.step.active span:has-text("1")');
  }
  async waitForStep2() {
    await this.page.waitForSelector('.step.active span:has-text("2")');
  }
  async waitForStep3() {
    await this.page.waitForSelector('.step.active span:has-text("3")');
  }

  get nextBtn() { return this.page.locator('button:has-text("Next")'); }
  get backBtn() { return this.page.locator('button:has-text("Back")'); }
  get finishBtn() { return this.page.locator('button:has-text("Finish & Publish")'); }

  get companyNameInput() { return this.page.locator('input[formcontrolname="companyName"]'); }
  get websiteInput() { return this.page.locator('input[formcontrolname="website"]'); }
  get countryInput() { return this.page.locator('input[formcontrolname="country"]'); }
  get teamSizeInput() { return this.page.locator('input[formcontrolname="teamSize"]'); }
  get descriptionTextarea() { return this.page.locator('textarea[formcontrolname="description"]'); }
  get fundingInput() { return this.page.locator('input[formcontrolname="fundingNeeded"]'); }
  get tractionInput() { return this.page.locator('input[formcontrolname="traction"]'); }
  get pitchInput() { return this.page.locator('input[formcontrolname="pitchDeckUrl"]'); }

  async selectIndustry(industry: string) {
    await this.page.locator('button.dd-trigger:has-text("Select industry")').click();
    await this.page.waitForSelector('.dd-menu:visible');
    await this.page.locator(`.dd-item:has-text("${industry}")`).click();
    await this.page.mouse.click(10, 10); // close dropdown
  }

  async selectStage(stage: string) {
    await this.page.locator('button.dd-trigger:has-text("Select stage")').click();
    await this.page.waitForSelector('.dd-menu:visible');
    await this.page.locator(`.dd-item:has-text("${stage}")`).click();
    await this.page.mouse.click(10, 10);
  }

  get invCompanyName() { return this.page.locator('input[formcontrolname="companyName"]'); }
  get invLocation() { return this.page.locator('input[formcontrolname="location"]'); }
  get invRange() { return this.page.locator('input[formcontrolname="investmentRange"]'); }
  get invBio() { return this.page.locator('textarea[formcontrolname="bio"]'); }

  async selectIndustries(...values: string[]) {
    await this.page.locator('button.dd-trigger:has-text("Select industries")').click();
    await this.page.waitForSelector('.dd-menu:visible');
    for (const val of values) {
      await this.page.locator(`.dd-item:has-text("${val}")`).click();
    }
    await this.page.mouse.click(10, 10);
  }

  async selectStagePreferences(...values: string[]) {
    await this.page.locator('button.dd-trigger:has-text("Select stages")').click();
    await this.page.waitForSelector('.dd-menu:visible');
    for (const val of values) {
      await this.page.locator(`.dd-item:has-text("${val}")`).click();
    }
    await this.page.mouse.click(10, 10);
  }
}
