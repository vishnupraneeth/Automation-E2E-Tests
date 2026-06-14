import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { test } from '../fixtures';

const { Given, When, Then } = createBdd(test);

// ─── Background ──────────────────────────────────────────────────────────────

Given('I am logged in to Automation Exercise', async ({ page }) => {
  await page.goto('https://automationexercise.com/login', { waitUntil: 'domcontentloaded' });
  await page.locator('(//input[@name="email"])[1]').fill(process.env.APP_USERNAME ?? 'vishnupraneeth96@gmail.com');
  await page.locator('//input[@name="password"][1]').fill(process.env.APP_PASSWORD ?? 'Automation@123');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('https://automationexercise.com/');
});

Given('the cart is cleared', async ({ page }) => {
  await page.goto('https://automationexercise.com/view_cart', { waitUntil: 'domcontentloaded' });
  // Delete all items one by one — verified live: delete button is 'a.cart_quantity_delete'
  const deleteButtons = page.locator('a.cart_quantity_delete');
  let count = await deleteButtons.count();
  while (count > 0) {
    await deleteButtons.first().click();
    await page.waitForTimeout(500);
    count = await deleteButtons.count();
  }
  console.log('🗑️  Cart cleared');
});

// ─── Given ───────────────────────────────────────────────────────────────────

Given('I check and record the initial cart item count', async ({ page, cartState }) => {
  await page.goto('https://automationexercise.com/view_cart', { waitUntil: 'domcontentloaded' });

  const cartTable = page.locator('#cart_info_table');
  const isVisible = await cartTable.isVisible();
  cartState.initialCount = isVisible
    ? await page.locator('#cart_info_table tbody tr').count()
    : 0;

  console.log(`📦 Initial cart item count: ${cartState.initialCount}`);
});

// ─── When ─────────────────────────────────────────────────────────────────────

When('I navigate to the Products page', async ({ page }) => {
  // Use 'domcontentloaded' — the page loads ad scripts that block the 'load' event
  await page.goto('https://automationexercise.com/products', { waitUntil: 'domcontentloaded' });

  // Verified live: 34 products found with this locator
  const totalProducts = await page.locator('.productinfo a.add-to-cart').count();
  console.log(`🛒 Total products available: ${totalProducts}`);
});

When('I add product at position {int} to the cart', async ({ page, cartState }, position: number) => {
  // Verified live: '.productinfo a.add-to-cart' — nth is 0-based, position is 1-based
  const index = position - 1;
  const productName = await page
    .locator('.productinfo p')
    .nth(index)
    .textContent();

  await page.locator('.productinfo a.add-to-cart').nth(index).click();
  // Verified live: modal id = '#cartModal'
  await page.locator('#cartModal').waitFor({ state: 'visible' });

  cartState.addedProductNames.push(productName?.trim() ?? `Product ${position}`);
  console.log(`➕ Added to cart: ${productName?.trim()}`);
});

When('I continue shopping', async ({ page }) => {
  // Verified live: class="btn btn-success close-modal btn-block"
  await page.locator('button.close-modal').click();
  await page.locator('#cartModal').waitFor({ state: 'hidden' });
});

// ─── Then ─────────────────────────────────────────────────────────────────────

Then('I go to the Cart page', async ({ page }) => {
  await page.goto('https://automationexercise.com/view_cart', { waitUntil: 'domcontentloaded' });
});

Then('the cart should contain 2 more items than the initial count', async ({ page, cartState }) => {
  // Verified live: cart rows are '#cart_info_table tbody tr'
  const finalCount = await page.locator('#cart_info_table tbody tr').count();
  console.log(`🔢 Final cart count: ${finalCount} (initial was: ${cartState.initialCount})`);

  expect(finalCount).toBe(cartState.initialCount + 2);
});

Then('the cart should display the added product names', async ({ page, cartState }) => {
  const cartRows = page.locator('#cart_info_table tbody tr');
  const rowCount = await cartRows.count();
  const cartProductNames: string[] = [];

  for (let i = 0; i < rowCount; i++) {
    // Verified live: '.cart_description h4 a' holds product name
    const name = await cartRows.nth(i).locator('.cart_description h4 a').textContent();
    cartProductNames.push(name?.trim() ?? '');
  }

  console.log(`🧾 Cart contains: ${cartProductNames.join(', ')}`);
  console.log(`✅ Expected to find: ${cartState.addedProductNames.join(', ')}`);

  for (const expected of cartState.addedProductNames) {
    expect(cartProductNames).toContain(expected);
  }
});
