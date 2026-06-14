import { test, expect } from '../../../src/fixtures/apifixtures';

test('POST /booking - create booking with static payload', async ({ bookingApi }) => {
  const response = await bookingApi.createBooking({
    firstname: 'vishnu',
    lastname: 'praneeth',
    totalprice: 1000,
    depositpaid: true,
    bookingdates: {
      checkin: '2026-06-01',
      checkout: '2026-06-10',
    },
    additionalneeds: 'Testing data',
  });

  expect(response.ok()).toBeTruthy();
  expect(response.status()).toBe(200);

  const body = await response.json();
  console.log(body);

  expect(body.booking).toHaveProperty('firstname', 'vishnu');
  expect(body.booking).toHaveProperty('lastname', 'praneeth');
  expect(body.booking.bookingdates).toHaveProperty('checkin', '2026-06-01');
  expect(body.booking.bookingdates).toHaveProperty('checkout', '2026-06-10');
});