import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import {
  bestSellers,
  categories,
  featuredCategories,
  flashDeal,
  getProduct,
  heroProducts,
  newArrivals,
  products,
} from "./home-content";

describe("home content", () => {
  test("every featured list points at real products", () => {
    [...heroProducts, ...newArrivals, ...bestSellers].forEach((p) => expect(getProduct(p.slug)).toBeDefined());
    expect(heroProducts).toHaveLength(3);
    expect(newArrivals).toHaveLength(6);
    expect(bestSellers).toHaveLength(3);
  });

  test("the home page shows at least 40% of categories", () => {
    expect(featuredCategories).toHaveLength(8);
    expect(featuredCategories.length / categories.length).toBeGreaterThanOrEqual(0.4);
  });

  test("menu groups stay at about 10 links or fewer", () => {
    categories.forEach((c) => expect(c.subcategories.length).toBeLessThanOrEqual(10));
  });

  test("offers are cheapest first and match the from price", () => {
    products
      .filter((p) => p.offers)
      .forEach((p) => {
        const prices = p.offers!.map((o) => o.price);
        expect(prices).toEqual([...prices].sort((a, b) => a - b));
        expect(prices[0]).toBe(p.priceFrom);
      });
  });

  test("every picture exists in public/", () => {
    const paths = [
      ...products.map((p) => p.image),
      ...featuredCategories.map((c) => c.image!),
      flashDeal.image,
      "/home/hero-contractor.webp",
      "/home/promos/sell.webp",
    ];
    const missing = paths.filter((p) => !existsSync(path.join(process.cwd(), "public", p)));
    expect(missing).toEqual([]);
  });
});
