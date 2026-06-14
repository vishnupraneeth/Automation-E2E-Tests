import { APIRequestContext } from '@playwright/test';

export interface BookingDates {
  checkin: string;
  checkout: string;
}

export interface BookingPayload {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: BookingDates;
  additionalneeds?: string;
}

export interface CreateBookingResponse {
  bookingid: number;
  booking: BookingPayload;
}

export interface TokenCredentials {
  username: string;
  password: string;
}

export class BookingApi {
  private readonly request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  async getBooking(id: number) {
    return this.request.get(`/booking/${id}`);
  }

  async getAllBookings(params?: { firstname?: string; lastname?: string }) {
    return this.request.get('/booking', { params });
  }

  async createBooking(payload: BookingPayload) {
    return this.request.post('/booking', { data: payload });
  }

  async generateToken(credentials: TokenCredentials) {
    return this.request.post('/auth', { data: credentials });
  }

  async updateBooking(id: number, token: string, payload: BookingPayload) {
    return this.request.put(`/booking/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${token}`,
      },
      data: payload,
    });
  }
}
