import { test, expect, request as playwrightRequest } from '@playwright/test';

// POM standard (API Layer): Auth API helper
class BillPayAuthApi {
  private readonly baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL.replace(/\/$/, '');
  }

  async getToken(apiRequest: { get: Function }) {
    // As per requirement: Basic Auth demo / password123
    const username = 'demo';
    const password = 'password123';

    const res = await apiRequest.get(`${this.baseURL}/`, {
      auth: { username, password },
    });

    expect(res.status(), 'Token endpoint status').toBe(200);

    const body = await res.json();

    // Response shape (per current run): { success: true, data: { demoCredentials: { basicAuth, bearerToken, apiKey, sessionCookie } } }
    const token: string | undefined =
      body?.token ??
      body?.access_token ??
      body?.data?.token ??
      body?.data?.access_token ??
      body?.data?.demoCredentials?.bearerToken;

    if (!token) {
      // eslint-disable-next-line no-console
      console.log('BillPay token response body:', body);
      throw new Error('Token not found in response. Expected bearerToken under data.demoCredentials.bearerToken');
    }

    return token;
  }
}

test('BillPay - fetch auth token (Basic Auth)', async ({ request }) => {
  const baseURL = process.env.BILLPAY_BASE_URL ?? 'https://billpay-api.gauravkhurana-practice-api.workers.dev';

  const authApi = new BillPayAuthApi(baseURL);

  const token = await authApi.getToken(request);
  expect(token.length).toBeGreaterThan(10);
});

