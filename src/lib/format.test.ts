import { describe, expect, test } from "vitest";
import { discountPercent, formatPeso, plural } from "./format";

describe("formatPeso", () => {
  test("drops centavos on whole pesos", () => expect(formatPeso(1150)).toBe("₱1,150"));
  test("keeps two digits when there are centavos", () => expect(formatPeso(16.5)).toBe("₱16.50"));
  test("handles zero", () => expect(formatPeso(0)).toBe("₱0"));
});

describe("discountPercent", () => {
  test("rounds to a whole percent", () => expect(discountPercent(265, 252)).toBe(5));
  test("is zero when there is no saving", () => expect(discountPercent(100, 100)).toBe(0));
  test("is never negative", () => expect(discountPercent(100, 120)).toBe(0));
});

describe("plural", () => {
  test("one seller", () => expect(plural(1, "seller")).toBe("1 seller"));
  test("many sellers", () => expect(plural(5, "seller")).toBe("5 sellers"));
});
