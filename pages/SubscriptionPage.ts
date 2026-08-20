import { Page, Locator } from '@playwright/test';

export class SubscriptionPage {
  readonly page: Page;
  readonly investorSwitcher: Locator;
  readonly quantityInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly confirmation: Locator;

  constructor(page: Page) {
    this.page = page;
    this.investorSwitcher = page.locator('[data-testid="investor-switcher"]');
    this.quantityInput = page.locator('[data-testid="subscription-quantity"]');
    this.submitButton = page.locator('[data-testid="subscription-submit"]');
    this.errorMessage = page.locator('[role="alert"]');
    this.confirmation = page.locator('[data-testid="subscription-confirmation"]');
  }

  async open(): Promise<void> {
    await this.page.goto('/subscriptions');
  }

  async switchInvestor(userId: string): Promise<void> {
    await this.investorSwitcher.selectOption(userId);
  }

  async submit(quantity: number): Promise<void> {
    await this.quantityInput.fill(String(quantity));
    await this.submitButton.click();
  }
}
