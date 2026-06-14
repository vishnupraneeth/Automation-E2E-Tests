/**
 * HAR Recorder Test
 *
 * Runs as a standard Playwright test to record all application HTTP traffic
 * into a .har file that can be imported by security scanners.
 *
 * Run:
 *   npx playwright test security/record-har.spec.ts --project=security
 *
 * Output files:
 *   security/har/app-flows.har  (UI flows)
 *   security/har/api-flows.har  (REST API flows via browser fetch)
 */

import { test, request as requestModule } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../config/.env.dev') });

const BASE_URL = (process.env.BASE_URL ?? 'https://automationexercise.com').replace(/\/$/, '');
const API_URL  = 'https://restful-booker.herokuapp.com';
const HAR_DIR  = path.resolve(__dirname, 'har');

test.beforeAll(() => {
  fs.mkdirSync(HAR_DIR, { recursive: true });
});

// ─────────────────────────────────────────────────────────────────────────────
test('record HAR — UI flows (homepage, login, products, cart, contact)', async ({ browser }) => {
  const context = await browser.newContext({
    recordHar: {
      path: path.join(HAR_DIR, 'app-flows.har'),
      mode:    'full',
      content: 'embed',
    },
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();

  const pages = [
    ['/', 'Homepage'],
    ['/login', 'Login page'],
    ['/products', 'Products listing'],
    ['/product_details/1', 'Product detail'],
    ['/view_cart', 'Cart'],
    ['/contact_us', 'Contact Us'],
    ['/signup', 'Signup page'],
  ] as const;

  for (const [pagePath, label] of pages) {
    console.log(`Recording: ${label}`);
    await page.goto(`${BASE_URL}${pagePath}`, { waitUntil: 'domcontentloaded' });
  }

  await context.close(); // flushes HAR to disk

  const size = (fs.statSync(path.join(HAR_DIR, 'app-flows.har')).size / 1024).toFixed(1);
  console.log(`\n✅ UI HAR saved → security/har/app-flows.har (${size} KB)`);
  console.log('   OWASP ZAP  : File → Import HAR → Active Scan');
  console.log('   Burp Suite : Proxy → HTTP History → right-click → Send to Scanner');
  console.log('   Fiddler    : File → Import Sessions → HTTPArchive (.har)');
});

// ─────────────────────────────────────────────────────────────────────────────
test('record HAR — API flows (auth, booking CRUD via browser fetch)', async ({ browser }) => {
  const context = await browser.newContext({
    recordHar: {
      path: path.join(HAR_DIR, 'api-flows.har'),
      mode:    'full',
      content: 'embed',
    },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  // Navigate to the API origin first — eliminates CORS block on fetch()
  await page.goto(`${API_URL}/booking`, { waitUntil: 'domcontentloaded' });

  const logs = await page.evaluate(async (apiUrl) => {
    const out: string[] = [];

    async function req(method: string, path: string, body?: unknown, headers: Record<string,string> = {}) {
      const res = await fetch(`${apiUrl}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
        body: body ? JSON.stringify(body) : undefined,
      });
      const text = await res.text();
      out.push(`${method} ${path} → ${res.status}`);
      try { return { status: res.status, body: JSON.parse(text) }; }
      catch { return { status: res.status, body: text }; }
    }

    // 1. Auth
    const auth = await req('POST', '/auth', { username: 'admin', password: 'password123' });
    const token = (auth.body as { token?: string }).token ?? '';
    out.push(`  token: ${token ? 'ok' : 'FAILED'}`);

    // 2. List bookings
    await req('GET', '/booking');

    // 3. Get by id
    await req('GET', '/booking/1');

    // 4. Create
    const created = await req('POST', '/booking', {
      firstname: 'HAR', lastname: 'Recording', totalprice: 200, depositpaid: true,
      bookingdates: { checkin: '2026-08-01', checkout: '2026-08-07' },
      additionalneeds: 'HAR Recording',
    });
    const id = (created.body as { bookingid?: number }).bookingid ?? 1;
    out.push(`  bookingid: ${id}`);

    // 5. Update
    await req('PUT', `/booking/${id}`, {
      firstname: 'HAR', lastname: 'Updated', totalprice: 999, depositpaid: false,
      bookingdates: { checkin: '2026-09-01', checkout: '2026-09-10' },
      additionalneeds: 'Updated',
    }, { Cookie: `token=${token}` });

    // 6. Delete
    await req('DELETE', `/booking/${id}`, undefined, { Cookie: `token=${token}` });

    return out;
  }, API_URL);

  logs.forEach(l => console.log(' ', l));
  await context.close();

  const size = (fs.statSync(path.join(HAR_DIR, 'api-flows.har')).size / 1024).toFixed(1);
  console.log(`\n✅ API HAR saved → security/har/api-flows.har (${size} KB)`);
});
