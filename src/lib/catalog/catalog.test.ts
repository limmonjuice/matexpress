import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { bestOffer, toCard } from "./card";
import { categories, featuredCategories } from "./data/categories";
import { jobs } from "./data/jobs";
import { products, productBySlug } from "./data/products";
import { sellerBySlug, sellerInitials, sellers } from "./data/sellers";
import { bestSellers, heroProducts, newArrivals } from "./home-lists";
import { flashDeal } from "./home-content";

const offers = products.flatMap((p) => p.variants.flatMap((v) => v.offers.map((o) => ({ product: p, variant: v, offer: o }))));
const inPublic = (src: string) => existsSync(path.join(process.cwd(), "public", src));

describe("the sample catalog", () => {
  test("has the planned size", () => {
    expect(products).toHaveLength(48);
    expect(sellers).toHaveLength(6);
    expect(new Set(products.map((p) => p.slug)).size).toBe(48);
  });

  test("every offer points at a real seller", () => {
    expect(offers.filter(({ offer }) => !sellerBySlug(offer.sellerSlug))).toEqual([]);
  });

  test("every image path exists in public/", () => {
    const paths = [...products.flatMap((p) => p.images.map((i) => i.src)), ...categories.map((c) => c.image), flashDeal.image, "/home/hero-contractor.webp", "/home/promos/sell.webp"];
    expect(paths.filter((src) => !inPublic(src))).toEqual([]);
  });

  test("every product has alt text on its pictures", () => {
    expect(products.flatMap((p) => p.images).filter((i) => !i.alt)).toEqual([]);
  });

  test("every category has at least 2 products and every subcategory at least 1", () => {
    for (const category of categories) {
      const inCategory = products.filter((p) => p.categorySlug === category.slug);
      expect(inCategory.length, category.slug).toBeGreaterThanOrEqual(2);
      for (const sub of category.subcategories) {
        expect(inCategory.some((p) => p.subcategory === sub), `${category.slug}: ${sub}`).toBe(true);
      }
    }
  });

  test("every product's subcategory is listed on its category", () => {
    for (const product of products) {
      const category = categories.find((c) => c.slug === product.categorySlug);
      expect(category?.subcategories, product.slug).toContain(product.subcategory);
    }
  });

  test("a minimum order never exceeds an in-stock offer's stock", () => {
    const bad = offers.filter(({ variant, offer }) => offer.stock > 0 && (variant.minQty ?? 1) > offer.stock);
    expect(bad).toEqual([]);
  });

  test("prices are positive and tiers only ever go down", () => {
    for (const { offer, product } of offers) {
      expect(offer.price, product.slug).toBeGreaterThan(0);
      let last = offer.price;
      for (const tier of offer.tiers ?? []) {
        expect(tier.price, product.slug).toBeLessThan(last);
        last = tier.price;
      }
      if (offer.listPrice) expect(offer.listPrice, product.slug).toBeGreaterThan(offer.price);
    }
  });

  test("every size has a weight, so the truck can be worked out", () => {
    expect(products.flatMap((p) => p.variants).filter((v) => !(v.weightKg > 0))).toEqual([]);
  });

  test("related products and job lists point at real products", () => {
    for (const product of products) (product.related ?? []).forEach((slug) => expect(productBySlug(slug), `${product.slug} -> ${slug}`).toBeDefined());
    for (const job of jobs) job.products.forEach((slug) => expect(productBySlug(slug), `${job.slug} -> ${slug}`).toBeDefined());
  });

  test("the home page keeps its lists and its 8 tiles", () => {
    expect(heroProducts).toHaveLength(3);
    expect(newArrivals).toHaveLength(6);
    expect(bestSellers).toHaveLength(3);
    expect(featuredCategories).toHaveLength(8);
    expect(featuredCategories.length / categories.length).toBeGreaterThanOrEqual(0.4);
  });

  test("menu groups stay at about 10 links or fewer", () => {
    categories.forEach((c) => expect(c.subcategories.length).toBeLessThanOrEqual(10));
  });
});

describe("bestOffer and toCard", () => {
  const cement = productBySlug("portland-cement")!;
  const rebar = productBySlug("deformed-rebar")!;

  test("picks the cheapest in-stock offer and breaks ties on lead time", () => {
    const pick = bestOffer([
      { sellerSlug: "a", price: 100, leadDays: 3, stock: 5 },
      { sellerSlug: "b", price: 100, leadDays: 1, stock: 5 },
      { sellerSlug: "c", price: 90, leadDays: 0, stock: 0 },
    ]);
    expect(pick.sellerSlug).toBe("b");
  });

  test("a card leads with the usual size and the cheapest seller", () => {
    expect(toCard(rebar)).toMatchObject({ price: 232, seller: { name: "Tibay Steel" }, sizeCount: 4, sellerCount: 4, href: "/products/deformed-rebar" });
  });

  test("a card with a seller shows that seller's price, not the cheapest", () => {
    expect(toCard(cement, { sellerSlug: "bakal-supply" })).toMatchObject({ price: 265, seller: { slug: "bakal-supply" } });
  });

  test("a card with a size shows that size's spec, price and link", () => {
    expect(toCard(rebar, { variantId: "16-mm" })).toMatchObject({ price: 420, href: "/products/deformed-rebar?size=16-mm" });
    expect(toCard(rebar, { variantId: "16-mm" }).spec).toContain("16 mm");
  });

  test("a product out of stock everywhere is out of stock and keeps a price", () => {
    const soldOut = { ...cement, variants: cement.variants.map((v) => ({ ...v, offers: v.offers.map((o) => ({ ...o, stock: 0 })) })) };
    const card = toCard(soldOut);
    expect(card.inStock).toBe(false);
    expect(card.price).toBe(252);
  });

  test("cards work out the price per unit", () => {
    expect(toCard(cement).unitPrice).toBe("₱6.30/kg");
    expect(toCard(productBySlug("hollow-block")!).unitPrice).toBeUndefined();
  });

  test("a line id is product, size and seller", () => {
    expect(toCard(rebar).line.id).toBe("deformed-rebar:12-mm:tibay-steel");
  });

  test("a product with one size doesn't label it on the cart line", () => {
    expect(toCard(cement).line.variantLabel).toBeUndefined();
    expect(toCard(rebar).line.variantLabel).toBe("12 mm");
  });
});

describe("sellerInitials", () => {
  test("takes two letters", () => {
    expect(sellerInitials("Dalisay Hardware")).toBe("DH");
  });
});
