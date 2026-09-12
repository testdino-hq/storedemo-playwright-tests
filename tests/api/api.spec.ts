import { test, expect } from '@playwright/test';
import { ApiClient, provisionUser } from '../../src/utils/api-client';
import { DEMO_USER, newUser } from '../../src/data/users';
import { ADDRESSES } from '../../src/data/addresses';
import { PRODUCTS } from '../../src/data/products';

const addr = { firstname: ADDRESSES[0].firstName, email: ADDRESSES[0].email, street: ADDRESSES[0].street, city: ADDRESSES[0].city, state: ADDRESSES[0].state, zipCode: ADDRESSES[0].zipCode, country: ADDRESSES[0].country };
const line = (i: number, qty = 1) => ({ id: PRODUCTS[i].id, slug: PRODUCTS[i].slug, img: '', header: PRODUCTS[i].name, price: PRODUCTS[i].price, reviewCount: PRODUCTS[i].reviewCount, quantity: qty });
const bug = (id: string) => test.info().annotations.push({ type: 'issue', description: id });

test.describe('API @api @regression', () => {
  let api: ApiClient;
  test.beforeEach(async () => { api = await ApiClient.create(); });
  test.afterEach(async () => { await api.dispose(); });

  test.describe('Health', () => {
    test('GET /health returns ok @smoke', async () => {
      const res = await api.health();
      expect(res.status()).toBe(200);
      expect(await res.json()).toEqual({ status: 'ok' });
    });
  });

  test.describe('Authentication', () => {
    test('register creates a user', async () => {
      const u = newUser('api');
      const body = await (await api.register(u)).json();
      expect(body).toMatchObject({ success: true, message: 'User Created Successfully' });
      const me = await api.loginAndRemember(u);
      await api.deleteUser(me._id);
    });
    test('register echoes the password hash @known-bug', async () => {
      bug('STORE-201: /register returns the bcrypt hash');
      const u = newUser('api');
      const body = await (await api.register(u)).json();
      const me = await api.loginAndRemember(u);
      await api.deleteUser(me._id);
      expect(body.user.password).toBeUndefined();
    });
    test('duplicate email returns 400', async () => {
      const res = await api.register(DEMO_USER);
      expect(res.status()).toBe(400);
      expect((await res.json()).message).toBe('User already Exist');
    });
    test('login returns a JWT with a 2h expiry', async () => {
      const { user } = await (await api.login(DEMO_USER)).json();
      const payload = JSON.parse(Buffer.from(user.token.split('.')[1], 'base64').toString());
      expect(payload.email).toBe(DEMO_USER.email);
      expect(payload.exp - payload.iat).toBe(7200);
      expect(user.password).toBeUndefined();
    });
    test('wrong password returns 403', async () => {
      const res = await api.login({ email: DEMO_USER.email, password: 'nope-nope' });
      expect(res.status()).toBe(403);
    });
    test('unknown email returns 401', async () => {
      expect((await api.login({ email: 'ghost@testdino-qa.com', password: 'x' })).status()).toBe(401);
    });
    test('login errors do not enumerate users @known-bug', async () => {
      bug('STORE-203: distinct messages for unknown email vs wrong password');
      const a = await (await api.login({ email: 'ghost@testdino-qa.com', password: 'x' })).json();
      const b = await (await api.login({ email: DEMO_USER.email, password: 'x' })).json();
      expect(a.message).toBe(b.message);
    });
    test('reset-password requires authentication @known-bug @security', async () => {
      bug('STORE-204: /reset-password is public');
      const { api: c, id, user } = await provisionUser(newUser('api'));
      const res = await api.resetPassword(user.email, 'Hijacked@1');
      await c.deleteUser(id); await c.dispose();
      expect(res.status()).toBe(401);
    });
  });

  test.describe('User & addresses', () => {
    let client: ApiClient; let id: string; let user: ReturnType<typeof newUser>;
    test.beforeEach(async () => { user = newUser('api'); ({ api: client, id } = await provisionUser(user)); });
    test.afterEach(async () => { await client.deleteUser(id).catch(() => {}); await client.dispose(); });

    test('GET /me returns the profile', async () => {
      const me = await client.meData();
      expect(me).toMatchObject({ firstname: user.firstname, email: user.email, id });
      expect(me.address).toEqual([]);
    });
    test('GET /me rejects a missing token', async () => {
      const res = await api.me();
      expect(res.status()).toBe(401);
      expect((await res.json()).message).toBe('Token Missing');
    });
    test('updateUser changes name and phone', async () => {
      expect((await client.updateUser({ firstName: 'Updated', phoneNumber: '9999999999' })).status()).toBe(200);
      const me = await client.meData();
      expect(me.firstname).toBe('Updated');
      expect(me.contactNumber).toBe('9999999999');
    });
    test('updateUser rejects a non-numeric phone @known-bug', async () => {
      bug('STORE-210: any string accepted as phoneNumber');
      expect((await client.updateUser({ phoneNumber: 'call-me' })).status()).toBe(400);
    });
    test('address can be added and read back', async () => {
      const body = await (await client.addAddress(id, addr)).json();
      expect(body.message).toBe('Address added successfully');
      expect((await client.meData()).address[0].city).toBe(addr.city);
    });
    test('duplicate address is rejected', async () => {
      await client.addAddress(id, addr);
      const res = await client.addAddress(id, addr);
      expect(res.status()).toBe(400);
      expect((await res.json()).message).toBe('This address already exists');
    });
    test('address limit is enforced server-side @known-bug', async () => {
      bug('STORE-220: 4-address limit only enforced in the UI');
      for (let i = 0; i < 4; i++) await client.addAddress(id, { ...addr, street: `${addr.street} #${i}` });
      expect((await client.addAddress(id, { ...addr, street: 'extra' })).status()).toBe(400);
    });
    test('user cannot delete another user @known-bug @security', async () => {
      bug('STORE-205: DELETE /:id has no ownership check');
      const victim = await provisionUser(newUser('victim'));
      const res = await client.deleteUser(victim.id);
      await victim.api.deleteUser(victim.id).catch(() => {}); await victim.api.dispose();
      expect(res.status()).toBe(403);
    });
  });

  test.describe('Orders', () => {
    let client: ApiClient; let id: string; let email: string;
    const order = () => ({ product: [line(0), line(1, 2)], quantity: 2, address: addr, paymentMethod: 'cod', totalAmount: PRODUCTS[0].priceValue + PRODUCTS[1].priceValue * 2, orderDate: Date.now(), email });
    test.beforeEach(async () => { const u = newUser('order'); email = u.email; ({ api: client, id } = await provisionUser(u)); });
    test.afterEach(async () => { await client.deleteUser(id).catch(() => {}); await client.dispose(); });

    test('createOrder returns an order id and links it to the user', async () => {
      const body = await (await client.createOrder(order())).json();
      expect(body.orderId).toMatch(/^[a-f0-9]{24}$/);
      expect((await client.meData()).orders.map((o) => o._id)).toContain(body.orderId);
    });
    test('findOrder returns products and totals', async () => {
      const { orderId } = await (await client.createOrder(order())).json();
      const { order: o } = await (await client.findOrder(orderId)).json();
      expect(o.product).toHaveLength(2);
      expect(o.totalAmount).toBe(order().totalAmount);
    });
    test('cancel removes the order', async () => {
      const { orderId } = await (await client.createOrder(order())).json();
      expect((await client.cancelOrder(orderId, id)).status()).toBe(200);
      expect((await client.findOrder(orderId)).status()).toBe(404);
    });
    test('server recomputes totals @known-bug', async () => {
      bug('STORE-230: totalAmount trusted from the client');
      const { orderId } = await (await client.createOrder({ ...order(), totalAmount: 1 })).json();
      const { order: o } = await (await client.findOrder(orderId)).json();
      expect(o.totalAmount).toBe(order().totalAmount);
    });
    test('another user cannot cancel this order @known-bug @security', async () => {
      bug('STORE-232: /cancleOrder trusts userId from the body');
      const { orderId } = await (await client.createOrder(order())).json();
      const attacker = await provisionUser(newUser('attacker'));
      const res = await attacker.api.cancelOrder(orderId, id);
      await attacker.api.deleteUser(attacker.id); await attacker.api.dispose();
      expect(res.status()).toBe(403);
    });
  });

  test.describe('Security', () => {
    test('alg=none token is rejected', async () => {
      const h = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const p = Buffer.from(JSON.stringify({ email: DEMO_USER.email, id: '1' })).toString('base64url');
      const c = await ApiClient.create(`${h}.${p}.`);
      expect([401, 403]).toContain((await c.me()).status());
      await c.dispose();
    });
    test('rate limiting after many failed logins @known-bug', async ({ request }) => {
      bug('STORE-241: no rate limiting on /login');
      let last = 0;
      for (let i = 0; i < 8; i++) last = (await request.post('login', { data: { email: DEMO_USER.email, password: `bad${i}` } })).status();
      expect(last).toBe(429);
    });
    test('token in the request body is not accepted @known-bug', async ({ request }) => {
      bug('STORE-240: middleware accepts req.body.token');
      const { user } = await (await request.post('login', { data: DEMO_USER })).json();
      expect((await request.put('updateUser', { data: { token: user.token, phoneNumber: '1112223333' } })).status()).toBe(401);
    });
  });
});
