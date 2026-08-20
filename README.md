Bond Issuance System — Product Specification


1. Overview

The Bond Issuance System (BIS) manages corporate bond issuances from creation through
subscription, allocation, coupon payments, and maturity.


**Key flows:**

- Bonds are created via SFTP file upload (batch process).

- Investors browse and subscribe to bonds via the web application.

- After book close, bonds are allocated to subscribers proportionally.

- Coupon payments are generated daily (on business days) for allocated subscribers.

- At maturity, principal is returned to subscribers.


**Authentication:** User authentication is not in scope for this system. The application provides
predefined mock users (INV-001 through INV-005) with a user switcher in the UI. API calls identify the
acting user via the `X-User-Id` header.


---

## Automation Framework

This repository contains a Playwright + TypeScript + Playwright-BDD starter for the BIS requirements above. It uses Page Object Model classes for UI interactions, JSON fixtures, and pure TypeScript utilities for deterministic business-rule assertions.

For the complete requirement-by-requirement mapping, see [REQUIREMENTS_TRACEABILITY.md](REQUIREMENTS_TRACEABILITY.md).

### Structure

```text
features/                         Gherkin feature files and scenario outlines
fixtures/{staging,production}/    Environment and feature-specific testData.json
steps/                            Playwright-BDD step definitions
pages/                            Page objects; locators are declared first
fixtures/test.ts                  Custom Playwright testData and state fixtures
utils/                            Environment, fixture, date, money, and domain helpers
requirements.md                   Requirement-to-automation coverage and gaps
sample.env                        Environment variable template
```

### Setup

```bash
npm install
npx playwright install chromium firefox webkit
copy sample.env .env
npm run typecheck
```

The suite is runnable without a live BIS because the current page objects contain dummy `data-testid` locators and the business-rule scenarios use fixture data. Once the application is available, add navigation and API/SFTP clients at the step boundary; the feature language can remain stable.

The current 44 passing tests are domain-rule tests, not UI or live API tests. They run in the Playwright runner but do not call `page`, navigate to `BASE_URL`, or use the POM locators. The page objects are prepared integration boundaries and will only become UI coverage after a BIS UI exists.

### Execution

```bash
npm test                                  # regression scenarios by default
npm run test:smoke                        # @smoke
npm run test:api                          # @api
npm run test:ui                           # @ui
cross-env ENVIRONMENT=production npm test
cross-env TAGS="@smoke and not @wip" npm test
cross-env ENV_FILE=.env.staging npm test
npm run bddgen                            # generate Playwright tests only
npm run test:bdd                           # generate and run Playwright-BDD tests
npm run allure:report                      # build reports/allure-report
```

`ENVIRONMENT` selects `fixtures/staging` or `fixtures/production`. `TAGS` controls Playwright-BDD filtering. `API_VERSION`, `BASE_URL`, `BUSINESS_DATE`, SFTP settings, and browser options are read from the selected env file.

### Browser Matrix and Reports

Playwright projects are selected with `BROWSERS` (or `BROWSER`):

```powershell
$env:BROWSERS='CHROME'; npm run test:bdd
$env:BROWSERS='FIREFOX,CHROME'; npm run test:bdd
$env:BROWSERS='SAFARI,IPHONE'; npm run test:bdd
```

Supported values are `CHROME`, `FIREFOX`, `SAFARI`, and `IPHONE`. Empty or unsupported input falls back to Chrome. Traces and videos are retained only for failed tests; screenshots are also captured only on failure. Playwright HTML output is written to `reports/playwright`, and Allure results are written to `reports/allure`.

### Playwright-BDD Fixture

For Playwright-BDD tests, import `test` from [fixtures/test.ts](fixtures/test.ts). The `testData` fixture derives the feature directory from the test filename and loads only `testData.json` from the selected environment:

```ts
import { test, expect } from '../fixtures/test';

test('uses environment data', async ({ testData }) => {
	expect(testData).toBeDefined();
});
```

There is no `loginData` fixture because authentication is out of scope for BIS. `npm test` is the unified Playwright-BDD runner, and every step receives `testData` from the feature-mapped fixture.

