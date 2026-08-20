# BIS Automation Requirements Coverage

## Scope

This harness is designed for the Bond Issuance System specification. It uses Playwright with TypeScript, Playwright-BDD scenario outlines, page objects, and environment-specific JSON fixtures. The current application is a dummy target, so UI selectors are deliberately stable `data-testid` placeholders and business-rule checks run without a live server.

## Coverage Matrix

| Requirement | Automation coverage | Location |
|---|---|---|
| SFTP batch creation and exact CSV header | Local CSV contract validation; live SFTP transport adapter still required | `features/sftp-validation.feature` |
| ISIN, issuer, bond, currency, money, rate, size, and date validation | Invalid-input outline examples with mutated CSV payloads | `utils/csvBondValidator.ts` |
| Duplicate file names and malformed rows | Explicit file-level validation cases | `utils/csvBondValidator.ts` |
| PENDING, OPEN, CLOSED, ALLOCATED, MATURED | Lifecycle date outline | `features/bond-lifecycle.feature` |
| CANCELLED before allocation | Planned negative scenario; add API cancellation endpoint when available | `requirements.md` |
| Open/close inclusive subscription window | Subscription fixture and boundary dates | `features/subscription-allocation.feature` |
| Positive integer quantity | Zero and negative outline cases | `features/subscription-allocation.feature` |
| Atomic capacity under concurrency | Planned API stress test using `Promise.all` and server-side invariant | `requirements.md` |
| One subscription per investor per bond and user header | Page object switcher plus planned API contract checks | `pages/SubscriptionPage.ts` |
| Full allocation when not oversubscribed | Extend allocation outline with total requested <= total size | `features/subscription-allocation.feature` |
| Floor proportional allocation and zero rejection | Worked example assertions | `features/bond-lifecycle.feature` |
| Daily coupon with exact decimal arithmetic | `dailyCoupon` assertion | `features/payments-maturity.feature` |
| Weekends excluded and coupon ends at maturity | Payment-date outline and business-date helper | `features/payments-maturity.feature` |
| Principal at maturity and weekend rollover | Principal and next-business-day assertions | `features/payments-maturity.feature` |
| v1 snake_case and v2 camelCase contracts | Add response-schema checks when API is running | `requirements.md` |
| Business date advance/reset lifecycle orchestration | System control page object; add API steps when endpoint is available | `pages/SystemControlPage.ts` |
| Asia/Kuala_Lumpur timezone | Configure CI timezone and add date-boundary contract test | `requirements.md` |

## Boundaries and Risks

- Browser tests do not navigate to a live application yet. We need to update in the relevant steps when the UI is available.
- API, SFTP, and database fixtures should be isolated per scenario. A real implementation should create unique ISINs and filenames to remain parallel-safe.
- Allocation capacity must be asserted at the server boundary, not only in the UI.
