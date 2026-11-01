import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { setStock, sql, stockOf } from "./support/db";
import { REAL_STORE } from "./support/servers";
import { CART_LINES, fillCart, fillDeliveryDetails } from "./support/store";

const [FIRST, SECOND] = CART_LINES;

const buttons = (page: Page) => page.locator(".hm-demo button");
const history = (page: Page) => page.locator(".hm-history li span");
const stage = (page: Page) => page.locator(".hm-track-road").evaluate((road: HTMLElement) => Number(road.style.getPropertyValue("--hm-stage")));

async function press(page: Page, label: string) {
  const button = page.getByRole("button", { name: label, exact: true });
  await button.click();
  await expect(button).toBeHidden();
}

// A real order on the real database. It's deleted at the end and the stock put back exactly.
test("an order, from checkout to delivered", async ({ page, browser }) => {
  test.setTimeout(180_000);
  const before = await Promise.all(CART_LINES.map(stockOf));
  let number: string | undefined;

  try {
    await fillCart(page);
    await page.goto("/checkout");
    await page.waitForLoadState("networkidle");
    await fillDeliveryDetails(page);
    await page.getByRole("button", { name: /^Place order/ }).first().click();
    await page.waitForURL(/\/orders\/MX-[A-Z0-9]{8}/);
    number = new URL(page.url()).pathname.split("/").pop()!;
    await expect(page.locator(".hm-track")).toBeVisible();

    await test.step("stock comes off by exactly what was bought", async () => {
      expect(await Promise.all(CART_LINES.map(stockOf))).toEqual(before.map((stock) => stock - 2));
    });

    await test.step("a new order waits on its sellers, and invents nothing", async () => {
      await expect(buttons(page)).toHaveText([`${FIRST.seller} confirms`, `${SECOND.seller} confirms`], { useInnerText: true });
      expect(await stage(page)).toBe(0.25);
      await expect(page.locator(".hm-track-road li[data-state=now]")).toContainText("0 of 2");
      await expect(history(page)).toHaveCount(1);
    });

    await test.step("each seller confirming shows straight away, and the truck can't go until both have", async () => {
      await press(page, `${FIRST.seller} confirms`);
      await expect(page.locator(".hm-track-road li[data-state=now]")).toContainText("1 of 2");
      await expect(history(page).first()).toHaveText(`${FIRST.seller} confirmed your items`);
      await expect(buttons(page)).toHaveText([`${SECOND.seller} confirms`, "Start over"], { useInnerText: true });

      await press(page, `${SECOND.seller} confirms`);
      await expect(buttons(page)).toHaveText(["Truck starts collecting", "Start over"], { useInnerText: true });
    });

    await test.step("the truck collects, leaves and delivers", async () => {
      await press(page, "Truck starts collecting");
      await expect(history(page).first()).toHaveText("Our truck is collecting from the sellers");
      expect(await stage(page)).toBe(0.5);

      await press(page, "Truck leaves for the site");
      await expect(history(page).first()).toHaveText("Loaded and on the way to your site");
      expect(await stage(page)).toBe(0.75);

      await press(page, "Truck delivers");
      await expect(page.locator(".hm-track-when")).toHaveText("Delivered");
      expect(await stage(page)).toBe(1);
      await expect(history(page)).toHaveCount(6);
      await expect(buttons(page)).toHaveText(["Start over"], { useInnerText: true });
    });

    await test.step("every step is a real row, still there after a reload", async () => {
      const rows = await sql`select e.type from order_events e join orders o on o.id = e.order_id where o.number = ${number!}`;
      expect(rows).toHaveLength(6);
      await page.reload();
      await expect(page.locator(".hm-track-when")).toHaveText("Delivered");
    });

    await test.step("the order page meets WCAG 2.2 AA, wide and on a phone", async () => {
      for (const size of [
        { width: 1280, height: 900 },
        { width: 390, height: 844 },
      ]) {
        await page.setViewportSize(size);
        await page.waitForTimeout(1200);
        const { violations } = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .exclude(".hm-footer-mark")
          .analyze();
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((node) => node.target.join(" ")).join(", ")}`)).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
      }
      await page.setViewportSize({ width: 1280, height: 900 });
    });

    await test.step("Start over goes back to just placed", async () => {
      await press(page, "Start over");
      await expect(history(page)).toHaveCount(1);
      await expect(buttons(page)).toHaveCount(2);
      const rows = await sql`select e.type from order_events e join orders o on o.id = e.order_id where o.number = ${number!}`;
      expect(rows.map((row) => row.type)).toEqual(["placed"]);
    });

    await test.step("with the demo switch off, the buyer sees the order and no controls", async () => {
      await page.goto(`${REAL_STORE}/orders/${number}`);
      await expect(page.locator(".hm-track")).toBeVisible();
      await expect(page.locator(".hm-demo")).toHaveCount(0);
    });

    await test.step("a stranger gets the track form, no controls and none of the order", async () => {
      const context = await browser.newContext();
      const stranger = await context.newPage();
      await stranger.goto(`/orders/${number}`);
      await expect(stranger.locator("#hm-track-number")).toBeVisible();
      await expect(stranger.locator(".hm-demo")).toHaveCount(0);
      await expect(stranger.locator("body")).not.toContainText("Test Buyer");
      await context.close();
    });
  } finally {
    if (number) await sql`delete from orders where number = ${number}`;
    await Promise.all(CART_LINES.map((line, i) => setStock(line, before[i])));
  }
});
