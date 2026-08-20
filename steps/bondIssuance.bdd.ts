import { createBddCustom } from './common/createBddCustom';
import { expect } from '../fixtures/test';
import { dailyCoupon, principal, proportionalAllocation, allocateQuantity, allocationStatus } from '../utils/money';
import { isBusinessDay, nextBusinessDay } from '../utils/businessDate';
import { validateBondCsv } from '../utils/csvBondValidator';
import { bondStatusAt } from '../utils/lifecycle';
import { isCouponDue } from '../utils/couponRules';
import { SubscriptionLedger, isSubscriptionWindowOpen, validateQuantity } from '../utils/subscriptionRules';
import { SubscriptionPage } from '../pages/SubscriptionPage';

 type BondLifecycleData = {
  bond: { isin?: string; totalSize: number; faceValue: string; couponRate: string; bookOpenDate: string; bookCloseDate: string; maturityDate: string };
  subscriptions: Array<{ userId: string; quantity: number }>;
};

type SftpData = { validFileName: string; validCsv: string };
type PaymentData = { faceValue: string; couponRate: string; allocatedQuantity: number; firstPaymentDate: string; maturityDate: string };
type SubscriptionData = { openDate: string; closeDate: string };
type UiSubscriptionData = { investorId: string; quantity: number; confirmation: string };

const { Given, When, Then } = createBddCustom();

Given('the bond lifecycle fixture is loaded', async ({ testData }) => {
  const data = testData as BondLifecycleData;
  expect(data.bond.isin || data.bond.totalSize > 0).toBeTruthy();
});

Given('the subscription fixture is loaded', async ({ testData }) => {
  expect((testData as SubscriptionData).openDate).toBeTruthy();
});

Given('the SFTP validation fixture is loaded', async ({ testData }) => {
  const data = testData as SftpData;
  expect(data.validCsv).toBeTruthy();
  expect(data.validFileName).toMatch(/^BONDS_\d{8}_\d{3}\.csv$/);
});

Given('the payments fixture is loaded', async ({ testData }) => {
  const data = testData as PaymentData;
  expect(data.faceValue).toBeTruthy();
  expect(data.couponRate).toBeTruthy();
});

Given('the investor navigates to the subscription page', async ({ page, state }) => {
  const subscriptionPage = new SubscriptionPage(page);
  await subscriptionPage.open();
  state.subscriptionPage = subscriptionPage;
});

When('the investor submits the UI fixture subscription', async ({ testData, state }) => {
  const data = testData as UiSubscriptionData;
  await (state.subscriptionPage as SubscriptionPage).switchInvestor(data.investorId);
  await (state.subscriptionPage as SubscriptionPage).submit(data.quantity);
});

Then('the UI shows the subscription confirmation', async ({ testData, state }) => {
  const data = testData as UiSubscriptionData;
  await expect((state.subscriptionPage as SubscriptionPage).confirmation).toHaveText(data.confirmation);
});

When('the valid bond CSV is validated', async ({ testData, state }) => {
  const data = testData as SftpData;
  state.csvErrors = validateBondCsv(data.validCsv, { fileName: data.validFileName });
});

When('the invalid CSV case {string} is validated', async ({ testData, state }, invalidCase: string) => {
  const data = testData as SftpData;
  let csv = data.validCsv;
  let fileName = data.validFileName;

  switch (invalidCase) {
    case 'missing-header': csv = csv.replace(/^isin,/, 'invalid,'); break;
    case 'duplicate-isin': csv += csv.split('\n')[1]; break;
    case 'invalid-currency': csv = csv.replace(',MYR,', ',INVALID,'); break;
    case 'face-value-too-precise': csv = csv.replace(',1000.00,', ',1000.001,'); break;
    case 'coupon-rate-out-of-range': csv = csv.replace(',0.0005,', ',1.0000,'); break;
    case 'total-size-too-large': csv = csv.replace(',1000000,', ',100000001,'); break;
    case 'book-open-after-close': csv = csv.replace(',2026-05-05,2026-05-10', ',2026-05-10,2026-05-05'); break;
    case 'maturity-before-book-close': csv = csv.replace(',2026-06-05,', ',2026-05-09,'); break;
    case 'malformed-row': csv = csv.replace(',2026-05-10\n', '\n'); break;
    case 'duplicate-file-name': state.processedFileNames = new Set([fileName]); break;
    case 'invalid-file-name': fileName = 'bond-upload.csv'; break;
    case 'invalid-isin': csv = csv.replace('MYBND2600001', 'BAD'); break;
    case 'empty-issuer-name': csv = csv.replace('ACME Corp,', ','); break;
    case 'long-bond-name': csv = csv.replace('ACME 2026 Senior Notes', 'x'.repeat(256)); break;
    case 'invalid-date': csv = csv.replace('2026-06-05', '2026-02-30'); break;
    case 'non-integer-total-size': csv = csv.replace(',1000000,', ',1000.5,'); break;
    case 'invalid-iso-currency': csv = csv.replace(',MYR,', ',ZZZ,'); break;
    default: throw new Error(`Unsupported CSV test case: ${invalidCase}`);
  }

  state.csvErrors = validateBondCsv(csv, {
    fileName,
    processedFileNames: state.processedFileNames as Set<string> | undefined
  });
});

