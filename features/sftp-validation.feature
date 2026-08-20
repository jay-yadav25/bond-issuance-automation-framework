@regression @domain
Feature: SFTP bond file validation
  As an operations user
  I want malformed bond batches rejected at file level
  So that invalid instruments never enter the lifecycle

  Scenario: accept a valid bond CSV upload
    Given the SFTP validation fixture is loaded
    When the valid bond CSV is validated
    Then the CSV upload is accepted

  Scenario Outline: reject invalid upload input at file level
    Given the SFTP validation fixture is loaded
    When the invalid CSV case "<invalidCase>" is validated
    Then the CSV upload is rejected at file level

    Examples:
      | invalidCase              |
      | missing-header           |
      | duplicate-isin           |
      | invalid-currency         |
      | face-value-too-precise   |
      | coupon-rate-out-of-range |
      | total-size-too-large     |
      | book-open-after-close    |
      | maturity-before-book-close |
      | malformed-row            |
      | duplicate-file-name      |
      | invalid-file-name        |
      | invalid-isin             |
      | empty-issuer-name        |
      | long-bond-name           |
      | invalid-date             |
      | non-integer-total-size   |
      | invalid-iso-currency     |
