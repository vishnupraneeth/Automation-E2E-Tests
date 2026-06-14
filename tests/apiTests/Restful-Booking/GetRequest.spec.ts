import { test, expect } from '../../../src/fixtures/apifixtures';

test('GET /booking/:id - should return booking details', async ({ bookingApi }) => {
  const response = await bookingApi.getBooking(1);

  expect(response.ok()).toBeTruthy();
  expect(response.status()).toBe(200);
  console.log(await response.json());
});