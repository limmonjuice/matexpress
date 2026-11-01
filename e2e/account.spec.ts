import { randomBytes, randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { sql } from "./support/db";
import { alertOn } from "./support/store";

// A throwaway account with a random password. It deletes itself, and the cleanup catches it if a step fails first.
const email = `e2e-${randomUUID()}@example.com`;
const password = randomBytes(18).toString("base64url");

test.afterAll(async () => {
  await sql`delete from "user" where email = ${email}`;
});

test("an account, from creating it to deleting it", async ({ page }) => {
  test.setTimeout(120_000);

  await test.step("creating one signs you in", async () => {
    await page.goto("/account");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.locator("#hm-auth-name").fill("Test Buyer");
    await page.locator("#hm-auth-email").fill(email);
    await page.locator("#hm-auth-password").fill(password);
    await page.getByRole("button", { name: "Create my account" }).click();
    await expect(page.locator("h1")).toHaveText("Hi, Test");
  });

  await test.step("signing out really signs out", async () => {
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page.locator("h1")).toHaveText("Your account");
    await expect(page.locator("#hm-auth-email")).toBeVisible();
  });

  await test.step("the wrong password gets a plain message, and the right one gets in", async () => {
    await page.waitForLoadState("networkidle");
    await page.locator("#hm-auth-email").fill(email);
    await page.locator("#hm-auth-password").fill(`${password}-wrong`);
    await page.locator("form:has(#hm-auth-email) button[type=submit]").click();
    await expect(alertOn(page)).toHaveText("That email and password don't match.");

    await page.locator("#hm-auth-password").fill(password);
    await page.locator("form:has(#hm-auth-email) button[type=submit]").click();
    await expect(page.locator("h1")).toHaveText("Hi, Test");
  });

  await test.step("deleting it takes the password, and then it's gone", async () => {
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Delete my account" }).click();
    await page.locator("#hm-delete-password").fill(password);
    await page.locator("form:has(#hm-delete-password) button[type=submit]").click();
    await expect(page.locator("#hm-auth-email")).toBeVisible();
    expect(await sql`select id from "user" where email = ${email}`).toEqual([]);
  });
});
