import { Locator, Page } from "@playwright/test";
import { Basepage } from "./BasePage";

export class CartPage extends Basepage {

  private readonly cartTable: Locator;
  private readonly cartRows: Locator;

  constructor(page: Page) {
    super(page);
    this.cartTable = page.locator('#cart_info_table');
    this.cartRows  = page.locator('#cart_info_table tbody tr');
  }

  async navigateToCart(): Promise<void> {
    await this.page.goto('/view_cart');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async getCartItemCount(): Promise<number> {
    const isVisible = await this.cartTable.isVisible();
    if (!isVisible) return 0;
    return this.cartRows.count();
  }

  async getCartProductNames(): Promise<string[]> {
    const count = await this.cartRows.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const name = await this.cartRows
        .nth(i)
        .locator('.cart_description h4 a')
        .textContent();
      names.push(name?.trim() ?? '');
    }
    return names;
  }
}
