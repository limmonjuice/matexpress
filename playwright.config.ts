import { defineConfig, devices } from "@playwright/test";
import { DB_SWITCH_FILE, REAL_STORE_PORT, STORE_PORT, SWITCHED_PORT } from "./e2e/support/servers";

// Real browsers against a production build: `npm run build`, then `npm run test:e2e`.
// These tests place real orders, then remove them and put the stock back. Point DATABASE_URL at a development
// or test database, never production.

const start = (port: number, env: Record<string, string>) => ({
  command: `npx next start -p ${port}`,
  url: `http://localhost:${port}/help/delivery`,
  env: { BETTER_AUTH_URL: `http://localhost:${port}`, ...env },
  reuseExistingServer: false,
  stdout: "ignore" as const,
  stderr: "ignore" as const,
});

// Locally, the Edge that Windows already has, so nothing extra to download. Set E2E_CHANNEL=chrome elsewhere.
const CHROME = process.env.CI ? {} : { channel: process.env.E2E_CHANNEL ?? "msedge" };

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  // One at a time: the tests share one database, and the order tests count its stock.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${STORE_PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], ...CHROME } },
    { name: "phone", use: { ...devices["Pixel 7"], ...CHROME }, testMatch: ["**/browse.spec.ts", "**/accessibility.spec.ts"] },
    // Safari's engine needs its own download (`npx playwright install webkit`), so it runs on request and on GitHub.
    // Browsing only: over plain http it refuses the order cookie, which is marked Secure in a production build.
    ...(process.env.CI || process.env.E2E_WEBKIT ? [{ name: "iphone", use: devices["iPhone 15"], testMatch: "**/browse.spec.ts" }] : []),
  ],
  webServer: [
    start(STORE_PORT, { SITE_MODE: "demo" }),
    // The same build with the demo switch off at run time, for what buyers of the real store must never get.
    start(REAL_STORE_PORT, { SITE_MODE: "" }),
    // The database on this one can be switched off, or made to hang, while it runs. See support/db-switch.cjs.
    start(SWITCHED_PORT, { SITE_MODE: "demo", DB_SWITCH_FILE, NODE_OPTIONS: "--require ./e2e/support/db-switch.cjs" }),
  ],
});
