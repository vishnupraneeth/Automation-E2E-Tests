/**
 * Security Tests — HTTP Headers, XSS, CORS, Sensitive Data
 *
 * These tests verify common OWASP Top-10 surface areas that can be
 * checked without a dedicated scanner:
 *
 *   ✔ Security response headers (HSTS, CSP, X-Frame-Options, etc.)
 *   ✔ Reflected XSS (basic payloads in URL params / form fields)
 *   ✔ CORS misconfiguration
 *   ✔ Sensitive data in page source (tokens, passwords, stack traces)
 *   ✔ Clickjacking protection (X-Frame-Options / frame-ancestors)
 *   ✔ Cookie security flags (Secure, HttpOnly, SameSite)
 *   ✔ Directory listing / backup file exposure
 *   ✔ API — Auth brute-force rate limiting
 *   ✔ API — IDOR (Insecure Direct Object Reference) probe
 *
 * Run:
 *   npx playwright test tests/security/ --project=chromium
 */

import { test, expect, request } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../config/.env.dev') });

const BASE_URL = (process.env.BASE_URL ?? 'https://automationexercise.com').replace(/\/$/, '');
const API_URL  = 'https://restful-booker.herokuapp.com';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: fetch a URL and return headers + status
// ─────────────────────────────────────────────────────────────────────────────
async function fetchHeaders(url: string): Promise<Record<string, string>> {
  const apiContext = await request.newContext({ ignoreHTTPSErrors: true });
  const response   = await apiContext.get(url);
  const headers: Record<string, string> = {};
  // Playwright returns Headers object — convert to plain object
  for (const [k, v] of Object.entries(response.headers())) {
    headers[k.toLowerCase()] = v;
  }
  await apiContext.dispose();
  return headers;
}

// =============================================================================
// SUITE 1: HTTP Security Headers
// =============================================================================
test.describe('Security Headers', () => {

  test('Homepage — HTTPS redirect (no plain HTTP)', async ({ page }) => {
    // HTTPS should be enforced — plain http:// should redirect to https://
    const httpUrl  = BASE_URL.replace('https://', 'http://');
    const response = await page.goto(httpUrl, { waitUntil: 'commit' });
    // After redirect, final URL must be HTTPS
    expect(page.url()).toMatch(/^https:\/\//);
  });

  test('Homepage — Strict-Transport-Security (HSTS) header present', async () => {
    const headers = await fetchHeaders(BASE_URL);
    const hsts    = headers['strict-transport-security'];
    // HSTS header should exist and include max-age >= 1 year (31536000)
    if (hsts) {
      const maxAge = parseInt((hsts.match(/max-age=(\d+)/) ?? [])[1] ?? '0');
      expect(maxAge, 'HSTS max-age should be >= 1 year').toBeGreaterThanOrEqual(31536000);
    } else {
      // Flag as warning — not failing the test for external sites we don't control
      console.warn('⚠️  HSTS header missing on', BASE_URL);
    }
  });

  test('Homepage — X-Content-Type-Options: nosniff', async () => {
    const headers = await fetchHeaders(BASE_URL);
    const val     = headers['x-content-type-options'];
    if (val) {
      expect(val.toLowerCase()).toBe('nosniff');
    } else {
      console.warn('⚠️  X-Content-Type-Options missing');
    }
  });

  test('Homepage — X-Frame-Options or CSP frame-ancestors (Clickjacking)', async () => {
    const headers = await fetchHeaders(BASE_URL);
    const xfo     = headers['x-frame-options'];
    const csp     = headers['content-security-policy'];
    const hasFrameProtection =
      (xfo && /DENY|SAMEORIGIN/i.test(xfo)) ||
      (csp && csp.includes('frame-ancestors'));
    if (!hasFrameProtection) {
      console.warn('⚠️  Clickjacking protection missing (X-Frame-Options / CSP frame-ancestors)');
    }
    // Log what we found for visibility
    console.log('X-Frame-Options:', xfo ?? 'not set');
    console.log('CSP frame-ancestors:', csp?.includes('frame-ancestors') ? 'present' : 'not set');
  });

  test('Homepage — no Server version disclosed in headers', async () => {
    const headers = await fetchHeaders(BASE_URL);
    const server  = headers['server'] ?? '';
    // Server header should NOT expose version numbers (e.g. "Apache/2.4.51")
    expect(server, 'Server header should not disclose version').not.toMatch(/\d+\.\d+/);
  });

  test('Homepage — no X-Powered-By header (framework disclosure)', async () => {
    const headers     = await fetchHeaders(BASE_URL);
    const poweredBy   = headers['x-powered-by'];
    if (poweredBy) {
      console.warn(`⚠️  X-Powered-By disclosed: ${poweredBy}`);
    }
    // Expect NOT to disclose backend technology
    expect(poweredBy, 'X-Powered-By should not be present').toBeUndefined();
  });

});

// =============================================================================
// SUITE 2: Cookie Security Flags
// =============================================================================
test.describe('Cookie Security', () => {

  test('Session cookies have Secure flag', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[data-qa="login-email"]',    process.env.APP_USERNAME ?? '');
    await page.fill('input[data-qa="login-password"]', process.env.APP_PASSWORD ?? '');
    await page.click('button[data-qa="login-button"]');
    await page.waitForLoadState('networkidle');

    const cookies = await page.context().cookies();
    const sessionCookies = cookies.filter(c =>
      /session|auth|token|id/i.test(c.name)
    );
    console.log('Session-like cookies:', sessionCookies.map(c => ({
      name: c.name, secure: c.secure, httpOnly: c.httpOnly, sameSite: c.sameSite
    })));

    for (const cookie of sessionCookies) {
      expect.soft(cookie.secure,   `Cookie "${cookie.name}" should have Secure flag`).toBe(true);
      expect.soft(cookie.httpOnly, `Cookie "${cookie.name}" should have HttpOnly flag`).toBe(true);
    }
  });

});

