import { APIRequestContext, request } from '@playwright/test';
import { Credentials } from '../data/users';
import { Address } from '../data/addresses';

export const API_BASE_URL = (process.env.API_BASE_URL || 'https://storedemo-api.testdino.com/api').replace(/\/$/, '');
/** baseURL must end with `/` so relative paths resolve under /api */
const CTX_BASE = `${API_BASE_URL}/`;

/**
 * Thin typed wrapper around the Demo Store REST API.
 * Mirrors backend/routes/user.js.
 */
export class ApiClient {
  constructor(private readonly ctx: APIRequestContext, public token?: string) {}

  static async create(token?: string) {
    const ctx = await request.newContext({ baseURL: CTX_BASE });
    return new ApiClient(ctx, token);
  }

  private authHeaders(): Record<string, string> {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  async dispose() {
    await this.ctx.dispose();
  }

  // ---- public ----
  health() {
    return this.ctx.get(`${API_BASE_URL.replace(/\/api$/, '')}/health`);
  }

  register(user: Credentials) {
    return this.ctx.post('register', {
      data: { firstname: user.firstname, lastname: user.lastname, email: user.email, password: user.password },
    });
  }

  login(creds: Pick<Credentials, 'email' | 'password'>) {
    return this.ctx.post('login', { data: creds });
  }

  /** Logs in and stores the JWT on this client. Returns the user payload. */
  async loginAndRemember(creds: Pick<Credentials, 'email' | 'password'>) {
    const res = await this.login(creds);
    const body = await res.json();
    if (!body?.user?.token) throw new Error(`Login failed for ${creds.email}: ${JSON.stringify(body)}`);
    this.token = body.user.token as string;
    return body.user as { _id: string; email: string; firstname: string; lastname: string; token: string };
  }

  resetPassword(email: string, password: string) {
    return this.ctx.put('reset-password', { data: { email, password } });
  }

  // ---- protected ----
  me() {
    return this.ctx.get('me', { headers: this.authHeaders() });
  }

  async meData() {
    const res = await this.me();
    const body = await res.json();
    return body?.data?.data as {
      id: string;
      firstname: string;
      lastname: string;
      email: string;
      contactNumber?: string;
      address: Array<Address & { _id: string; firstname?: string }>;
      orders: Array<{ _id: string; totalAmount: number; paymentMethod: string; product: any[] }>;
    };
  }

  updateUser(data: { firstName?: string; lastName?: string; phoneNumber?: string }) {
    return this.ctx.put('updateUser', { data, headers: this.authHeaders() });
  }

  addAddress(userId: string, address: Partial<Address> & { firstname?: string }) {
    return this.ctx.post('address', { data: { id: userId, address }, headers: this.authHeaders() });
  }

  updateAddress(data: Record<string, unknown>) {
    return this.ctx.put('updateAddress', { data, headers: this.authHeaders() });
  }

  deleteAddress(id: string) {
    return this.ctx.delete(`address/${id}`, { headers: this.authHeaders() });
  }

  createOrder(data: Record<string, unknown>) {
    return this.ctx.post('createOrder', { data, headers: this.authHeaders() });
  }

  findOrder(id: string) {
    return this.ctx.get(`findOrder/${id}`, { headers: this.authHeaders() });
  }

  cancelOrder(id: string, userId: string) {
    return this.ctx.put('cancleOrder', { data: { id, userId }, headers: this.authHeaders() });
  }

  deleteUser(id: string) {
    return this.ctx.delete(`${id}`, { headers: this.authHeaders() });
  }
}

/** Registers a brand-new user and returns an authenticated client + identity. */
export async function provisionUser(user: Required<Credentials>) {
  const api = await ApiClient.create();
  const reg = await api.register(user);
  if (!reg.ok()) throw new Error(`Could not register ${user.email}: ${reg.status()} ${await reg.text()}`);
  const me = await api.loginAndRemember(user);
  return { api, user, id: me._id, token: me.token };
}
