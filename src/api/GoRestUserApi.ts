import { APIRequestContext } from '@playwright/test';

export interface UserPayload {
  name: string;
  email: string;
  gender: 'male' | 'female';
  status: 'active' | 'inactive';
}

export class GoRestUserApi {
  private readonly request: APIRequestContext;
  private readonly baseURL = 'https://gorest.co.in/public/v2';
  private readonly headers: Record<string, string>;

  constructor(request: APIRequestContext, authToken: string) {
    this.request = request;
    this.headers = { Authorization: `Bearer ${authToken}` };
  }

  async getUsers() {
    return this.request.get(`${this.baseURL}/users`, { headers: this.headers });
  }

  async createUser(payload: UserPayload) {
    return this.request.post(`${this.baseURL}/users`, {
      headers: this.headers,
      data: payload,
    });
  }

  async updateUser(id: number, payload: Partial<UserPayload>) {
    return this.request.put(`${this.baseURL}/users/${id}`, {
      headers: this.headers,
      data: payload,
    });
  }

  async deleteUser(id: number) {
    return this.request.delete(`${this.baseURL}/users/${id}`, {
      headers: this.headers,
    });
  }
}
