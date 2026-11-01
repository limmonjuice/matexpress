import type { Page } from "@playwright/test";

/** One page of each kind. */
export const STORE_PAGES = [
  "/",
  "/categories",
  "/categories/cement-concrete",
  "/products",
  "/products/portland-cement",
  "/deals",
  "/search?q=cement",
  "/sellers/tibay-steel",
  "/jobs/pouring-a-slab",
  "/help/delivery",
  "/help/returns",
  "/help/contact",
  "/sell",
  "/sell/how-it-works",
  "/sell/support",
  "/how-it-works",
  "/track",
  "/cart",
  "/saved",
  "/checkout",
  "/account",
];

/** Two real lines, small enough that checkout doesn't also ask about truck access. */
export const CART_LINES = [
  {
    id: "deformed-rebar:16-mm:bakal-supply",
    slug: "deformed-rebar",
    variantId: "16-mm",
    variantLabel: "16 mm",
    sellerSlug: "bakal-supply",
    seller: "Bakal Supply",
    name: "Deformed Rebar",
    unit: "length",
    categorySlug: "steel-rebar",
    price: 428,
    tiers: [
      { from: 50, price: 404 },
      { from: 200, price: 388 },
    ],
    stock: 1400,
    leadDays: 1,
    weightKg: 9.47,
    image: "/home/products/deformed-rebar-12mm.webp",
    quantity: 2,
  },
  {
    id: "portland-cement:40-kg:dalisay-hardware",
    slug: "portland-cement",
    variantId: "40-kg",
    sellerSlug: "dalisay-hardware",
    seller: "Dalisay Hardware",
    name: "Portland Cement Type I",
    unit: "bag",
    categorySlug: "cement-concrete",
    price: 252,
    tiers: [
      { from: 50, price: 246 },
      { from: 200, price: 240 },
    ],
    stock: 640,
    leadDays: 0,
    weightKg: 40,
    image: "/home/products/portland-cement.webp",
    quantity: 2,
  },
];

/** Puts these lines in the browser's saved cart before the first page loads, and only then, so a cleared cart stays cleared. */
export async function fillCart(page: Page, lines = CART_LINES) {
  const cart = JSON.stringify({ state: { lines }, version: 2 });
  await page.addInitScript((saved) => {
    if (sessionStorage.getItem("e2e-cart-filled")) return;
    sessionStorage.setItem("e2e-cart-filled", "1");
    localStorage.setItem("matexpress-cart", saved);
  }, cart);
}

/** The store's own message. Next's route announcer is always on the page with this role too, and always empty. */
export const alertOn = (page: Page) => page.locator('[role="alert"]:not(#__next-route-announcer__)');

/** The delivery details, as a buyer would type them. */
export async function fillDeliveryDetails(page: Page) {
  await page.getByLabel("Who should the driver ask for?").fill("Test Buyer");
  await page.getByLabel("Mobile number").fill("0917 000 1234");
  await page.getByLabel("Street").fill("12 Test Street");
  await page.getByLabel("Barangay").fill("San Roque, Antipolo");
}
