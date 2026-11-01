import { describe, expect, test } from "vitest";
import { toCard } from "./card";
import { products, productBySlug } from "@/db/sample/products";
import { cheaperOffer, reconcileCart } from "./reconcile";

const rebar = productBySlug("deformed-rebar")!;
const line = (quantity: number, change = {}) => ({ ...toCard(rebar).line, quantity, ...change });

describe("reconcileCart", () => {
  test("an unchanged line stays and raises nothing", () => {
    const result = reconcileCart([line(10)], products);
    expect(result.notices).toEqual([]);
    expect(result.lines[0].quantity).toBe(10);
  });

  test("a changed price updates the line and raises a notice", () => {
    const result = reconcileCart([line(10, { price: 200 })], products);
    expect(result.lines[0].price).toBe(232);
    expect(result.notices).toEqual([{ lineId: result.lines[0].id, kind: "price", name: "Deformed Rebar", was: 200, now: 232 }]);
  });

  test("too much for what's left is cut down and raises a notice", () => {
    const result = reconcileCart([line(5000)], products);
    expect(result.lines[0].quantity).toBe(900);
    expect(result.notices[0]).toMatchObject({ kind: "stock", left: 900 });
  });

  test("a change to a volume price is noticed, at the price this line was really paying", () => {
    const stale = line(100, { tiers: [{ from: 100, price: 230 }, { from: 500, price: 219 }] });
    const result = reconcileCart([stale], products);
    expect(result.notices).toEqual([{ lineId: stale.id, kind: "price", name: "Deformed Rebar", was: 230, now: 225 }]);
    expect(result.lines[0].tiers).toEqual(toCard(rebar).line.tiers);
  });

  test("a change only to the list price says nothing to a line on a volume price", () => {
    expect(reconcileCart([line(100, { price: 240 })], products).notices).toEqual([]);
  });

  test("stock, lead time and weight refresh even when there's nothing to say", () => {
    const result = reconcileCart([line(10, { stock: 1, leadDays: 9, weightKg: 1 })], products);
    expect(result.notices).toEqual([]);
    expect(result.lines[0]).toMatchObject({ stock: 900, leadDays: 0, weightKg: 5.33 });
  });

  test("a seller now holding less than their minimum can't fill it, rather than bouncing between the two", () => {
    const blocks = productBySlug("hollow-block")!;
    const variant = blocks.variants[0];
    const low = { ...blocks, variants: blocks.variants.map((v) => (v === variant ? { ...v, offers: v.offers.map((o) => ({ ...o, stock: 10 })) } : v)) };
    const cartLine = { ...toCard(blocks).line, quantity: 50 };
    const result = reconcileCart([cartLine], [low]);
    expect(result.notices).toMatchObject([{ kind: "gone" }]);
    expect(result.lines[0].stock).toBe(0);
  });

  test("a gone offer is flagged and kept visible", () => {
    const result = reconcileCart([line(10, { sellerSlug: "nobody", id: "x" })], products);
    expect(result.notices[0]).toMatchObject({ kind: "gone", lineId: "x" });
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].stock).toBe(0);
  });

  test("a removed product is flagged too", () => {
    const result = reconcileCart([line(10, { slug: "discontinued" })], products);
    expect(result.notices[0].kind).toBe("gone");
  });
});

describe("cheaperOffer", () => {
  test("finds a cheaper seller at this quantity", () => {
    // Tibay is cheapest at 10, but Bakal Supply beats it at 100.
    expect(cheaperOffer(line(10), products)).toBeUndefined();
    const better = cheaperOffer(line(100), products)!;
    expect(better.offer.sellerSlug).toBe("bakal-supply");
    expect(better.saves).toBe(300);
  });

  test("ignores a seller without enough stock", () => {
    expect(cheaperOffer(line(900, { sellerSlug: "bakal-supply", price: 236, tiers: [{ from: 100, price: 222 }, { from: 500, price: 214 }] }), products)).toBeUndefined();
  });
});