### Current scenario coverage

- Lifecycle state dates, oversubscription, floor allocation, and unallocated remainder.
- SFTP validation examples for headers, duplicates, ISO currency, money/rate precision, limits, date order, malformed rows, and duplicate filenames.
- Valid CSV acceptance and file-level rejection are checked through `utils/csvBondValidator.ts`; the SFTP page object remains the UI transport boundary for a live server.
- Subscription quantity boundaries and the predefined investor fixture.
- Exact daily coupon and principal calculations using `decimal.js` strings.
- Weekend coupon exclusion and weekend maturity rollover.
- Dummy POM surfaces for bonds, subscription, portfolio, SFTP, and system control.

### Recommended next layer when the product API exists

Keep the BDD features as business contracts and add typed API clients under `clients/`: `BondApiClientV1`, `BondApiClientV2`, `SystemApiClient`, and `SftpClient`. Use schema assertions to prove v1 snake_case/flat responses and v2 camelCase/nested/string-amount responses. Add a database or event-polling helper only for test observability, not as the primary user-facing assertion.

For the atomic-capacity requirement, run a controlled `Promise.all` of competing subscription requests against one bond and assert that successful quantities never exceed `totalSize`, exactly one subscription per investor is accepted, and rejected requests expose a stable error contract. Run these tests in a dedicated isolated environment because they mutate shared state.

For CI, use separate smoke, API contract, UI regression, and concurrency jobs. Pin the business date through the system-control API, reset state in a BDD hook, upload unique CSV names per worker, and publish the Playwright HTML/Allure reports and traces only on failure.



2. Business Concepts

| Concept | Description |

|---------|-------------|

| **Bond** | A debt instrument created via SFTP file upload with defined terms (ISIN, issuer, coupon
rate, face value, total size, maturity date, book dates). |

| **Book** | The subscription window for a bond. Has open/close dates tied to business dates. |

| **Subscription** | An investor's order to purchase a specified quantity of a bond. Made via API or UI. |

| **Allocation** | After book close, bonds are allocated to subscribers. Proportional if oversubscribed,
full if not. |

| **Coupon Payment** | Daily interest payment to allocated subscribers (on business days only). |

| **Maturity** | Return of principal to subscribers at bond maturity date. |


---

| **Business Date** | The operational date used for all lifecycle events. Weekends (Sat/Sun) are not
business days. |


---



3. Bond Lifecycle States

```

File Upload → PENDING → OPEN → CLOSED → ALLOCATED → MATURED

↓

Coupon payments

daily (business days)

```


| State | Meaning |

|-------|---------|

| `PENDING` | Bond created from file upload but book not yet open. |

| `OPEN` | Business date is within book window. Investors can subscribe. |

| `CLOSED` | Book is closed. No new subscriptions accepted. |

| `ALLOCATED` | Subscriptions allocated. Coupon schedule active. |

| `MATURED` | Bond reached maturity date. Principal returned. |

| `CANCELLED` | Bond cancelled before allocation. |


---



4. Subscription States

| State | Meaning |

|-------|---------|

| `PENDING` | Subscription received, awaiting book close. |

| `ALLOCATED` | Investor received allocation (full or partial). |


---

| `REJECTED` | Subscription rejected (oversubscription rules or cancellation). |


---



5. Bond Creation via SFTP

Bonds are created by uploading CSV files to the SFTP server.


**Upload path:** `/upload/bonds/BONDS_YYYYMMDD_NNN.csv`


**SFTP connection:**

- Host: `localhost`

- Port: `2222`

- Username: `bonduser`

- Password: `bondpass`


**File format:**


```csv

isin,issuerName,bondName,currency,faceValue,couponRate,maturityDate,totalSize,bookOpenDate,bo
okCloseDate

MYBND2600001,ACME Corp,ACME 2026 Senior
Notes,MYR,1000.00,0.0005,2026-06-05,1000000,2026-05-05,2026-05-10

MYBND2600002,Beta Inc,BETA 2026
Notes,MYR,500.00,0.0004,2026-06-08,500000,2026-05-06,2026-05-12

```


