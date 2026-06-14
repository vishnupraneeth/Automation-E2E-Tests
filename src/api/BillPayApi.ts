import { APIRequestContext } from '@playwright/test';

export interface BillerPayload {
  name: string;
  displayName: string;
  category: string;
}

export class BillPayApi {
  private readonly request: APIRequestContext;
  readonly baseURL: string;

  constructor(request: APIRequestContext, baseURL: string) {
    this.request = request;
    this.baseURL = baseURL.replace(/\/$/, '');
  }

  async getToken(): Promise<string> {
    const credentials = Buffer.from('demo:password123').toString('base64');
    const res = await this.request.get(`${this.baseURL}/`, {
      headers: { Authorization: `Basic ${credentials}` },
    });

    const body = await res.json();
    const token: string | undefined =
      body?.token ??
      body?.access_token ??
      body?.data?.token ??
      body?.data?.access_token ??
      body?.data?.demoCredentials?.bearerToken;

    if (!token) {
      console.log('BillPay token response body:', body);
      throw new Error(
        'Token not found in response. Expected bearerToken under data.demoCredentials.bearerToken',
      );
    }
    return token;
  }

  async createBiller(token: string, payload: BillerPayload) {
    return this.request.post(`${this.baseURL}/v1/billers`, {
      headers: { Authorization: `Bearer ${token}` },
      data: payload,
    });
  }

  async getBillers(token: string) {
    return this.request.get(`${this.baseURL}/v1/billers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}
