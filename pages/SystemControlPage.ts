import { Page, Locator } from '@playwright/test';

export class SystemControlPage {
  readonly page: Page;
  readonly advanceDateButton: Locator;
  readonly resetButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.advanceDateButton = page.locator('[data-testid="advance-date"]');
    this.resetButton = page.locator('[data-testid="reset-date"]');
  }

  async advanceDate(): Promise<void> {
    await this.advanceDateButton.click();
  }

  async resetDate(): Promise<void> {
    await this.resetButton.click();
  }
}
