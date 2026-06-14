import { request, APIRequestContext } from '@playwright/test';

export class ApiContext {
  /**
   * Creates a standalone APIRequestContext with pre-configured baseURL,
   * default headers, and timeout. Must call dispose() after use.
   */
  static async create(
    baseURL: string,
    extraHeaders: Record<string, string> = {},
  ): Promise<APIRequestContext> {
    return await request.newContext({
      baseURL,
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...extraHeaders,
      },
      ignoreHTTPSErrors: true,
    });
  }
}
