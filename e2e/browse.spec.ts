import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { expect, test } from "@playwright/test";
import { fillCart, STORE_PAGES } from "./support/store";

for (const path of STORE_PAGES) {
  test(`${path} opens clean`, async ({ page }) => {
    const problems: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") problems.push(message.text());
    });
    page.on("pageerror", (error) => problems.push(error.message));

    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
    await page.waitForLoadState("networkidle");

    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), "the page scrolls sideways").toBeLessThanOrEqual(0);
    expect(problems).toEqual([]);
  });
}

test("a public demo says so, and stays out of search engines", async ({ page }) => {
  const response = await page.goto("/products/portland-cement");
  expect(response?.headers()["x-robots-tag"]).toBe("noindex, nofollow");
  await expect(page.getByRole("complementary", { name: "About this site" })).toContainText("no money is taken");
});

test("an address that isn't a page gets the real 404", async ({ page }) => {
  const response = await page.goto("/not-a-page");
  expect(response?.status()).toBe(404);
  await expect(page.locator("h1")).toHaveText("This road is closed");
});

test("searching finds things", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const box = page.getByLabel("Search materials").locator("visible=true").first();
  await box.fill("rebar");
  await box.press("Enter");
  await page.waitForURL(/\/search\?q=rebar/);
  await expect(page.getByRole("link", { name: /Deformed Rebar/ }).locator("visible=true").first()).toBeVisible();
});

test("sorting a list keeps it in the address, so it can be shared", async ({ page }) => {
  await page.goto("/categories/cement-concrete");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Sort by").selectOption({ index: 1 });
  await page.waitForURL(/sort=/);
  await expect(page.locator("a[href^='/products/']").first()).toBeVisible();
});

test("a product goes into the cart and through to checkout", async ({ page }) => {
  await page.goto("/products/portland-cement");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Add to cart" }).locator("visible=true").first().click();

  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: "Your truck is empty" })).toBeHidden();
  await expect(page.getByRole("link", { name: /Portland Cement Type I/ }).locator("visible=true").first()).toBeVisible();

  await page.getByRole("link", { name: "Check out" }).locator("visible=true").first().click();
  await page.waitForURL(/\/checkout/);
  await expect(page.getByRole("button", { name: /^Place order/ }).locator("visible=true").first()).toBeVisible();
});

test("checkout says what's missing instead of placing the order", async ({ page }) => {
  await fillCart(page);
  await page.goto("/checkout");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /^Place order/ }).locator("visible=true").first().click();
  await expect(page.locator(".hm-co-error").first()).toBeVisible();
  await expect(page).toHaveURL(/\/checkout/);
});

test("no internal link is broken", async ({ baseURL, isMobile }) => {
  test.skip(isMobile, "One size is enough: the server's answer doesn't change.");
  test.setTimeout(180_000);
  await promisify(execFile)(process.execPath, ["scripts/check-links.mjs", baseURL!]);
});
