import { test as base } from 'playwright-bdd';

// Shared state passed between Given/When/Then steps within a scenario
export type CartFixtures = {
  cartState: {
    initialCount: number;
    addedProductNames: string[];
  };
};

export const test = base.extend<CartFixtures>({
  cartState: async ({}, use) => {
    await use({ initialCount: 0, addedProductNames: [] });
  },
});
