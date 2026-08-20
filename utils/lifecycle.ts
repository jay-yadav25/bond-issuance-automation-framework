import { nextBusinessDay } from './businessDate';
import type { BondStatus } from './types';

type LifecycleDates = {
  bookOpenDate: string;
  bookCloseDate: string;
  maturityDate: string;
};

export function effectiveMaturityDate(maturityDate: string): string {
  const day = new Date(`${maturityDate}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6 ? nextBusinessDay(maturityDate) : maturityDate;
}

export function bondStatusAt(
  businessDate: string,
  dates: LifecycleDates,
  allocated = false,
  cancelled = false
): BondStatus {
  if (cancelled) return 'CANCELLED';
  if (businessDate < dates.bookOpenDate) return 'PENDING';
  if (businessDate <= dates.bookCloseDate) return 'OPEN';
  if (businessDate >= effectiveMaturityDate(dates.maturityDate)) return 'MATURED';
  return allocated ? 'ALLOCATED' : 'CLOSED';
}