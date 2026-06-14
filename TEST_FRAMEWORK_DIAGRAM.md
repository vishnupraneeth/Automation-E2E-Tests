# 🧪 Test Automation E2E Framework — POM Architecture Diagram

> **Stack:** Playwright · TypeScript · Allure · BDD (playwright-bdd) · Faker · Jira Reporter

---

## 📐 High-Level Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TEST AUTOMATION FRAMEWORK                            │
│                                                                             │
│   ┌─────────────────────────┐       ┌─────────────────────────────────┐   │
│   │      UI TESTS  (POM)    │       │       API TESTS  (POM)          │   │
│   │   Playwright + Browser  │       │   Playwright APIRequestContext  │   │
│   └─────────────────────────┘       └─────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │          SHARED LAYER  ─  Fixtures · Utils · TestData               │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │          REPORTING  ─  Allure · HTML · List · Jira Reporter         │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🖥️ UI Tests — Page Object Model Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          UI TEST FLOW (POM)                             │
└─────────────────────────────────────────────────────────────────────────┘

  playwright.config.ts
        │
        │  project: 'chromium'  (baseURL from .env.dev / .env.prod)
        ▼
  ┌─────────────────────┐
  │   Test Spec Files   │  tests/
  │  ─────────────────  │  ├── loginPage.spec.ts
  │  homepage.spec.ts   │  ├── homepagefix.spec.ts
  │  loginPage.spec.ts  │  ├── signupPage.spec.ts
  │  signupPage.spec.ts │  └── BDD ▶ features/cart.feature
  └────────┬────────────┘
           │  imports
           ▼
  ┌──────────────────────────────────────────────────────────┐
  │               FIXTURES  (src/fixtures/pagefixtures.ts)   │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │  baseTest.extend<pageFixtures>({                   │  │
  │  │    loginPage  → new LoginPage(page)                │  │
  │  │    homePage   → new HomePage(page)                 │  │
  │  │    SignupPage → new SignupPage(page)                │  │
  │  │    testData   → CsvHelper.readCsv(loginData.csv)   │  │
  │  │  })                                                │  │
  │  └────────────────────────────────────────────────────┘  │
  └───────────────────────────┬──────────────────────────────┘
                              │  extends
                              ▼
  ┌───────────────────────────────────────────────────────────────────────┐
  │                  PAGE OBJECT LAYER  (src/pages/)                      │
  │                                                                       │
  │   ┌────────────────────────────────────────────────────────────────┐  │
  │   │                    BasePage (abstract base)                    │  │
  │   │   constructor(page: Page)  ─  holds shared page reference      │  │
  │   └───────────┬──────────────────────────────────────────┬─────────┘  │
  │               │  extends                                 │  extends   │
  │        ┌──────┴──────────────────┐       ┌──────────────┴──────────┐  │
  │        │       LoginPage         │       │       HomePage          │  │
  │        │  ─────────────────────  │       │  ──────────────────── ─ │  │
  │        │  Locators:              │       │  Locators:              │  │
  │        │   • EmailId             │       │   • HomePageLogo        │  │
  │        │   • Password            │       │   • LoggedInUser        │  │
  │        │   • LoginButton         │       │                         │  │
  │        │   • SignupName/Email    │       │  Methods:               │  │
  │        │   • loginErrorMessage   │       │   • getHomePageTitle()  │  │
  │        │                         │       │   • isLogoVisible()     │  │
  │        │  Methods:               │       │   • getLoggedInUser()   │  │
  │        │   • goToLoginPage()     │       └─────────────────────────┘  │
  │        │   • loginToApplication()│                                    │
  │        │   • loginWithInvalid()  │       ┌─────────────────────────┐  │
  │        │   • EnterSignupAndClick │       │      SignupPage         │  │
  │        └─────────────────────────┘       │  ──────────────────────  │  │
  │                                          │  Locators:              │  │
  │                                          │   • firstName/lastName  │  │
  │                                          │   • state/city/zipcode  │  │
  │                                          │   • mobileNumber        │  │
  │                                          │   • address / password  │  │
  │                                          │   • createAccountButton │  │
  │                                          │                         │  │
  │                                          │  Methods:               │  │
  │                                          │   • fillSignupFromJson()│  │
  │                                          │   • createNewAccount()  │  │
  │                                          └─────────────────────────┘  │
  └───────────────────────────────────────────────────────────────────────┘
                              │
                              │  reads test data via
                              ▼
  ┌───────────────────────────────────────────────────────────────────────┐
  │                UTILITIES & TEST DATA  (src/utils/ + src/testdata/)    │
  │   CsvHelper  ─── loginData.csv          (data-driven login tests)     │
  │   JsonHelper ─── SignupUtils.json        (signup form data)            │
  │   FakerHelper ── generates random name/email at runtime               │
  └───────────────────────────────────────────────────────────────────────┘
