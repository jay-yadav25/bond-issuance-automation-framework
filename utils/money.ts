import Decimal from 'decimal.js';

export function dailyCoupon(faceValue: string, couponRate: string, quantity: number): string {
  return new Decimal(faceValue).times(couponRate).times(quantity).toFixed(2);
}

export function principal(faceValue: string, quantity: number): string {
  return new Decimal(faceValue).times(quantity).toFixed(2);
}

export function proportionalAllocation(quantity: number, totalSubscribed: number, totalSize: number): number {
  if (quantity < 0 || totalSubscribed <= 0 || totalSize < 0) throw new Error('invalid allocation inputs');
  return Math.floor((quantity / totalSubscribed) * totalSize);
}

export function allocateQuantity(quantity: number, totalSubscribed: number, totalSize: number): number {
  if (quantity < 0 || totalSubscribed <= 0 || totalSize < 0) throw new Error('invalid allocation inputs');
  return totalSubscribed <= totalSize ? quantity : proportionalAllocation(quantity, totalSubscribed, totalSize);
}

export function allocationStatus(allocatedQuantity: number): 'ALLOCATED' | 'REJECTED' {
  return allocatedQuantity > 0 ? 'ALLOCATED' : 'REJECTED';
}
