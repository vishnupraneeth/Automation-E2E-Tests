import { test, expect } from '../../../src/fixtures/apifixtures';
import { faker } from '@faker-js/faker';

test('POST /booking - create booking with dynamic (Faker) payload', async ({ bookingApi }) => {
  const firstname = faker.person.firstName();
  const lastname = faker.person.lastName();
  const totalprice = faker.number.int(1000);
  const checkin = new Date().toISOString().split('T')[0];
  const checkout = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const response = await bookingApi.createBooking({
    firstname,
    lastname,
    totalprice,
    depositpaid: true,
    bookingdates: { checkin, checkout },
    additionalneeds: 'super bowls',
  });

  expect(response.ok()).toBeTruthy();
  expect(response.status()).toBe(200);

  const body = await response.json();
  console.log(body);

  expect(body.booking).toHaveProperty('firstname', firstname);
  expect(body.booking).toHaveProperty('lastname', lastname);
  expect(body.booking.bookingdates).toHaveProperty('checkin', checkin);
  expect(body.booking.bookingdates).toHaveProperty('checkout', checkout);
});