```

---

## 🧪 UI Test Cases Map

```
┌──────────────────────────────────────────────────────────────────────┐
│                        UI TEST CASES                                 │
├──────────────────────────────┬───────────────────────────────────────┤
│  Spec File                   │  Test Cases                           │
├──────────────────────────────┼───────────────────────────────────────┤
│  loginPage.spec.ts           │  ✔ Login Page Title Validation        │
│                              │  ✔ Sign Up Button Validation          │
│                              │  ✔ Login to Application               │
├──────────────────────────────┼───────────────────────────────────────┤
│  homepage.spec.ts            │  ✔ Home Page Title Validation         │
│  (uses page fixtures)        │  ✔ Home Page Logo Validation          │
│                              │  ✔ Logged In User Text Validation     │
├──────────────────────────────┼───────────────────────────────────────┤
│  signupPage.spec.ts          │  ✔ Fill Signup Form & Validate        │
│  (JSON data-driven loop)     │     (runs per JSON row via loop)      │
├──────────────────────────────┼───────────────────────────────────────┤
│  BDD: cart.feature           │  ✔ Cart Scenarios (Gherkin steps)     │
│  features/steps/cartSteps.ts │     Given / When / Then               │
└──────────────────────────────┴───────────────────────────────────────┘
```

---

## 🌐 API Tests — Page Object Model (API Object Model) Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         API TEST FLOW (POM)                             │
└─────────────────────────────────────────────────────────────────────────┘

  playwright.config.ts
        │
        │  project: 'api'  (baseURL: https://restful-booker.herokuapp.com)
        ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │                   API Test Spec Files  (tests/apiTests/)         │
  │                                                                  │
  │  user.spec.ts                  ──▶  GoRest User API (raw)        │
  │  Restful-Booking/                                                │
  │   ├── GetRequest.spec.ts       ──▶  GET /booking/:id             │
  │   ├── PostAddBooking.spec.ts   ──▶  POST /booking (static)       │
  │   ├── PostAddBookingFaker.spec.ts ▶ POST /booking (faker data)   │
  │   ├── PostWithDynamicJSON.spec.ts ▶ POST /booking (JSON file)    │
  │   └── PutRequest.spec.ts      ──▶  PUT /booking/:id             │
  │  billpay/                                                        │
  │   ├── auth.spec.ts            ──▶  POST /auth (token)           │
  │   └── billers.spec.ts        ──▶  GET/POST /v1/billers          │
  └──────────────────┬───────────────────────────────────────────────┘
                     │  imports
                     ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │           API FIXTURES  (src/fixtures/apifixtures.ts)            │
  │  ┌───────────────────────────────────────────────────────────┐   │
  │  │  baseTest.extend<ApiFixtures>({                           │   │
  │  │    bookingApi: async ({}, use) => {                       │   │
  │  │      const ctx = await ApiContext.create(BOOKING_URL)     │   │
  │  │      await use(new BookingApi(ctx))                       │   │
  │  │      await ctx.dispose()   ◀── auto cleanup               │   │
  │  │    }                                                      │   │
  │  │  })                                                       │   │
  │  └───────────────────────────────────────────────────────────┘   │
  └──────────────────────────────────────────────────────────────────┘
                     │  wraps
                     ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │              API OBJECT LAYER  (src/api/)                            │
  │                                                                      │
  │  ┌─────────────────────────────────────────────────────────────┐    │
  │  │                   ApiContext  (Factory)                     │    │
  │  │   static create(baseURL, extraHeaders)                      │    │
  │  │    ▶ sets Content-Type, Accept, ignoreHTTPSErrors           │    │
  │  │    ▶ returns APIRequestContext                              │    │
  │  └───────────────────────────┬─────────────────────────────────┘    │
  │                              │  injects into                        │
  │         ┌────────────────────┼──────────────────────┐               │
  │         ▼                    ▼                       ▼               │
  │  ┌─────────────┐   ┌──────────────────┐   ┌───────────────────┐    │
  │  │ BookingApi  │   │  GoRestUserApi   │   │    BillPayApi     │    │
  │  │ ──────────  │   │  ──────────────  │   │  ──────────────── │    │
  │  │ Methods:    │   │  Base: gorest    │   │  Methods:         │    │
  │  │ getBooking()│   │  Auth: Bearer    │   │  getToken()       │    │
  │  │ getAllBook() │   │                  │   │  createBiller()   │    │
  │  │ createBook()│   │  Methods:        │   │  getBillers()     │    │
  │  │ generateTok │   │  getUsers()      │   │                   │    │
  │  │ updateBook()│   │  createUser()    │   │  Auth: Basic +    │    │
  │  │             │   │  updateUser()    │   │  Bearer token     │    │
  │  │ Target:     │   │  deleteUser()    │   │                   │    │
  │  │ restful-    │   │                  │   │  Target:          │    │
  │  │ booker API  │   │  Target:         │   │  BillPay API      │    │
  │  └─────────────┘   │  GoRest API      │   └───────────────────┘    │
  │                    └──────────────────┘                             │
  └──────────────────────────────────────────────────────────────────────┘
```

