import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { fillCart, STORE_PAGES } from "./support/store";

// WCAG 2.2 level AA, as far as a machine can tell. Axe finds roughly a third to a half of real problems:
// it can't judge whether a label makes sense, or how a form feels with a screen reader.
const LEVEL_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function problems(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(LEVEL_AA)
    // The footer's giant faded wordmark: a logotype and pure decoration, which WCAG exempts from contrast. Hidden from screen readers too.
    .exclude(".hm-footer-mark")
    .analyze();
  return violations.map((v) => ({
    rule: v.id,
    impact: v.impact,
    count: v.nodes.length,
    where: v.nodes.slice(0, 4).map((node) => node.target.join(" ")),
  }));
}

/** Long enough for a page's entrance or a drawer's slide to finish, so contrast is measured on the final colours. */
const settle = (page: Page) => page.waitForTimeout(1200);

for (const path of STORE_PAGES) {
  test(`${path} meets WCAG 2.2 AA`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await settle(page);
    expect(await problems(page)).toEqual([]);
  });
}

test("the 404 page meets WCAG 2.2 AA", async ({ page }) => {
  await page.goto("/not-a-page");
  await settle(page);
  expect(await problems(page)).toEqual([]);
});

for (const path of ["/cart", "/checkout"]) {
  test(`${path} with things in it meets WCAG 2.2 AA`, async ({ page }) => {
    await fillCart(page);
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await settle(page);
    expect(await problems(page)).toEqual([]);
  });
}

test("the open cart meets WCAG 2.2 AA", async ({ page }) => {
  await fillCart(page);
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.locator(".hm-cart-btn").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await settle(page);
  expect(await problems(page)).toEqual([]);
});

test("the open search box meets WCAG 2.2 AA", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Search materials").first().fill("cem");
  await expect(page.locator(".hm-search-results").first()).toBeVisible();
  await settle(page);
  expect(await problems(page)).toEqual([]);
});

test("the category menu meets WCAG 2.2 AA", async ({ page, isMobile }) => {
  test.skip(isMobile, "Phones use the menu drawer instead.");
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "All categories" }).click();
  await settle(page);
  expect(await problems(page)).toEqual([]);
});

test("the phone menu meets WCAG 2.2 AA", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Only phones have it.");
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible();
  await settle(page);
  expect(await problems(page)).toEqual([]);
});

test("the phone filters meet WCAG 2.2 AA", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Only phones have the drawer.");
  await page.goto("/products");
  await page.waitForLoadState("networkidle");
  await page.locator(".hm-filter-btn").click();
  await expect(page.getByRole("dialog", { name: "Filters" })).toBeVisible();
  await settle(page);
  expect(await problems(page)).toEqual([]);
});

test("checkout's error messages meet WCAG 2.2 AA", async ({ page }) => {
  await fillCart(page);
  await page.goto("/checkout");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /^Place order/ }).first().click();
  await expect(page.locator(".hm-co-error").first()).toBeVisible();
  await settle(page);
  expect(await problems(page)).toEqual([]);
});

test("the create account form meets WCAG 2.2 AA", async ({ page }) => {
  await page.goto("/account");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByLabel("Your name")).toBeVisible();
  expect(await problems(page)).toEqual([]);
});

test.describe("with a keyboard", () => {
  test.skip(({ isMobile }) => isMobile, "Phones have no Tab key.");

  test("the first stop skips the header and lands in the page", async ({ page }) => {
    await page.goto("/products");
    await page.waitForLoadState("networkidle");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();

    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => !!document.activeElement?.closest("main"))).toBe(true);
  });

  /** Every stop along the way: it can be seen, it's marked, and nothing sits on top of it. */
  async function walk(page: Page, stops: number, key: "Tab" | "Shift+Tab" = "Tab") {
    const trouble: string[] = [];
    for (let i = 0; i < stops; i++) {
      await page.keyboard.press(key);
      const issue = await page.evaluate(async () => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        // The browser scrolls to whatever takes focus, and smooth scrolling can carry that on for a moment.
        for (let last = NaN, still = 0, tries = 0; still < 3 && tries < 60; tries++) {
          await new Promise(requestAnimationFrame);
          const now = el.getBoundingClientRect().top;
          still = now === last ? still + 1 : 0;
          last = now;
        }
        const name = `${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 30)}"`;
        const marked = [getComputedStyle(el), getComputedStyle(el, "::after"), el.parentElement ? getComputedStyle(el.parentElement) : null].some(
          (style) => style && ((style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0) || style.boxShadow !== "none"),
        );
        if (!marked) return `${name}: no focus mark`;
        const box = el.getBoundingClientRect();
        const x = Math.min(innerWidth - 1, Math.max(0, box.left + box.width / 2));
        const y = Math.min(innerHeight - 1, Math.max(0, box.top + box.height / 2));
        const top = document.elementFromPoint(x, y);
        // A custom checkbox or colour swatch draws over its hidden input, inside the same label.
        const sameControl = top && (el === top || el.contains(top) || top.contains(el) || el.closest("label")?.contains(top));
        if (!sameControl) return `${name}: covered by ${top?.tagName.toLowerCase()}.${top?.className}`;
        return null;
      });
      if (issue) trouble.push(issue);
    }
    return [...new Set(trouble)];
  }

  for (const path of ["/", "/products", "/products/portland-cement", "/account", "/sell"]) {
    test(`on ${path} you can always see where you are`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      expect(await walk(page, 40)).toEqual([]);
      expect(await walk(page, 12, "Shift+Tab")).toEqual([]);
    });
  }

  test("on checkout you can always see where you are", async ({ page }) => {
    await fillCart(page);
    await page.goto("/checkout");
    await page.waitForLoadState("networkidle");
    expect(await walk(page, 40)).toEqual([]);
    expect(await walk(page, 12, "Shift+Tab")).toEqual([]);
  });

  test("the cart drawer holds focus, and Escape closes it", async ({ page }) => {
    await fillCart(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.locator(".hm-cart-btn").focus();
    await page.keyboard.press("Enter");
    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(page.locator(".hm-cart-btn")).toBeFocused();
  });
});
