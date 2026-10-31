import { describe, expect, test } from "vitest";
import { products } from "./data/products";
import { BATCH, listingHref, parseListingParams, queryProducts, sellerFacts } from "./listing";

const params = (raw = {}, defaultSort: "best" | "relevance" = "best") => parseListingParams(raw, { defaultSort });
const steel = { categorySlug: "steel-rebar" };
const facet = (result: ReturnType<typeof queryProducts>, key: string) => result.facets.find((f) => f.key === key);

describe("parseListingParams", () => {
  test("reads repeated values and keeps the query", () => {
    const parsed = params({ size: ["16 mm", "20 mm"], sort: "price-asc", show: "24", q: "bakal" });
    expect(parsed.filters.size).toEqual(["16 mm", "20 mm"]);
    expect(parsed.sort).toBe("price-asc");
    expect(parsed.show).toBe(24);
    expect(parsed.extra).toEqual({ q: "bakal" });
  });

  test("a sort or filter named after something every object has is ignored", () => {
    for (const sort of ["__proto__", "constructor", "toString"]) {
      expect(params({ sort }).sort).toBe("best");
      expect(() => queryProducts(products, steel, params({ sort }))).not.toThrow();
    }
    expect(() => queryProducts(products, steel, params({ constructor: "x", toString: "y" }))).not.toThrow();
    expect(() => queryProducts(products, steel, parseListingParams(JSON.parse('{"__proto__":"x"}')))).not.toThrow();
  });

  test("bad sort and show fall back", () => {
    const parsed = params({ sort: "nonsense", show: "abc" });
    expect(parsed.sort).toBe("best");
    expect(parsed.show).toBe(BATCH);
    expect(params({ show: "-5" }).show).toBe(BATCH);
    expect(params({ show: "1.5" }).show).toBe(BATCH);
  });
});

