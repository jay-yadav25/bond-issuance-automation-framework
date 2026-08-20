export function validateQuantity(quantity: unknown): string | undefined {
  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) {
    return 'quantity must be a positive integer';
  }
  return undefined;
}

export function isSubscriptionWindowOpen(date: string, bookOpenDate: string, bookCloseDate: string): boolean {
  return date >= bookOpenDate && date <= bookCloseDate;
}

export class SubscriptionLedger {
  private readonly users = new Set<string>();
  private remainingCapacity: number;

  constructor(totalSize: number) {
    this.remainingCapacity = totalSize;
  }

  subscribe(userId: string, quantity: number): boolean {
    if (this.users.has(userId) || validateQuantity(quantity) || quantity > this.remainingCapacity) return false;
    this.users.add(userId);
    this.remainingCapacity -= quantity;
    return true;
  }

  remaining(): number {
    return this.remainingCapacity;
  }
}