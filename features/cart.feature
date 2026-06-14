Feature: Shopping Cart Functionality

  As a logged-in user on Automation Exercise
  I want to add products to my cart
  So that I can purchase them

  Background:
    Given I am logged in to Automation Exercise
    And the cart is cleared

  Scenario: Add 2 products to cart and validate cart count
    Given I check and record the initial cart item count
    When I navigate to the Products page
    And I add product at position 1 to the cart
    And I continue shopping
    And I add product at position 2 to the cart
    And I continue shopping
    Then I go to the Cart page
    And the cart should contain 2 more items than the initial count
    And the cart should display the added product names
