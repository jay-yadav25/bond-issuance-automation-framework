@regression @smoke @domain
Feature: Bond lifecycle visibility
  As an investor
  I want bond states to follow the business date
  So that I can only act during the valid lifecycle window

  Scenario Outline: bond transitions at lifecycle dates
    Given the bond lifecycle fixture is loaded
    When the bond lifecycle is evaluated on "<businessDate>" with allocated status "<allocated>"
    Then the bond status is "<expectedState>"

    Examples:
      | businessDate | expectedState | allocated |
      | 2026-05-31   | PENDING       | false     |
      | 2026-06-01   | OPEN          | false     |
      | 2026-06-10   | OPEN          | false     |
      | 2026-06-11   | CLOSED        | false     |
      | 2026-06-12   | ALLOCATED     | true      |
      | 2026-06-25   | MATURED       | true      |

  Scenario: cancellation before allocation
    Given the bond lifecycle fixture is loaded
    When the bond is cancelled before allocation
    Then the bond status is "CANCELLED"

  Scenario Outline: fully allocate a non-oversubscribed book
    When a subscriber requests <quantity> from total subscribed <totalSubscribed> with bond size <totalSize>
    Then the subscriber allocation is <expectedAllocation>

    Examples:
      | quantity | totalSubscribed | totalSize | expectedAllocation |
      | 100      | 100             | 1000      | 100                |
      | 1000     | 1000            | 1000      | 1000               |