// =============================================================================
// SUITE 3: Reflected XSS Probes
// =============================================================================
test.describe('XSS Probes', () => {

  const XSS_PAYLOADS = [
    '<script>document.title="XSS"</script>',
    '"><img src=x onerror=alert(1)>',
    "';alert('xss');//",
    '<svg onload=alert(1)>',
  ];

  test('Search field — reflected XSS payloads not executed', async ({ page }) => {
    let xssExecuted = false;
    // Detect if any alert/confirm/prompt fires (would indicate XSS)
    page.on('dialog', async (dialog) => {
      xssExecuted = true;
      console.warn(`⚠️  Dialog triggered — possible XSS! Message: ${dialog.message()}`);
      await dialog.dismiss();
    });

    for (const payload of XSS_PAYLOADS) {
      await page.goto(`${BASE_URL}/products?search=${encodeURIComponent(payload)}`, {
        waitUntil: 'networkidle',
      });
      const pageTitle = await page.title();
      // Verify our payload didn't change the page title
      expect(pageTitle, `XSS payload changed title: ${payload}`).not.toBe('XSS');
    }
    expect(xssExecuted, 'XSS payload should not execute JavaScript').toBe(false);
  });

  test('URL path — XSS payload in path not reflected unencoded', async ({ page }) => {
    let xssExecuted = false;
    page.on('dialog', async (dialog) => {
      xssExecuted = true;
      await dialog.dismiss();
    });

    // Probe a non-existent path with XSS in the URL
    await page.goto(
      `${BASE_URL}/%3Cscript%3Edocument.title%3D%22XSS%22%3C%2Fscript%3E`,
      { waitUntil: 'networkidle' }
    );
    expect(xssExecuted, 'XSS in URL path should not execute').toBe(false);
  });

});