---

## 🧪 API Test Cases Map

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          API TEST CASES                                  │
├────────────────────────────────────┬─────────────────────────────────────┤
│  Spec File                         │  Test Cases                         │
├────────────────────────────────────┼─────────────────────────────────────┤
│  user.spec.ts                      │  ✔ GET users (200)                  │
│  (GoRest - raw request)            │  ✔ POST create user (201)           │
│                                    │  ✔ PUT update user (200)            │
│                                    │  ✔ DELETE user (204)                │
├────────────────────────────────────┼─────────────────────────────────────┤
│  GetRequest.spec.ts                │  ✔ GET /booking/:id                 │
│  PostAddBooking.spec.ts            │  ✔ POST /booking (static payload)   │
│  PostAddBookingFaker.spec.ts       │  ✔ POST /booking (Faker data)       │
│  PostWithDynamicJSON.spec.ts       │  ✔ POST /booking (JSON file data)   │
│  PutRequest.spec.ts                │  ✔ PUT /booking/:id (update)        │
├────────────────────────────────────┼─────────────────────────────────────┤
│  billpay/auth.spec.ts              │  ✔ Auth token retrieval             │
│  billpay/billers.spec.ts           │  ✔ GET billers list                 │
│                                    │  ✔ POST create biller               │
└────────────────────────────────────┴─────────────────────────────────────┘
```

---

## 🔄 Complete End-to-End Execution Flow

```
╔══════════════════════════════════════════════════════════════════════════╗
║                      FULL EXECUTION PIPELINE                            ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║   CI/CD (Jenkins)                                                        ║
║       │                                                                  ║
║       ▼                                                                  ║
║   ENV selection (.env.dev / .env.prod)                                  ║
║       │                                                                  ║
║       ▼                                                                  ║
║   playwright.config.ts ──────────────────────────────────────────────── ║
║       │                                                                  ║
║       ├──▶ project: chromium ──▶  UI Tests (POM)                       ║
║       │         │                      │                                ║
║       │         │              pagefixtures.ts                          ║
║       │         │                      │                                ║
║       │         │         ┌────────────┴──────────────┐                ║
║       │         │     LoginPage    HomePage    SignupPage               ║
║       │         │     (extends BasePage)                                ║
║       │         │                      │                                ║
║       │         │         testData (CSV/JSON/Faker)                     ║
║       │         │                                                       ║
║       ├──▶ project: api ────▶  API Tests (POM)                         ║
║       │         │                      │                                ║
║       │         │              apifixtures.ts                           ║
║       │         │                      │                                ║
║       │         │         ┌────────────┴──────────────┐                ║
║       │         │    ApiContext  BookingApi  GoRestUserApi  BillPayApi  ║
║       │         │                                                       ║
║       └──▶ project: bdd-chromium ──▶  BDD Tests                        ║
║                     cart.feature + cartSteps.ts                         ║
║                                                                         ║
║                             ▼                                           ║
║   ┌─────────────────────────────────────────────────────────────────┐  ║
║   │                      REPORTERS                                  │  ║
║   │  • Allure (allure-results/ ──▶ allure-report/)                  │  ║
║   │  • HTML   (reports/html-report/)                                │  ║
║   │  • List   (console output)                                      │  ║
║   │  • JiraReporter (auto-creates Jira bugs on failure)             │  ║
║   └─────────────────────────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

