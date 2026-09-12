import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { ApiClient } from '../src/utils/api-client';
import { DEMO_USER } from '../src/data/users';
import { DEMO_STORAGE_STATE, storageStateFor } from '../src/fixtures/test';

/**
 * Provisions the shared demo account (idempotent) and writes its storage state.
 * The app keeps the JWT in localStorage["user_access_token"], so we log in via
 * the API and persist that value – no browser needed.
 */
setup('provision shared demo user session', async () => {
  const api = await ApiClient.create();
  const health = await api.health();
  expect(health.ok(), 'API must be healthy before running the suite').toBeTruthy();

  let login = await api.login(DEMO_USER);
  if (login.status() === 401) {
    const reg = await api.register(DEMO_USER);
    expect(reg.ok()).toBeTruthy();
    login = await api.login(DEMO_USER);
  }
  expect(login.ok()).toBeTruthy();
  const body = await login.json();
  expect(body.user?.token).toBeTruthy();

  fs.mkdirSync(path.dirname(DEMO_STORAGE_STATE), { recursive: true });
  fs.writeFileSync(DEMO_STORAGE_STATE, JSON.stringify(storageStateFor(body.user.token), null, 2));
  await api.dispose();
});
