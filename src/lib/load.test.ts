import { describe, expect, test } from "vitest";
import { formatWeight, loadFor } from "./load";

describe("loadFor", () => {
  test("picks the smallest truck that holds the load", () => {
    expect(loadFor(120).truck.name).toBe("Multicab");
    expect(loadFor(500).truck.name).toBe("Multicab");
    expect(loadFor(501).truck.name).toBe("Elf truck");
    expect(loadFor(8000).truck.name).toBe("6-wheeler");
    expect(loadFor(8001).truck.name).toBe("10-wheeler");
  });

  test("more than the biggest truck holds takes more than one trip", () => {
    expect(loadFor(15000).trips).toBe(1);
    expect(loadFor(15001).trips).toBe(2);
    expect(loadFor(40000).trips).toBe(3);
  });

  test("a truck making several trips leaves full, however little the last trip carries", () => {
    expect(loadFor(15001).fill).toBe(1);
    expect(loadFor(30100).fill).toBe(1);
  });

  test("only the big trucks need the site's access checked", () => {
    expect(loadFor(2000).needsAccess).toBe(false);
    expect(loadFor(4000).needsAccess).toBe(true);
  });

  test("an empty cart is an empty truck, and a tiny load still shows", () => {
    expect(loadFor(0).fill).toBe(0);
    expect(loadFor(1).fill).toBeGreaterThan(0);
    expect(loadFor(500).fill).toBe(1);
  });
});

describe("formatWeight", () => {
  test("reads like a person would say it", () => {
    expect(formatWeight(2.4)).toBe("2.4 kg");
    expect(formatWeight(240)).toBe("240 kg");
    expect(formatWeight(1000)).toBe("1 t");
    expect(formatWeight(2450)).toBe("2.5 t");
  });
});
