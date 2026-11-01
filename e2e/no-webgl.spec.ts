import { expect, test } from "@playwright/test";

// Some phones and locked-down computers can't draw 3D. The story has to read fine without the truck.
test.use({ launchOptions: { args: ["--disable-3d-apis"] } });

test("the story page works with no WebGL", async ({ page }) => {
  await page.goto("/how-it-works");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("h1").first()).toHaveText(/The right materials/);
  await expect(page.getByRole("heading", { name: "Something went wrong on our side" })).toHaveCount(0);
  await expect(page.getByText(/Delivered to your site/).first()).toBeAttached();
  await expect(page.locator("canvas")).toHaveCount(0);
});
