import { parse } from 'csv-parse/sync';

export const bondCsvHeader = [
  'isin', 'issuerName', 'bondName', 'currency', 'faceValue', 'couponRate',
  'maturityDate', 'totalSize', 'bookOpenDate', 'bookCloseDate'
];

export type CsvValidationContext = {
  fileName: string;
  processedFileNames?: Set<string>;
  existingIsins?: Set<string>;
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const isoCurrencies = new Set(['AUD', 'CAD', 'CHF', 'CNY', 'EUR', 'GBP', 'HKD', 'INR', 'JPY', 'MYR', 'NZD', 'SGD', 'USD', 'ZAR']);

function validDate(value: string): boolean {
  if (!datePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function decimalPlaces(value: string): number {
  return value.includes('.') ? value.split('.')[1].length : 0;
}

export function validateBondCsv(content: string, context: CsvValidationContext): string[] {
  const errors: string[] = [];

  if (context.processedFileNames?.has(context.fileName)) errors.push('duplicate-file-name');
  if (!/^BONDS_\d{8}_\d{3}\.csv$/.test(context.fileName)) errors.push('invalid-file-name');

  let records: string[][];
  try {
    records = parse(content, { skip_empty_lines: true, relax_column_count: true });
  } catch {
    return [...errors, 'malformed-row'];
  }

  if (!records.length || JSON.stringify(records[0]) !== JSON.stringify(bondCsvHeader)) {
    errors.push('invalid-header');
  }

  if (records.length < 2) return [...errors, 'malformed-row'];

  const seenIsins = new Set<string>(context.existingIsins);
  for (const row of records.slice(1)) {
    if (row.length !== bondCsvHeader.length) {
      errors.push('malformed-row');
      continue;
    }

    const [isin, issuerName, bondName, currency, faceValue, couponRate, maturityDate, totalSize, bookOpenDate, bookCloseDate] = row;
    if (!/^[A-Za-z0-9]{12}$/.test(isin)) errors.push('invalid-isin');
    if (seenIsins.has(isin)) errors.push('duplicate-isin');
    seenIsins.add(isin);
    if (!issuerName || issuerName.length > 255) errors.push('invalid-issuer-name');
    if (!bondName || bondName.length > 255) errors.push('invalid-bond-name');
    if (!isoCurrencies.has(currency)) errors.push('invalid-currency');
    if (!/^\d+(\.\d+)?$/.test(faceValue) || Number(faceValue) <= 0 || Number(faceValue) > 1_000_000 || decimalPlaces(faceValue) > 2) errors.push('invalid-face-value');
    if (!/^\d+(\.\d+)?$/.test(couponRate) || Number(couponRate) <= 0 || Number(couponRate) >= 1 || decimalPlaces(couponRate) > 4) errors.push('invalid-coupon-rate');
    if (!/^\d+$/.test(totalSize) || Number(totalSize) <= 0 || Number(totalSize) > 100_000_000) errors.push('invalid-total-size');
    if (!validDate(bookOpenDate) || !validDate(bookCloseDate) || bookOpenDate >= bookCloseDate) errors.push('invalid-book-dates');
    if (!validDate(maturityDate) || validDate(bookCloseDate) && maturityDate <= bookCloseDate) errors.push('invalid-maturity-date');
  }

  return [...new Set(errors)];
}