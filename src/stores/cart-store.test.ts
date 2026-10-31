import { beforeEach, describe, expect, test } from "vitest";
import { cartCount, cartTotal, useCartStore } from "./cart-store";

const cement = { id: "portland-cement", name: "Portland Cement Type I", unit: "bag", price: 252 };

describe("cart store", () => {
  beforeEach(() => useCartStore.setState({ lines: [], isOpen: false, lastAddedAt: 0 }));

  test("adding the same item twice merges the line", () => {
    const { add } = useCartStore.getState();
    add(cement);
    add(cement);
    const { lines } = useCartStore.getState();
    expect(lines).toHaveLength(1);
    expect(lines[0].quantity).toBe(2);
    expect(cartCount(lines)).toBe(2);
    expect(cartTotal(lines)).toBe(504);
  });

  test("setting quantity to zero removes the line", () => {
    const { add, setQuantity } = useCartStore.getState();
    add(cement);
    setQuantity(cement.id, 0);
    expect(useCartStore.getState().lines).toEqual([]);
  });

  test("a cart saved by an older version is discarded", async () => {
    localStorage.setItem(
      "matexpress-cart",
      JSON.stringify({
        state: { lines: [{ id: "cement-opc-40", name: "Old", unit: "bag", price: 265, quantity: 3 }] },
        version: 0,
      }),
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
    localStorage.setItem(
      "matexpress-cart",
      JSON.stringify({ state: { lines: [{ ...cement, quantity: 2 }] }, version: 1 }),
    );
    await useCartStore.persist.rehydrate();
    expect(useCartStore.getState().lines[0].quantity).toBe(2);
  });
});
