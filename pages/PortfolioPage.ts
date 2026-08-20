import { Page, Locator } from '@playwright/test';

export class PortfolioPage {
  readonly page: Page;
  readonly subscriptionRows: Locator;
  readonly couponRows: Locator;
  readonly maturityRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.subscriptionRows = page.locator('[data-testid="portfolio-subscription-row"]');
    this.couponRows = page.locator('[data-testid="coupon-payment-row"]');
    this.maturityRows = page.locator('[data-testid="maturity-payment-row"]');
  }

  async couponPaymentCount(): Promise<number> {
    return this.couponRows.count();
  }

  async maturityPaymentCount(): Promise<number> {
    return this.maturityRows.count();
  }
}
