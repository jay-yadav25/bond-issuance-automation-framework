@regression @smoke @domain
Feature: Subscription and allocation boundaries
  As an investor
  I want subscription rules enforced consistently
  So that capacity and ownership remain correct

  Scenario Outline: reject invalid subscription quantity
    Given the subscription fixture is loaded
    Then the system rejects an invalid quantity "<quantity>"

    Examples:
      | quantity |
      | 0        |
      | -1       |
      | 1.5      |

  Scenario Outline: enforce the inclusive subscription window
    Given the subscription fixture is loaded
    Then the subscription date "<date>" is "<position>" the book window

    Examples:
      | date       | position |
      | 2026-05-04 | outside  |
      | 2026-05-05 | inside   |
      | 2026-05-10 | inside   |
      | 2026-05-11 | outside  |

  Scenario: enforce one investor and atomic capacity reservation
    Given the subscription fixture is loaded
    When the user ledger has capacity 100
    And the user "INV-001" submits quantity 75
    Then the subscription is "accepted"
    And the remaining capacity is 25
    When the user "INV-001" submits quantity 10
    Then the subscription is "rejected"
    When the user "INV-002" submits quantity 30
    Then the subscription is "rejected"
    And the remaining capacity is 25

  Scenario Outline: mark zero proportional allocations as rejected
    Then an allocation of <allocated> is marked "<status>"

    Examples:
      | allocated | status   |
      | 0         | REJECTED |
      | 1         | ALLOCATED |

  Scenario: allocate oversubscribed book proportionally
    Given the bond lifecycle fixture is loaded
    When the total requested quantity is 120000
    And the bond is allocated proportionally
    Then the allocations are "33333,25000,41666"
    And the allocation total is less than or equal to bond size
