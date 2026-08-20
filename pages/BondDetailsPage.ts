import { Page, Locator } from '@playwright/test';

export class BondDetailsPage {
  readonly page: Page;
  readonly bondStatus: Locator;
  readonly subscribeButton: Locator;
  readonly quantityInput: Locator;
  readonly subscriptionMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.bondStatus = page.locator('[data-testid="bond-status"]');
    this.subscribeButton = page.locator('[data-testid="subscribe-button"]');
    this.quantityInput = page.locator('[data-testid="subscription-quantity"]');
    this.subscriptionMessage = page.locator('[data-testid="subscription-message"]');
  }

  async subscribe(quantity: number): Promise<void> {
    await this.quantityInput.fill(String(quantity));
    await this.subscribeButton.click();
  }

  async status(): Promise<string> {
    return this.bondStatus.innerText();
  }
}
