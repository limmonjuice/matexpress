import { writeFileSync } from "node:fs";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { signProof } from "../src/lib/orders/proof";
import { authSecret } from "./support/db";
import { DB_SWITCH_FILE, SWITCHED_STORE } from "./support/servers";
import { alertOn, fillCart, fillDeliveryDetails, STORE_PAGES } from "./support/store";

// One server's database is switched off or made to hang while it runs. Nothing reaches the real database while it's off.
test.use({ baseURL: SWITCHED_STORE });

async function setDatabase(state: "down" | "hang" | "up") {
  writeFileSync(DB_SWITCH_FILE, JSON.stringify(state === "up" ? {} : { db: state }));
  await new Promise((resolve) => setTimeout(resolve, 300));
}

test.afterEach(() => setDatabase("up"));

const errorScreen = (page: Page) => page.getByRole("heading", { name: "Something went wrong on our side" });
const CAN_T_REACH = "We couldn't reach the store. Check your connection and try again.";

/** A browser that placed this order, as if it had. */
const proveOrder = (context: BrowserContext, number: string) =>
  context.addCookies([{ name: "mx_orders", value: signProof([number], authSecret()), url: SWITCHED_STORE, httpOnly: true, sameSite: "Lax" }]);

test.describe("with the database down", () => {
  test.beforeEach(() => setDatabase("down"));

  test("the whole store can still be browsed", async ({ page }) => {
    test.setTimeout(120_000);
    for (const path of [...STORE_PAGES, "/categories/cement-concrete?sort=price-asc", "/products/deformed-rebar"]) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(200);
      await expect(page.locator("h1").first(), path).toBeVisible();
      await expect(errorScreen(page), path).toHaveCount(0);
    }
    const index = await page.request.get("/api/search-index");
    expect(index.status()).toBe(200);
    expect((await index.json()).length).toBeGreaterThan(0);
  });

  test("placing an order says so, and keeps the cart and the form", async ({ page }) => {
    await fillCart(page);
    await page.goto("/checkout");
    await page.waitForLoadState("networkidle");
    await fillDeliveryDetails(page);
    await page.getByRole("button", { name: /^Place order/ }).first().click();
    await expect(alertOn(page)).toContainText("Nothing was charged twice");
    await expect(page).toHaveURL(/\/checkout/);
    await expect(page.getByLabel("Who should the driver ask for?")).toHaveValue("Test Buyer");
    await expect(page.getByRole("button", { name: /^Place order/ }).first()).toBeEnabled();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("matexpress-cart")!).state.lines.length)).toBe(2);
  });

  test("tracking an order says so, and keeps what was typed", async ({ page }) => {
    await page.goto("/track");
    await page.waitForLoadState("networkidle");
    await page.getByLabel("Order number").fill("MX-7K3F9QPT");
    await page.getByLabel("Mobile number on the order").fill("0917 000 1234");
    await page.getByRole("button", { name: "Track this order" }).click();
    await expect(alertOn(page)).toHaveText(CAN_T_REACH);
    await expect(page.getByLabel("Order number")).toHaveValue("MX-7K3F9QPT");
    await expect(errorScreen(page)).toHaveCount(0);
  });

  test("applying to sell says so, and keeps what was typed", async ({ page }) => {
    await page.goto("/sell");
    await page.waitForLoadState("networkidle");
    await page.getByLabel("Store name").fill("Test Hardware");
    await page.getByLabel("Your name").fill("Test Owner");
    await page.getByLabel("Mobile number").fill("0917 000 1234");
    await page.getByLabel("City").fill("Antipolo");
    await page.getByLabel("What does your store sell?").fill("Cement");
    await page.getByRole("button", { name: "Apply to sell" }).click();
    await expect(alertOn(page)).toHaveText(CAN_T_REACH);
    await expect(page.getByLabel("Store name")).toHaveValue("Test Hardware");
  });

  test("signing in says so, and keeps the email", async ({ page }) => {
    await page.goto("/account");
    await page.waitForLoadState("networkidle");
    await page.locator("#hm-auth-email").fill("nobody@example.com");
    await page.locator("#hm-auth-password").fill("not-a-real-password-77");
    await page.locator("form:has(#hm-auth-email) button[type=submit]").click();
    await expect(alertOn(page)).toHaveText("Something went wrong. Please try again.");
    await expect(page.locator("#hm-auth-email")).toHaveValue("nobody@example.com");
  });

  test("an order's page keeps its number on screen, and Try again works once the database is back", async ({ page, context }) => {
    await proveOrder(context, "MX-DOWNTEST");
    await page.goto("/orders/MX-DOWNTEST");
    await expect(errorScreen(page)).toBeVisible();
    await expect(page.locator(".hm-notfound p")).toContainText("MX-DOWNTEST");

    await setDatabase("up");
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(errorScreen(page)).toBeHidden();
    await expect(page.locator("#hm-track-number")).toBeVisible();
  });
});

test.describe("with the database hanging", () => {
  test.beforeEach(() => setDatabase("hang"));

  test("an order's page gives up with the same message, not an endless wait", async ({ page, context }) => {
    await proveOrder(context, "MX-DOWNTEST");
    const started = Date.now();
    await page.goto("/orders/MX-DOWNTEST", { timeout: 30_000 });
    await expect(errorScreen(page)).toBeVisible({ timeout: 25_000 });
    expect(Date.now() - started).toBeLessThan(25_000);
    await expect(page.locator(".hm-notfound p")).toContainText("MX-DOWNTEST");
  });

  test("placing an order gives up with the same message, and can be tried again", async ({ page }) => {
    await fillCart(page);
    await page.goto("/checkout");
    await page.waitForLoadState("networkidle");
    await fillDeliveryDetails(page);
    await page.getByRole("button", { name: /^Place order/ }).first().click();
    await expect(alertOn(page)).toContainText("Nothing was charged twice", { timeout: 25_000 });
    await expect(page.getByRole("button", { name: /^Place order/ }).first()).toBeEnabled();
  });

  test("browsing doesn't notice", async ({ page }) => {
    const started = Date.now();
    await page.goto("/categories/cement-concrete");
    await expect(page.locator("a[href^='/products/']").first()).toBeVisible();
    expect(Date.now() - started).toBeLessThan(5_000);
  });
});