**Validation rules:**

- File must include the exact header row.

- `isin` must be non-empty, unique across all bonds. Format: alphanumeric, 12 characters.

- `issuerName` must be non-empty, max 255 characters.

- `bondName` must be non-empty, max 255 characters.

- `currency` must be a valid 3-letter ISO currency code (e.g., `MYR`, `USD`).


---

- `faceValue` must be positive, at most 2 decimal places. Maximum: 1,000,000.00.

- `couponRate` is a daily rate, must be between 0 and 1 (exclusive), at most 4 decimal places.

- `totalSize` must be a positive integer. Maximum: 100,000,000.

- `bookOpenDate` must be a valid date and must be before `bookCloseDate`.

- `bookCloseDate` must be a valid date.

- `maturityDate` must be a valid date and must be after `bookCloseDate`.

- All dates must be in `YYYY-MM-DD` format.

- Duplicate file names are rejected (not reprocessed).

- Malformed rows produce file-level exceptions (not silently skipped).


---



6. Subscription Rules

- Subscriptions are only accepted when the business date is between `bookOpenDate` and
`bookCloseDate` (inclusive).

- `quantity` must be a positive integer.

- Available size must be tracked atomically — concurrent subscriptions exceeding remaining capacity
must not all succeed.

- Each investor may only subscribe once per bond.

- Subscription requires `X-User-Id` header identifying the investor.


---



7. Allocation Rules

After book close:

- If total subscribed ≤ `totalSize`: all subscribers get their full requested quantity.

- If total subscribed > `totalSize` (oversubscribed): proportional allocation.

- Each subscriber gets: `floor(their_quantity / total_subscribed × totalSize)`

- Subscribers with allocation = 0 are marked `REJECTED`.


---

---



8. Coupon Payment

- Daily coupon, paid on every business day (Monday–Friday) while the bond is in ALLOCATED status.

- Amount per subscriber per day: `faceValue × couponRate × allocatedQuantity`

- The `couponRate` in this system is a **daily rate** (not annualized).

- Example: faceValue=1000, couponRate=0.0005, allocatedQuantity=100 → daily coupon = **50.00**

- No coupon is paid on weekends (Saturday, Sunday).

- Coupon stops after maturity date is reached.

- All amounts use exact decimal (no floating-point).


---



9. Maturity

- At maturity date, principal is returned to each allocated subscriber.

- Amount: `faceValue × allocatedQuantity`

- Maturity date must be a business day. If it falls on weekend, payment is on next business day.


---



9A. Worked Example — Daily Coupon Payments and Maturity

The following end-to-end example illustrates a bond from issuance through daily coupon payments to
maturity.



Setup

Bond uploaded via SFTP:


| Field | Value |


---

|-------|-------|

| isin | MYBND2600099 |

| issuerName | MegaCorp |

| bondName | MEGA 2026 Notes |

| currency | MYR |

| faceValue | 1,000.00 |

| couponRate | 0.0005 (daily) |

| totalSize | 100,000 |

| bookOpenDate | 2026-06-01 |

| bookCloseDate | 2026-06-10 |

| maturityDate | 2026-06-25 |



Subscriptions (during book window 2026-06-01 to 2026-06-10)

| Investor | Quantity |

|----------|----------|

| INV-001 (Alpha Capital) | 40,000 |

| INV-002 (Beta Fund) | 30,000 |

| INV-003 (Gamma Holdings) | 50,000 |


Total subscribed: 120,000. Bond totalSize: 100,000. **Oversubscribed.**



Allocation (after book close)

Proportional allocation: each subscriber receives `floor(their_quantity / 120,000 × 100,000)`.


| Investor | Subscribed | Allocated | Status |

|----------|-----------|-----------|--------|

| INV-001 | 40,000 | 33,333 | ALLOCATED |


---

| INV-002 | 30,000 | 25,000 | ALLOCATED |

| INV-003 | 50,000 | 41,666 | ALLOCATED |


