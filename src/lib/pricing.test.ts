import { describe, expect, test } from "vitest";
import type { Offer } from "./catalog/types";
import { clampQuantity, lineTotal, priceForQuantity, rankOffers, splitOrder, unitPriceLabel } from "./pricing";

const offer = (sellerSlug: string, price: number, stock: number, extra: Partial<Offer> = {}): Offer => ({
  sellerSlug,
  sellerName: sellerSlug,
  price,
  stock,
  leadDays: 1,
  ...extra,
});

describe("priceForQuantity", () => {
  const rules = { price: 15, tiers: [{ from: 100, price: 14.5 }, { from: 500, price: 14 }] };

  test("uses the best tier the quantity reaches", () => {
    expect(priceForQuantity(rules, 99)).toBe(15);
    expect(priceForQuantity(rules, 100)).toBe(14.5);
    expect(priceForQuantity(rules, 500)).toBe(14);
  });

  test("no tiers is just the price", () => {
    expect(priceForQuantity({ price: 252 }, 1000)).toBe(252);
  });
});

describe("clampQuantity", () => {
  const blocks = { minQty: 50, stock: 120 };

  test("below the minimum snaps up and says why", () => {
    expect(clampQuantity("10", blocks)).toEqual({ quantity: 50, note: "The minimum order is 50." });
  });

  test("above stock caps and says how many are left", () => {
    expect(clampQuantity("500", blocks)).toEqual({ quantity: 120, note: "Only 120 left from this seller." });
  });

  test("blank, letters and zero fall back to the minimum", () => {
    expect(clampQuantity("", blocks).quantity).toBe(50);
    expect(clampQuantity("abc", blocks).quantity).toBe(50);
    expect(clampQuantity(0, blocks).quantity).toBe(50);
    expect(clampQuantity("-5", blocks).quantity).toBe(50);
  });

  test("half-cubic steps round to the nearest step", () => {
    const sand = { minQty: 1, step: 0.5, stock: 80 };
    expect(clampQuantity("1.2", sand)).toEqual({ quantity: 1, note: "Sold in steps of 0.5." });
    expect(clampQuantity("1.3", sand)).toEqual({ quantity: 1.5, note: "Sold in steps of 0.5." });
    expect(clampQuantity("2.5", sand)).toEqual({ quantity: 2.5 });
  });

  test("commas are fine, because people type 2,000", () => {
    expect(clampQuantity("2,000", { minQty: 50 }).quantity).toBe(2000);
  });

  test("whole units reject a fraction", () => {
    expect(clampQuantity("2.4", {})).toEqual({ quantity: 2, note: "Whole units only." });
  });
});

describe("unitPriceLabel", () => {
  test("divides by the measure", () => {
    expect(unitPriceLabel(3250, { per: "m", amount: 150 })).toBe("₱21.67/m");
    expect(unitPriceLabel(252, { per: "kg", amount: 40 })).toBe("₱6.30/kg");
  });

  test("nothing to show without a measure", () => {
    expect(unitPriceLabel(100)).toBeUndefined();
  });
});

describe("lineTotal", () => {
  test("adds up without float drift", () => {
    expect(lineTotal(16.5, 3)).toBe(49.5);
    expect(lineTotal(0.1, 3)).toBe(0.3);
    expect(lineTotal(14.25, 500)).toBe(7125);
  });
});

describe("rankOffers", () => {
  const offers = [
    offer("tibay", 232, 900, { tiers: [{ from: 100, price: 225 }] }),
    offer("bakal", 236, 2400, { tiers: [{ from: 100, price: 222 }] }),
    offer("dalisay", 241, 50),
  ];

  test("the cheapest seller changes with the quantity", () => {
    expect(rankOffers(offers, 10)[0].offer.sellerSlug).toBe("tibay");
    expect(rankOffers(offers, 100)[0].offer.sellerSlug).toBe("bakal");
  });

  test("a seller without enough stock falls below those with it, even if cheaper", () => {
    const ranked = rankOffers([offer("cheap", 100, 5), offer("dear", 200, 500)], 10);
    expect(ranked.map((r) => r.offer.sellerSlug)).toEqual(["dear", "cheap"]);
    expect(ranked[1].canFill).toBe(false);
  });

  test("ties go to the seller who is ready first", () => {
    const ranked = rankOffers([offer("slow", 100, 9, { leadDays: 3 }), offer("fast", 100, 9, { leadDays: 0 })], 1);
    expect(ranked[0].offer.sellerSlug).toBe("fast");
  });
});

describe("splitOrder", () => {
  const offers = [offer("a", 15, 1200), offer("b", 14, 900), offer("c", 16, 0)];

  test("fills from the cheapest stock when no one seller can", () => {
    expect(splitOrder(offers, 2000)?.map((part) => [part.offer.sellerSlug, part.quantity])).toEqual([
      ["b", 900],
      ["a", 1100],
    ]);
  });

  test("isn't offered when one seller can fill it", () => {
    expect(splitOrder(offers, 1000)).toBeUndefined();
  });

  test("isn't offered when everyone together falls short", () => {
    expect(splitOrder(offers, 5000)).toBeUndefined();
  });

  test("never leaves a part under the minimum", () => {
    const parts = splitOrder([offer("a", 14, 8000), offer("b", 15, 3000), offer("c", 16, 1500)], 11010, { minQty: 50 })!;
    expect(parts.map((part) => part.quantity)).toEqual([8000, 2960, 50]);
  });

  test("works in the seller's steps", () => {
    const parts = splitOrder([offer("a", 14, 90), offer("b", 15, 40)], 90.5, { minQty: 1, step: 0.5 })!;
    expect(parts.map((part) => part.quantity)).toEqual([89.5, 1]);
  });

  test("skips a seller holding less than the minimum, and says no if that's not enough", () => {
    expect(splitOrder([offer("a", 14, 40), offer("b", 15, 40)], 60, { minQty: 50 })).toBeUndefined();
    const parts = splitOrder([offer("a", 14, 40), offer("b", 15, 60), offer("c", 16, 60)], 110, { minQty: 50 })!;
    expect(parts.map((part) => part.offer.sellerSlug)).toEqual(["b", "c"]);
  });
});
