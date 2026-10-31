import { describe, expect, test } from "vitest";
import { searchProducts } from "./search";

describe("searchProducts", () => {
  test("ignores case and outer spaces", () => {
    expect(searchProducts("  CEMENT ")[0].slug).toBe("portland-cement");
  });
  test("finds by category name", () => {
    expect(searchProducts("plumbing").map((p) => p.slug)).toContain("upvc-pipe-4in");
  });
  test("every word must match", () => {
    expect(searchProducts("rebar 12").map((p) => p.slug)).toEqual(["deformed-rebar-12mm"]);
    expect(searchProducts("rebar plywood")).toEqual([]);
  });
  test("name matches come before spec matches", () => {
    expect(searchProducts("concrete")[0].name).toContain("Concrete");
  });
  test("an empty query returns nothing", () => {
    expect(searchProducts("   ")).toEqual([]);
  });
  test("special characters are safe", () => {
    expect(() => searchProducts("(\\[*")).not.toThrow();
    expect(searchProducts("(\\[*")).toEqual([]);
  });
  test("respects the limit", () => {
    expect(searchProducts("a", 2)).toHaveLength(2);
  });
});