Then('the CSV upload is accepted', async ({ state }) => {
  expect(state.csvErrors).toEqual([]);
});

Then('the CSV upload is rejected at file level', async ({ state }) => {
  expect((state.csvErrors as string[]).length).toBeGreaterThan(0);
});

When('the total requested quantity is {int}', async ({ state }, total: number) => {
  state.totalRequested = total;
});

When('a subscriber requests {int} from total subscribed {int} with bond size {int}', async ({ state }, quantity: number, totalSubscribed: number, totalSize: number) => {
  state.singleAllocation = allocateQuantity(quantity, totalSubscribed, totalSize);
});

Then('the subscriber allocation is {int}', async ({ state }, expected: number) => {
  expect(state.singleAllocation).toBe(expected);
});

When('the bond lifecycle is evaluated on {string} with allocated status {string}', async ({ testData, state }, date: string, allocated: string) => {
  state.lifecycleStatus = bondStatusAt(date, (testData as BondLifecycleData).bond, allocated === 'true');
});

When('the bond is cancelled before allocation', async ({ testData, state }) => {
  const data = testData as BondLifecycleData;
  state.lifecycleStatus = bondStatusAt(data.bond.bookOpenDate, data.bond, false, true);
});

Then('the bond status is {string}', async ({ state }, expected: string) => {
  expect(state.lifecycleStatus).toBe(expected);
});

When('the bond is allocated proportionally', async ({ testData, state }) => {
  const data = testData as BondLifecycleData;
  state.allocations = data.subscriptions.map((subscription) => proportionalAllocation(subscription.quantity, state.totalRequested as number, data.bond.totalSize));
});

Then('the allocations are {string}', async ({ state }, expected: string) => {
  expect(state.allocations).toEqual(expected.split(',').map(Number));
});

Then('the allocation total is less than or equal to bond size', async ({ testData, state }) => {
  const data = testData as BondLifecycleData;
  expect((state.allocations as number[]).reduce((sum, value) => sum + value, 0)).toBeLessThanOrEqual(data.bond.totalSize);
});

When('I calculate the coupon for quantity {int}', async ({ testData, state }, quantity: number) => {
  const data = testData as PaymentData;
  state.coupon = dailyCoupon(data.faceValue, data.couponRate, quantity);
});

Then('the coupon amount is {string}', async ({ state }, expected: string) => {
  expect(state.coupon).toBe(expected);
});

When('I calculate principal for quantity {int}', async ({ testData, state }, quantity: number) => {
  const data = testData as PaymentData;
  state.principal = principal(data.faceValue, quantity);
});

Then('the principal amount is {string}', async ({ state }, expected: string) => {
  expect(state.principal).toBe(expected);
});

Then('the date {string} is a business day', async ({}, date: string) => {
  expect(isBusinessDay(date)).toBe(true);
});

Then('the next business day after {string} is {string}', async ({}, date: string, expected: string) => {
  expect(nextBusinessDay(date)).toBe(expected);
});

Then('the system rejects an invalid quantity {string}', async ({}, quantity: string) => {
  expect(validateQuantity(Number(quantity)) || '').toMatch(/positive integer/);
});

Then('the subscription date {string} is {string} the book window', async ({ testData }, date: string, expected: string) => {
  const data = testData as SubscriptionData;
  expect(isSubscriptionWindowOpen(date, data.openDate, data.closeDate)).toBe(expected === 'inside');
});

When('the user ledger has capacity {int}', async ({ state }, capacity: number) => {
  state.ledger = new SubscriptionLedger(capacity);
});

When('the user {string} submits quantity {int}', async ({ state }, userId: string, quantity: number) => {
  state.lastSubscriptionAccepted = (state.ledger as SubscriptionLedger).subscribe(userId, quantity);
});

Then('the subscription is {string}', async ({ state }, expected: string) => {
  expect(state.lastSubscriptionAccepted).toBe(expected === 'accepted');
});

Then('the remaining capacity is {int}', async ({ state }, expected: number) => {
  expect((state.ledger as SubscriptionLedger).remaining()).toBe(expected);
});

Then('an allocation of {int} is marked {string}', async ({}, allocated: number, expected: string) => {
  expect(allocationStatus(allocated)).toBe(expected);
});

When('the coupon eligibility is evaluated for date {string}', async ({ testData, state }, date: string) => {
  const data = testData as PaymentData;
  state.couponDue = isCouponDue(date, data.firstPaymentDate, data.maturityDate, data.allocatedQuantity);
});

Then('the coupon is due {string}', async ({ state }, expected: string) => {
  expect(state.couponDue).toBe(expected === 'true');
});