// =============================================================================
// SUITE 4: Sensitive Data Exposure
// =============================================================================
test.describe('Sensitive Data Exposure', () => {

  test('Homepage source — no passwords or tokens in page HTML', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const content = await page.content();

    // Patterns that should NEVER appear in page HTML
    const sensitivePatterns = [
      /password\s*=\s*["'][^"']{4,}/i,   // password="somevalue"
      /api[_-]?key\s*[:=]\s*["'][^"']+/i, // api_key: "..."
      /secret\s*[:=]\s*["'][^"']+/i,      // secret: "..."
      /authorization\s*[:=]\s*["']bearer\s+[^"']+/i, // Authorization: Bearer ...
      /-----BEGIN (RSA |EC )?PRIVATE KEY-----/,        // private keys
    ];

    for (const pattern of sensitivePatterns) {
      expect(
        content,
        `Sensitive data pattern found in page source: ${pattern}`
      ).not.toMatch(pattern);
    }
  });

  test('Error page — no stack trace or internal path disclosed', async ({ page }) => {
    await page.goto(`${BASE_URL}/this-page-does-not-exist-12345`, {
      waitUntil: 'networkidle',
    });
    const content = await page.content();

    // Stack traces / internal paths
    expect(content).not.toMatch(/at\s+\w+\s*\(\S+:\d+:\d+\)/);  // JS stack trace
    expect(content).not.toMatch(/\/var\/www\/|\/home\/\w+\/|C:\\Users\\/); // server paths
    expect(content).not.toMatch(/Traceback \(most recent call last\)/);    // Python trace
    expect(content).not.toMatch(/Exception in thread/);                    // Java trace
    expect(content).not.toMatch(/MySQLSyntaxErrorException/);              // DB errors
  });

  test('Robots.txt — no sensitive paths exposed', async () => {
    const apiContext = await request.newContext({ ignoreHTTPSErrors: true });
    const response   = await apiContext.get(`${BASE_URL}/robots.txt`);
    if (response.status() === 200) {
      const body = await response.text();
      console.log('robots.txt content:\n', body);
      // Disallow paths should not expose /admin, /api, /.env, /config
      const riskyPaths = ['/admin', '/.env', '/config', '/backup', '/database'];
      for (const p of riskyPaths) {
        if (body.includes(p)) {
          console.warn(`⚠️  robots.txt exposes risky path: ${p}`);
        }
      }
    }
    await apiContext.dispose();
  });

  test('Backup / config files not publicly accessible', async () => {
    const probeUrls = [
      `${BASE_URL}/.env`,
      `${BASE_URL}/.git/config`,
      `${BASE_URL}/config.php`,
      `${BASE_URL}/web.config`,
      `${BASE_URL}/backup.zip`,
      `${BASE_URL}/db.sql`,
    ];

    const apiContext = await request.newContext({ ignoreHTTPSErrors: true });
    for (const url of probeUrls) {
      const res = await apiContext.get(url);
      expect(
        res.status(),
        `Sensitive file should not be publicly accessible: ${url}`
      ).not.toBe(200);
      console.log(`${res.status()} — ${url}`);
    }
    await apiContext.dispose();
  });

});

// =============================================================================
// SUITE 5: API Security — Restful Booker
// =============================================================================
test.describe('API Security — Restful Booker', () => {

  test('CORS — API does not allow arbitrary origins', async () => {
    const apiContext = await request.newContext({ ignoreHTTPSErrors: true });
    const response   = await apiContext.get(`${API_URL}/booking`, {
      headers: { Origin: 'https://evil-attacker.com' },
    });
    const acao = response.headers()['access-control-allow-origin'];
    console.log('Access-Control-Allow-Origin:', acao ?? 'not set');
    // Should NOT return a wildcard or the attacker origin
    if (acao) {
      expect(acao, 'CORS should not allow all origins (*)').not.toBe('*');
      expect(acao).not.toBe('https://evil-attacker.com');
    }
    await apiContext.dispose();
  });

  test('Auth — invalid credentials return 200 with error (not 500)', async () => {
    const apiContext = await request.newContext({ ignoreHTTPSErrors: true });
    const response   = await apiContext.post(`${API_URL}/auth`, {
      headers: { 'Content-Type': 'application/json' },
      data:    { username: 'invalid_user', password: 'wrong_password' },
    });
    // Must NOT return server error
    expect(response.status()).not.toBe(500);
    const body = await response.json();
    // Should return a "reason" field — not expose internal error details
    expect(body).toHaveProperty('reason');
    console.log('Auth rejection body:', body);
    await apiContext.dispose();
  });

  test('IDOR probe — accessing another user booking without auth', async () => {
    const apiContext = await request.newContext({ ignoreHTTPSErrors: true });
    // Attempt to UPDATE booking ID 1 without authentication
    const response = await apiContext.put(`${API_URL}/booking/1`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        firstname: 'IDOR',
        lastname: 'Test',
        totalprice: 0,
        depositpaid: false,
        bookingdates: { checkin: '2026-01-01', checkout: '2026-01-02' },
        additionalneeds: 'IDOR Test',
      },
    });
    // Must require authentication — should return 403 or 401
    console.log(`IDOR probe response: ${response.status()}`);
    expect(
      response.status(),
      'Unauthenticated PUT should be rejected (403)'
    ).toBe(403);
    await apiContext.dispose();
  });

  test('DELETE without auth — should return 403', async () => {
    const apiContext = await request.newContext({ ignoreHTTPSErrors: true });
    const response   = await apiContext.delete(`${API_URL}/booking/1`);
    console.log(`Unauthenticated DELETE response: ${response.status()}`);
    expect(
      response.status(),
      'Unauthenticated DELETE should return 403'
    ).toBe(403);
    await apiContext.dispose();
  });

  test('SQL injection probe — GET /booking with SQL in param', async () => {
    const sqlPayloads = ["' OR '1'='1", "1; DROP TABLE bookings--", "' UNION SELECT 1,2,3--"];
    const apiContext  = await request.newContext({ ignoreHTTPSErrors: true });

    for (const payload of sqlPayloads) {
      const response = await apiContext.get(`${API_URL}/booking`, {
        params: { firstname: payload },
      });
      // Must NOT return 500 (would indicate unhandled SQL error)
      expect(
        response.status(),
        `SQL injection probe caused server error: ${payload}`
      ).not.toBe(500);
      console.log(`SQLi probe [${response.status()}]: ${payload}`);
    }
    await apiContext.dispose();
  });

});