## 📦 Project Structure Summary

```
Test-Automation-e2e-Framework/
│
├── playwright.config.ts          ← Multi-project config (UI, API, BDD, Security)
├── config/
│   └── .env.dev / .env.prod      ← Environment-based BASE_URL config
│
├── src/
│   ├── pages/                    ← UI Page Object Model
│   │   ├── BasePage.ts           ← Abstract base (holds page reference)
│   │   ├── LoginPage.ts          ← Login + Signup locators & actions
│   │   ├── HomePage.ts           ← Home page locators & actions
│   │   ├── SignupPage.ts         ← Account creation form actions
│   │   └── CartPage.ts           ← Cart page (BDD)
│   │
│   ├── api/                      ← API Object Model
│   │   ├── ApiContext.ts         ← APIRequestContext factory
│   │   ├── BookingApi.ts         ← Restful-Booker CRUD operations
│   │   ├── GoRestUserApi.ts      ← GoRest user CRUD operations
│   │   └── BillPayApi.ts         ← BillPay biller operations
│   │
│   ├── fixtures/
│   │   ├── pagefixtures.ts       ← Injects page objects into UI tests
│   │   └── apifixtures.ts        ← Injects API clients into API tests
│   │
│   ├── utils/
│   │   ├── CsvHelper.ts          ← CSV test data reader
│   │   ├── JsonHelper.ts         ← JSON test data reader
│   │   ├── JsonHelperApi.ts      ← JSON helper for API payloads
│   │   ├── fakerUtil.ts          ← Random data generator (Faker.js)
│   │   └── JiraReporter.ts       ← Auto Jira bug reporter on failure
│   │
│   └── testdata/
│       ├── loginData.csv         ← Login test data (CSV)
│       └── SignupUtils.json      ← Signup form test data (JSON)
│
├── tests/
│   ├── loginPage.spec.ts         ← Login page UI tests
│   ├── homepage.spec.ts          ← Home page UI tests
│   ├── signupPage.spec.ts        ← Signup UI tests (JSON-driven loop)
│   ├── homepagefix.spec.ts       ← Home page tests using fixtures
│   ├── loginpagefix.spec.ts      ← Login tests using fixtures
│   └── apiTests/
│       ├── user.spec.ts          ← GoRest user API tests (raw)
│       ├── Restful-Booking/      ← Booking API tests via BookingApi POM
│       │   ├── GetRequest.spec.ts
│       │   ├── PostAddBooking.spec.ts
│       │   ├── PostAddBookingFaker.spec.ts
│       │   ├── PostWithDynamicJSON.spec.ts
│       │   └── PutRequest.spec.ts
│       └── billpay/
│           ├── auth.spec.ts
│           └── billers.spec.ts
│
├── features/                     ← BDD Gherkin Tests
│   ├── cart.feature
│   ├── fixtures.ts
│   └── steps/
│       └── cartSteps.ts
│
├── security/                     ← Security test project
├── performance-tests/            ← Performance test project
└── Jenkinsfile                   ← CI/CD pipeline definition
```

---

## 🔑 Key POM Design Principles Applied

| Principle | UI Implementation | API Implementation |
|---|---|---|
| **Encapsulation** | Locators are `private readonly` in each Page class | Request methods encapsulated in API class per service |
| **Inheritance** | All pages extend `BasePage` (holds `page: Page`) | `ApiContext` factory injected via constructor |
| **Single Responsibility** | Each page class owns only its page's locators & actions | Each API class owns only one service's endpoints |
| **Reusability** | Page fixtures expose page objects to any spec file | `apifixtures.ts` injects `BookingApi` automatically |
| **Data Separation** | CSV/JSON/Faker data is separate from test logic | JSON payloads & Faker data separate from API calls |
| **DRY** | `beforeEach` + fixtures eliminate repeated setup code | `ApiContext.create()` centralizes context creation |
| **Cleanup** | Playwright handles browser teardown | `ctx.dispose()` called in fixture teardown |
