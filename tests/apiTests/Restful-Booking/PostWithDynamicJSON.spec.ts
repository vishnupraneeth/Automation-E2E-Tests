import { test, expect } from '../../../src/fixtures/apifixtures';
import { faker } from '@faker-js/faker';
import { JsonHelperApi } from '../../../src/utils/JsonHelperApi';
import { BookingPayload } from '../../../src/api/BookingApi';

test('POST /booking - create booking with dynamic JSON template', async ({ bookingApi }) => {
  const firstname = faker.person.firstName();
  const lastname = faker.person.lastName();
  const checkin = new Date().toISOString().split('T')[0];
  const checkout = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Load template and substitute dynamic values
  let template = JSON.stringify(
    JsonHelperApi.readJson<BookingPayload>('tests/apiTests/apiTestData/PostPayloadDyamic.json'),
  );
  template = template
    .replace('vishnu', firstname)
    .replace('praneeth', lastname)
    .replace('2018-01-01', checkin)
    .replace('2019-01-01', checkout);

  const payload: BookingPayload = JSON.parse(template);

  const response = await bookingApi.createBooking(payload);

  expect(response.ok()).toBeTruthy();
  expect(response.status()).toBe(200);

  const body = await response.json();
  console.log(body);

  expect(body.booking).toHaveProperty('firstname', firstname);
  expect(body.booking).toHaveProperty('lastname', lastname);
  expect(body.booking.bookingdates).toHaveProperty('checkin', checkin);
  expect(body.booking.bookingdates).toHaveProperty('checkout', checkout);
});