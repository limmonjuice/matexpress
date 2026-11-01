import { describe, expect, test } from "vitest";
import { products } from "@/db/sample/products";
import { alternativeQueries, buildSearchIndex, searchProducts } from "./search";

const index = buildSearchIndex(products);
const slugs = (query: string, limit = 6) => searchProducts(index, query, limit).items.map((p) => p.slug);

describe("words every object has", () => {
  const index = buildSearchIndex(products);

  test.each(["constructor", "constructors", "__proto__", "toString", "hasOwnProperty", "valueOf"])("searching %s finds nothing and doesn't fall over", (word) => {
    expect(() => searchProducts(index, word)).not.toThrow();
    expect(() => alternativeQueries(index, `${word} cement`)).not.toThrow();
  });
});

describe("searchProducts", () => {
  test("ignores case and outer spaces", () => {
    expect(slugs("  CEMENT ")).toContain("portland-cement");
  });

  test("finds by category name", () => {
    expect(slugs("plumbing")).toContain("upvc-pipe");
  });

  test("every word must match", () => {
    expect(slugs("rebar 12")).toEqual(["deformed-rebar"]);
    expect(slugs("rebar plywood")).toEqual([]);
  });

  test("name matches come before other matches", () => {
    expect(searchProducts(index, "concrete").items[0].name).toContain("Concrete");
  });

  test("an empty query returns nothing", () => {
    expect(slugs("   ")).toEqual([]);
  });

  test("special characters are safe", () => {
    expect(() => slugs("(\\[*")).not.toThrow();
    expect(slugs("(\\[*")).toEqual([]);
  });

  test("respects the limit", () => {
    expect(slugs("steel", 2)).toHaveLength(2);
  });

  test("local and trade words find the right material", () => {
    expect(slugs("semento")).toContain("portland-cement");
    expect(slugs("chb")).toContain("hollow-block");
    expect(slugs("yero")).toContain("gi-roofing-sheet");
    expect(slugs("bakal")).toContain("deformed-rebar");
    expect(slugs("buhangin")).toContain("washed-sand");
    expect(slugs("graba")).toContain("crushed-gravel");
    expect(slugs("kahoy")).toContain("coco-lumber");
    expect(slugs("pintura")).toContain("elastomeric-wall-paint");
    expect(slugs("pako")).toContain("common-nails");
  });

  test("says what a local word was taken to mean", () => {
    expect(searchProducts(index, "semento").meaning).toEqual({ typed: "semento", shown: "cement" });
    expect(searchProducts(index, "cement").meaning).toBeUndefined();
  });

  test("one typo still finds it, and says the matches are close", () => {
    const typo = searchProducts(index, "portlnd cement");
    expect(typo.items[0].slug).toBe("portland-cement");
    expect(typo.fuzzy).toBe(true);
    expect(slugs("rebbar")).toContain("deformed-rebar");
    expect(searchProducts(index, "cement").fuzzy).toBe(false);
  });

  test("short words are never fuzzy", () => {
    expect(slugs("gi")).toContain("gi-roofing-sheet");
    expect(slugs("gx")).toEqual([]);
  });

  test("a size in the query opens the product on that size", () => {
    const result = searchProducts(index, "rebar 16mm");
    expect(result.items.map((p) => p.slug)).toEqual(["deformed-rebar"]);
    expect(result.sizeBySlug).toEqual({ "deformed-rebar": "16-mm" });
    expect(searchProducts(index, "rebar 16 mm").sizeBySlug).toEqual({ "deformed-rebar": "16-mm" });
  });

  test("a size no product has finds nothing", () => {
    expect(slugs("rebar 99mm")).toEqual([]);
  });

  test("plurals match", () => {
    expect(slugs("hollow blocks")).toContain("hollow-block");
  });
});

describe("alternativeQueries", () => {
  test("offers each word that would find something", () => {
    const alternatives = alternativeQueries(index, "blue rebar");
    expect(alternatives.map((a) => a.query)).toEqual(["rebar"]);
    expect(alternatives[0].items[0].slug).toBe("deformed-rebar");
  });

  test("a single word has no alternatives", () => {
    expect(alternativeQueries(index, "zzz")).toEqual([]);
  });
});
