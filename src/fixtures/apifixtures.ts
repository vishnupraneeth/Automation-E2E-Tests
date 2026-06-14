import { test as baseTest } from '@playwright/test';
import { ApiContext } from '../api/ApiContext';
import { BookingApi } from '../api/BookingApi';

const BOOKING_BASE_URL = 'https://restful-booker.herokuapp.com';

type ApiFixtures = {
  bookingApi: BookingApi;
};

export const test = baseTest.extend<ApiFixtures>({
  bookingApi: async ({}, use) => {
    const context = await ApiContext.create(BOOKING_BASE_URL);
    await use(new BookingApi(context));
    await context.dispose(); // clean up context after each test
  },
});

export { expect } from '@playwright/test';
