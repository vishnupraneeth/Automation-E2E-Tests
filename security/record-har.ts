/**
 * HAR Recorder — captures all HTTP traffic for the main application flows.
 *
 * The generated .har file can be imported into:
 *   • OWASP ZAP  → File > Import HAR → Active Scan
 *   • Burp Suite → Proxy > HTTP History > Import
 *   • Fiddler    → File > Import Sessions > HTTPArchive
 *
 * Run:
 *   cd <project-root>
 *   npx ts-node security/record-har.ts
 *
 * Output:  security/har/app-flows.har
 */

import { chromium } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../config/.env.dev') });

const BASE_URL  = (process.env.BASE_URL ?? 'https://automationexercise.com').replace(/\/$/, '');
const HAR_PATH  = path.resolve(__dirname, 'har/app-flows.har');
const API_URL   = 'https://restful-booker.herokuapp.com';

async function main() {
  console.log('🔍 Starting HAR recording...');
  console.log(`   Target UI  : ${BASE_URL}`);
  console.log(`   Target API : ${API_URL}`);
  console.log(`   Output HAR : ${HAR_PATH}\n`);

  fs.mkdirSync(path.dirname(HAR_PATH), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordHar: {
      path: HAR_PATH,
      mode: 'full',          // includes request + response bodies
      content: 'embed',      // embed body content inline in the HAR
      urlFilter: /.*/,       // capture ALL requests (JS, CSS, API, etc.)
    },
    ignoreHTTPSErrors: true, // needed for intercepting HTTPS in some setups
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  // ──────────────────────────────────────────────────────────────
  // FLOW 1: Homepage
  // ──────────────────────────────────────────────────────────────
  console.log('📄 Recording: Homepage');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // ──────────────────────────────────────────────────────────────
  // FLOW 2: Login page (GET)
  // ──────────────────────────────────────────────────────────────
  console.log('📄 Recording: Login page');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // ──────────────────────────────────────────────────────────────
  // FLOW 3: Login form submit (valid credentials)
  // ──────────────────────────────────────────────────────────────
  console.log('📄 Recording: Login form submit (valid)');
  await page.fill('input[data-qa="login-email"]', process.env.APP_USERNAME ?? '');
  await page.fill('input[data-qa="login-password"]', process.env.APP_PASSWORD ?? '');
  await page.click('button[data-qa="login-button"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // ──────────────────────────────────────────────────────────────
  // FLOW 4: Products listing (authenticated)
  // ──────────────────────────────────────────────────────────────
  console.log('📄 Recording: Products listing');
  await page.goto(`${BASE_URL}/products`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // ──────────────────────────────────────────────────────────────
  // FLOW 5: Product detail
  // ──────────────────────────────────────────────────────────────
  console.log('📄 Recording: Product detail');
  await page.goto(`${BASE_URL}/product_details/1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // ──────────────────────────────────────────────────────────────
  // FLOW 6: Cart
  // ──────────────────────────────────────────────────────────────
  console.log('📄 Recording: Cart');
  await page.goto(`${BASE_URL}/view_cart`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // ──────────────────────────────────────────────────────────────
  // FLOW 7: Signup page
  // ──────────────────────────────────────────────────────────────
  console.log('📄 Recording: Signup page');
  await page.goto(`${BASE_URL}/signup`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // ──────────────────────────────────────────────────────────────
  // FLOW 8: Contact Us
  // ──────────────────────────────────────────────────────────────
  console.log('📄 Recording: Contact Us');
  await page.goto(`${BASE_URL}/contact_us`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // ──────────────────────────────────────────────────────────────
  // FLOW 9: Restful Booker API flows
  // ──────────────────────────────────────────────────────────────
  console.log('📄 Recording: API — Auth + Booking CRUD');
  const apiContext = await browser.newContext({
    recordHar: {
      path: path.resolve(__dirname, 'har/api-flows.har'),
      mode: 'full',
      content: 'embed',
    },
    ignoreHTTPSErrors: true,
  });

  const apiPage = await apiContext.newPage();

  // Auth
  await apiPage.evaluate(async (apiUrl) => {
    await fetch(`${apiUrl}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'password123' }),
    });
    // GET bookings
    await fetch(`${apiUrl}/booking`);
    // GET single booking
    await fetch(`${apiUrl}/booking/1`);
    // Create booking
    const res = await fetch(`${apiUrl}/booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        firstname: 'Security',
        lastname: 'HARTest',
        totalprice: 100,
        depositpaid: true,
        bookingdates: { checkin: '2026-07-01', checkout: '2026-07-05' },
        additionalneeds: 'HAR Recording',
      }),
    });
    return res.json();
  }, API_URL);

  await apiContext.close();

  // ──────────────────────────────────────────────────────────────
  // Finalise UI HAR
  // ──────────────────────────────────────────────────────────────
  await context.close();
  await browser.close();

  const harSize = (fs.statSync(HAR_PATH).size / 1024).toFixed(1);
  const apiHarPath = path.resolve(__dirname, 'har/api-flows.har');
  const apiHarSize = (fs.statSync(apiHarPath).size / 1024).toFixed(1);

  console.log('\n✅ HAR recording complete!');
  console.log(`   security/har/app-flows.har  — ${harSize} KB  (UI flows)`);
  console.log(`   security/har/api-flows.har  — ${apiHarSize} KB  (API flows)`);
  console.log('\n🔐 Next steps — import into your security tool:');
  console.log('   OWASP ZAP  : File → Import HAR → right-click target → Active Scan');
  console.log('   Burp Suite : Proxy → HTTP History → right-click → Send to Scanner');
  console.log('   Fiddler    : File → Import Sessions → HTTPArchive (.har)');
}

main().catch((err) => {
  console.error('❌ HAR recording failed:', err);
  process.exit(1);
});
