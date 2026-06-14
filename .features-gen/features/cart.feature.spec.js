// Generated from: features/cart.feature
import { test } from "../../features/fixtures.ts";

test.describe('Shopping Cart Functionality', () => {

  test.beforeEach('Background', async ({ Given, And, page }, testInfo) => { if (testInfo.error) return;
    await Given('I am logged in to Automation Exercise', null, { page }); 
    await And('the cart is cleared', null, { page }); 
  });
  
  test('Add 2 products to cart and validate cart count', async ({ Given, When, Then, And, cartState, page }) => { 
    await Given('I check and record the initial cart item count', null, { cartState, page }); 
    await When('I navigate to the Products page', null, { page }); 
    await And('I add product at position 1 to the cart', null, { cartState, page }); 
    await And('I continue shopping', null, { page }); 
    await And('I add product at position 2 to the cart', null, { cartState, page }); 
    await And('I continue shopping', null, { page }); 
    await Then('I go to the Cart page', null, { page }); 
    await And('the cart should contain 2 more items than the initial count', null, { cartState, page }); 
    await And('the cart should display the added product names', null, { cartState, page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features/cart.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":11,"pickleLine":11,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given I am logged in to Automation Exercise","isBg":true,"stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And the cart is cleared","isBg":true,"stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":12,"keywordType":"Context","textWithKeyword":"Given I check and record the initial cart item count","stepMatchArguments":[]},{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Action","textWithKeyword":"When I navigate to the Products page","stepMatchArguments":[]},{"pwStepLine":14,"gherkinStepLine":14,"keywordType":"Action","textWithKeyword":"And I add product at position 1 to the cart","stepMatchArguments":[{"group":{"start":26,"value":"1"},"parameterTypeName":"int"}]},{"pwStepLine":15,"gherkinStepLine":15,"keywordType":"Action","textWithKeyword":"And I continue shopping","stepMatchArguments":[]},{"pwStepLine":16,"gherkinStepLine":16,"keywordType":"Action","textWithKeyword":"And I add product at position 2 to the cart","stepMatchArguments":[{"group":{"start":26,"value":"2"},"parameterTypeName":"int"}]},{"pwStepLine":17,"gherkinStepLine":17,"keywordType":"Action","textWithKeyword":"And I continue shopping","stepMatchArguments":[]},{"pwStepLine":18,"gherkinStepLine":18,"keywordType":"Outcome","textWithKeyword":"Then I go to the Cart page","stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"And the cart should contain 2 more items than the initial count","stepMatchArguments":[]},{"pwStepLine":20,"gherkinStepLine":20,"keywordType":"Outcome","textWithKeyword":"And the cart should display the added product names","stepMatchArguments":[]}]},
]; // bdd-data-end