describe("queryProducts", () => {
  test("scope limits the list", () => {
    const result = queryProducts(products, steel, params());
    expect(result.total).toBe(6);
    expect(result.scopeTotal).toBe(6);
  });

  test("values in one filter are OR, filters together are AND", () => {
    const either = queryProducts(products, { categorySlug: "cement-concrete" }, params({ type: ["Type I", "Type N"] }));
    expect(either.items.map((c) => c.slug).sort()).toEqual(["masonry-cement", "portland-cement"]);

    const both = queryProducts(products, { categorySlug: "cement-concrete" }, params({ type: ["Type I", "Type N"], seller: "tibay-steel" }));
    expect(both.items.map((c) => c.slug)).toEqual(["portland-cement"]);
  });

  test("a facet's counts ignore its own filter but respect the others", () => {
    const result = queryProducts(products, steel, params({ size: "16 mm", grade: "Grade 40" }));
    const size = facet(result, "size")!;
    expect(size.values.find((v) => v.value === "16 mm")).toMatchObject({ count: 1, selected: true });
    // Picking 16 mm doesn't zero out 12 mm: a buyer can still add it.
    expect(size.values.find((v) => v.value === "12 mm")?.count).toBe(1);
    // 20 mm is Grade 60, which the grade filter rules out.
    expect(size.values.find((v) => v.value === "20 mm")?.count).toBe(0);
  });

  test("filtering on a size shows that size on the card and opens on it", () => {
    const [card] = queryProducts(products, steel, params({ size: "16 mm" })).items;
    expect(card.slug).toBe("deformed-rebar");
    expect(card.spec).toContain("16 mm");
    expect(card.price).toBe(420);
    expect(card.href).toBe("/products/deformed-rebar?size=16-mm");
  });

  test("with no size filter a card shows the usual size", () => {
    const card = queryProducts(products, steel, params()).items.find((c) => c.slug === "deformed-rebar")!;
    expect(card.spec).toContain("12 mm");
    expect(card.href).toBe("/products/deformed-rebar");
  });

  test("a seller scope shows that seller's own price", () => {
    const result = queryProducts(products, { sellerSlug: "bakal-supply" }, params());
    const cement = result.items.find((c) => c.slug === "portland-cement");
    expect(cement?.price ?? 265).toBe(265);
    expect(result.facets.some((f) => f.key === "seller")).toBe(false);
  });

  test("the seller filter shows the chosen seller's offer", () => {
    const [card] = queryProducts(products, { categorySlug: "cement-concrete" }, params({ seller: "tibay-steel" })).items;
    expect(card).toMatchObject({ slug: "portland-cement", price: 263, seller: { slug: "tibay-steel", name: "Tibay Steel" } });
  });

  test("each sort orders correctly", () => {
    const list = (sort: string) => queryProducts(products, { categorySlug: "masonry" }, params({ sort })).items;
    const priced = list("price-asc").map((c) => c.price);
    expect(priced).toEqual([...priced].sort((a, b) => a - b));
    const dear = list("price-desc").map((c) => c.price);
    expect(dear).toEqual([...dear].sort((a, b) => b - a));
    expect(list("best")[0].slug).toBe("hollow-block");
    expect(list("rating")[0].slug).toBe("hollow-block");
    expect(list("new")[0].slug).toBe("concrete-paver");
  });

  test("relevance keeps the order it was given", () => {
    const slugs = ["hollow-block", "portland-cement", "tie-wire"];
    const items = queryProducts(products, { slugs }, params({}, "relevance")).items;
    expect(items.map((c) => c.slug)).toEqual(slugs);
  });

  test("show limits the batch and hasMore tells the truth", () => {
    expect(queryProducts(products, {}, params()).items).toHaveLength(BATCH);
    expect(queryProducts(products, {}, params()).hasMore).toBe(true);
    const all = queryProducts(products, {}, params({ show: "48" }));
    expect(all.items).toHaveLength(48);
    expect(all.hasMore).toBe(false);
  });

  test("price buckets with no products are left out", () => {
    const values = facet(queryProducts(products, { categorySlug: "tools-safety" }, params()), "price")!.values.map((v) => v.value);
    expect(values).not.toContain("under-250");
    expect(values).toContain("over-5000");
  });

  test("unknown params and values are ignored", () => {
    const result = queryProducts(products, steel, params({ colour: "red", size: "banana" }));
    expect(result.total).toBe(6);
    expect(result.applied).toEqual([]);
  });

  test("a subcategory narrows the list, and an unknown one is ignored", () => {
    expect(queryProducts(products, steel, params({ sub: "Tie wire" })).items.map((c) => c.slug)).toEqual(["tie-wire"]);
    expect(queryProducts(products, steel, params({ sub: "Bananas" })).total).toBe(6);
  });

  test("zero results still returns the filters, so they can be removed", () => {
    const result = queryProducts(products, steel, params({ grade: "Grade 60", size: "12 mm" }));
    expect(result.total).toBe(0);
    expect(result.applied.map((a) => a.value)).toEqual(["12 mm", "Grade 60"]);
  });

  test("deals only lists discounted offers, and shows the discounted seller", () => {
    const result = queryProducts(products, { dealsOnly: true }, params({ show: "48" }));
    expect(result.total).toBeGreaterThan(4);
    expect(result.items.every((c) => c.listPrice && c.listPrice > c.price)).toBe(true);
  });

  test("delivery filter keeps offers ready soon", () => {
    const result = queryProducts(products, { categorySlug: "plumbing" }, params({ delivery: "soon", show: "48" }));
    expect(result.items.every((c) => c.leadDays <= 1)).toBe(true);
    expect(result.items.map((c) => c.slug)).not.toContain("water-tank");
  });
});

describe("listingHref", () => {
  const base = params({ size: "16 mm", show: "24" });

  test("adding a value keeps the others and starts the list over", () => {
    expect(listingHref("/c", base, { toggle: { key: "grade", value: "Grade 40" } })).toBe("/c?size=16+mm&grade=Grade+40");
  });

  test("removing the last value drops the key", () => {
    expect(listingHref("/c", base, { toggle: { key: "size", value: "16 mm" } })).toBe("/c");
  });

  test("clearing removes filters but keeps the search", () => {
    expect(listingHref("/search", params({ q: "cement", brand: "Bundok" }), { clear: true })).toBe("/search?q=cement");
  });

  test("the default sort isn't written", () => {
    expect(listingHref("/c", params(), { sort: "best" })).toBe("/c");
    expect(listingHref("/c", params(), { sort: "new" })).toBe("/c?sort=new");
  });

  test("show more keeps the filters", () => {
    expect(listingHref("/c", base, { show: 36 })).toBe("/c?size=16+mm&show=36");
  });

  test("special characters are encoded", () => {
    expect(listingHref("/c", params(), { toggle: { key: "size", value: '4"' } })).toBe("/c?size=4%22");
  });
});

describe("sellerFacts", () => {
  test("counts come from the catalog", () => {
    const facts = sellerFacts(products, "tibay-steel");
    expect(facts.productCount).toBeGreaterThan(5);
    expect(facts.cheapestCount).toBeGreaterThan(0);
    expect(facts.cheapestCount).toBeLessThanOrEqual(facts.productCount);
  });
});
