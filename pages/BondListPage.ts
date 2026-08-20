import { Page, Locator } from '@playwright/test';

export class BondListPage {
  readonly page: Page;
  readonly bondRows: Locator;
  readonly statusFilter: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.bondRows = page.locator('[data-testid="bond-row"]');
    this.statusFilter = page.locator('[data-testid="bond-status-filter"]');
    this.searchInput = page.locator('[data-testid="bond-search"]');
  }

  async filterByStatus(status: string): Promise<void> {
    await this.statusFilter.selectOption(status);
  }

  async searchBond(isin: string): Promise<void> {
    await this.searchInput.fill(isin);
  }

  async bondCount(): Promise<number> {
    return this.bondRows.count();
  }
}