Note: total allocated = 99,999 (rounding down means fractional remainder is unallocated).



Daily Coupon Payments

Daily coupon formula: `faceValue × couponRate × allocatedQuantity`


Once bond is ALLOCATED, coupon is paid each business day until maturity.


**Example — 2026-06-11 (Wednesday, first business day after allocation):**


| Investor | Calculation | Daily Payment |

|----------|-------------|---------------|

| INV-001 | 1,000 × 0.0005 × 33,333 | **16,666.50** |

| INV-002 | 1,000 × 0.0005 × 25,000 | **12,500.00** |

| INV-003 | 1,000 × 0.0005 × 41,666 | **20,833.00** |


**Weekend skip:** 2026-06-13 (Saturday) and 2026-06-14 (Sunday) — no coupon paid.


**2026-06-15 (Monday):** Same daily amounts as above.


Coupon continues daily until maturity date (2026-06-25).


Total business days from 2026-06-11 to 2026-06-25: 11 days (excluding weekends).


**Total coupon for INV-001:** 16,666.50 × 11 = **183,331.50**



Maturity (due 2026-06-25 — Wednesday, business day)

Maturity formula: `faceValue × allocatedQuantity`


| Investor | Calculation | Principal Returned |

|----------|-------------|-------------------|

| INV-001 | 1,000 × 33,333 | **33,333,000.00** |


---

| INV-002 | 1,000 × 25,000 | **25,000,000.00** |

| INV-003 | 1,000 × 41,666 | **41,666,000.00** |


After maturity payment, bond status transitions to `MATURED`.


---



10. Predefined Users

| User ID | Name |

|---------|------|

| `INV-001` | Alpha Capital |

| `INV-002` | Beta Fund |

| `INV-003` | Gamma Holdings |

| `INV-004` | Delta Partners |

| `INV-005` | Epsilon Trust |


The application has a user switcher in the header. API calls use `X-User-Id` header.


---



11. API Overview

The system exposes two API versions simultaneously:


- **API v1** (`/api/v1/...`) — Uses **snake_case** field names and flat response structure.

- **API v2** (`/api/v2/...`) — Uses **camelCase**, nested structures, string amounts, and ISO
timestamps.


Both versions provide endpoints for: listing bonds, viewing bond details, subscribing, viewing portfolio
(subscriptions, coupons, maturities).


Full API documentation is available via **Swagger UI** at:


```


---

http://localhost:8080/swagger-ui.html

```


Key headers:

- `X-User-Id` — Identifies the acting investor (e.g., `INV-001`). Required for subscription and portfolio
endpoints.


---



12. Business Date & System Control

- Business date is the operational date driving all lifecycle logic.

- Weekends (Saturday, Sunday) are not business days.

- The system timezone is Asia/Kuala_Lumpur.

- On first startup, business date is initialized to the current calendar date and persisted in the database.

- The system does **not** automatically advance the date. Time progresses only through explicit API
calls.



System Control API


`GET /api/system/date`

Returns current business date.


```json

{ "business_date": "2026-05-06" }

```



`POST /api/system/advance-date`

Advances business date by **one day** and triggers all lifecycle events for the new date:


---

1. Bond status transitions (PENDING → OPEN if book open date reached; OPEN → CLOSED if book
close date passed)

2. Allocation of newly closed bonds

3. Coupon processing for bonds with payment due

4. Maturity processing for bonds reaching maturity


Response:

```json

{

"business_date": "2026-05-07",

"message": "Date advanced. Lifecycle events processed."

}

```



`POST /api/system/reset`

Resets business date to today's calendar date. Used for test environment cleanup.


```json

{

"business_date": "2026-05-06",

"message": "System reset to today's date"

}

```


---



13. Money Precision

- All monetary values use exact decimal representation.

- `faceValue` has at most 2 decimal places.


---

- `couponRate` is a daily rate with at most 4 decimal places.

- Coupon and maturity amounts are calculated with exact decimal arithmetic.

- No floating-point arithmetic for financial calculations.


---
