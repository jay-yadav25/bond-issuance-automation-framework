@regression @ui @wip
Feature: BIS subscription UI
  As an investor
  I want to submit a bond subscription through the web UI
  So that I receive a confirmation

  Scenario: submit a subscription from the UI
    Given the investor navigates to the subscription page
    When the investor submits the UI fixture subscription
    Then the UI shows the subscription confirmation