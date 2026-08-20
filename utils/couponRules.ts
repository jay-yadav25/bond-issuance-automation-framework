import { effectiveMaturityDate } from './lifecycle';
import { isBusinessDay } from './businessDate';

export function isCouponDue(
  date: string,
  allocationDate: string,
  maturityDate: string,
  allocatedQuantity: number
): boolean {
  return allocatedQuantity > 0 &&
    isBusinessDay(date) &&
    date >= allocationDate &&
    date <= effectiveMaturityDate(maturityDate);
}