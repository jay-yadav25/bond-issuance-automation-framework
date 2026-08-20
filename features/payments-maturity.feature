@regression @domain
Feature: Coupon and maturity payments
  As an allocated investor
  I want precise business-day payments
  So that I receive the right income and principal

  Scenario Outline: calculate exact coupon and principal amounts
    Given the payments fixture is loaded
    When the coupon eligibility is evaluated for date "<paymentDate>"
    Then the coupon is due "<shouldPay>"
    When I calculate the coupon for quantity 100
    Then the coupon amount is "50.00"
    When I calculate principal for quantity 100
    Then the principal amount is "100000.00"

    Examples:
      | paymentDate | shouldPay |
      | 2026-06-11  | true      |
      | 2026-06-13  | false     |
      | 2026-06-15  | true      |
      | 2026-06-25  | true      |
      | 2026-06-26  | false     |

  Scenario: move weekend maturity to next business day
    Then the date "2026-06-25" is a business day
    And the next business day after "2026-06-27" is "2026-06-29"
