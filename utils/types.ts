export type BondStatus = 'PENDING' | 'OPEN' | 'CLOSED' | 'ALLOCATED' | 'MATURED' | 'CANCELLED';
export type SubscriptionStatus = 'PENDING' | 'ALLOCATED' | 'REJECTED';

export interface BondFixture {
  isin: string;
  issuerName: string;
  bondName: string;
  currency: string;
  faceValue: string;
  couponRate: string;
  maturityDate: string;
  totalSize: number;
  bookOpenDate: string;
  bookCloseDate: string;
}
