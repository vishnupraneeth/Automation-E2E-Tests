import { test, expect } from '../../../src/fixtures/apifixtures';
import { JsonHelperApi } from '../../../src/utils/JsonHelperApi';
import { BookingPayload, TokenCredentials } from '../../../src/api/BookingApi';

test('PUT /booking/:id - create, authenticate, then update booking', async ({ bookingApi }) => {
  const postPayload = JsonHelperApi.readJson<BookingPayload>('tests/apiTests/apiTestData/post_request_body.json');
  const putPayload = JsonHelperApi.readJson<BookingPayload>('tests/apiTests/apiTestData/put_request_body.json');
  const tokenCredentials = JsonHelperApi.readJson<TokenCredentials>('tests/apiTests/apiTestData/token_request_body.json');

  // Step 1: Create a new booking
  const createResponse = await bookingApi.createBooking(postPayload);
  expect(createResponse.ok()).toBeTruthy();
  const { bookingid } = await createResponse.json();

  // Step 2: GET bookings with query params
  const getResponse = await bookingApi.getAllBookings({ firstname: 'vishnu praneeth', lastname: 'MVA' });
  expect(getResponse.ok()).toBeTruthy();
  expect(getResponse.status()).toBe(200);
  console.log(await getResponse.json());

  // Step 3: Generate auth token
  const tokenResponse = await bookingApi.generateToken(tokenCredentials);
  expect(tokenResponse.ok()).toBeTruthy();
  expect(tokenResponse.status()).toBe(200);
  const { token } = await tokenResponse.json();

  // Step 4: Update the booking with token auth
  const putResponse = await bookingApi.updateBooking(bookingid, token, putPayload);
  expect(putResponse.ok()).toBeTruthy();
  expect(putResponse.status()).toBe(200);
  console.log(await putResponse.json());
});