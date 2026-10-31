import { beforeEach, describe, expect, test } from "vitest";
import type { LineData } from "@/lib/catalog/types";
import { cartCount, cartTotal, cartWeight, groupBySeller, lineCost, useCartStore } from "./cart-store";

const cement: LineData = {
  id: "portland-cement:40-kg:bato-aggregates",
  slug: "portland-cement",
  variantId: "40-kg",
  sellerSlug: "bato-aggregates",
  seller: "Bato Aggregates",
  name: "Portland Cement Type I",
  unit: "bag",
  categorySlug: "cement-concrete",
  price: 256,
  tiers: [{ from: 50, price: 245 }],
  stock: 1200,
  leadDays: 1,
  weightKg: 40,
  image: "/home/products/portland-cement.webp",
};
const fromDalisay: LineData = { ...cement, id: "portland-cement:40-kg:dalisay-hardware", sellerSlug: "dalisay-hardware", seller: "Dalisay Hardware", price: 252 };
const blocks: LineData = { ...cement, id: "hollow-block:4-in:bato-aggregates", slug: "hollow-block", name: "Hollow Block", price: 15, tiers: undefined, minQty: 50, weightKg: 9 };

describe("cart store", () => {
  beforeEach(() => useCartStore.setState({ lines: [], isOpen: false, lastAddedAt: 0 }));

  test("same product, size and seller merge; another seller is a new line", () => {
    const { add } = useCartStore.getState();
    add(cement);
    add(cement);
    expect(useCartStore.getState().lines).toHaveLength(1);
    expect(useCartStore.getState().lines[0].quantity).toBe(2);
    add(fromDalisay);
    expect(useCartStore.getState().lines).toHaveLength(2);
  });

  test("adding uses the minimum order unless told otherwise", () => {
    useCartStore.getState().add(blocks);
    expect(useCartStore.getState().lines[0].quantity).toBe(50);
    useCartStore.getState().add(blocks, 500);
    expect(useCartStore.getState().lines[0].quantity).toBe(550);
  });

  test("setting quantity to zero removes the line", () => {
    const { add, setQuantity } = useCartStore.getState();
    add(cement);
    setQuantity(cement.id, 0);
    expect(useCartStore.getState().lines).toEqual([]);
  });

  test("cartCount counts lines, not units", () => {
    useCartStore.getState().add(blocks, 500);
    useCartStore.getState().add(cement, 10);
    expect(cartCount(useCartStore.getState().lines)).toBe(2);
  });

  test("cartTotal uses tier prices at each line's quantity", () => {
    useCartStore.getState().add(cement, 49);
    expect(cartTotal(useCartStore.getState().lines)).toBe(49 * 256);
    useCartStore.getState().setQuantity(cement.id, 50);
    expect(cartTotal(useCartStore.getState().lines)).toBe(50 * 245);
    expect(lineCost(useCartStore.getState().lines[0])).toBe(12250);
  });

  test("cartWeight adds up what the truck carries", () => {
    useCartStore.getState().add(cement, 10);
    useCartStore.getState().add(blocks, 100);
    expect(cartWeight(useCartStore.getState().lines)).toBe(1300);
  });

  test("groupBySeller keeps the order things were added", () => {
    useCartStore.getState().add(fromDalisay);
    useCartStore.getState().add(cement);
    useCartStore.getState().add(blocks);
    const groups = groupBySeller(useCartStore.getState().lines);
    expect(groups.map((g) => g.seller)).toEqual(["Dalisay Hardware", "Bato Aggregates"]);
    expect(groups[1].lines).toHaveLength(2);
  });

  test("replacing swaps the seller and keeps the quantity", () => {
    useCartStore.getState().add(cement, 40);
    useCartStore.getState().replace(cement.id, fromDalisay);
    const { lines } = useCartStore.getState();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ id: fromDalisay.id, quantity: 40 });
  });

  test("replacing onto a line already in the cart merges them", () => {
    useCartStore.getState().add(cement, 40);
    useCartStore.getState().add(fromDalisay, 10);
    useCartStore.getState().replace(cement.id, fromDalisay);
    const { lines } = useCartStore.getState();
    expect(lines).toHaveLength(1);
    expect(lines[0].quantity).toBe(50);
  });

  test("a cart saved by an older version is discarded", async () => {
    localStorage.setItem(
      "matexpress-cart",
      JSON.stringify({ state: { lines: [{ id: "portland-cement:Dalisay Hardware", name: "Old", unit: "bag", price: 265, quantity: 3 }] }, version: 1 }),
    );
    await useCartStore.persist.rehydrate();
    expect(useCartStore.getState().lines).toEqual([]);
  });

  test("a damaged saved cart does not crash", async () => {
    localStorage.setItem("matexpress-cart", "{not json");
    await expect(useCartStore.persist.rehydrate()).resolves.not.toThrow();
    expect(useCartStore.getState().lines).toEqual([]);
  });

  test("a cart saved by this version comes back", async () => {
    localStorage.setItem("matexpress-cart", JSON.stringify({ state: { lines: [{ ...cement, quantity: 2 }] }, version: 2 }));
    await useCartStore.persist.rehydrate();
    expect(useCartStore.getState().lines[0].quantity).toBe(2);
  });
});
