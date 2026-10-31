import { beforeEach, describe, expect, test } from "vitest";
import { act, render } from "@testing-library/react";
import { toLine } from "@/lib/catalog/card";
import { productBySlug } from "@/lib/catalog/data/products";
import { useCartStore } from "@/stores/cart-store";
import { usePreferences } from "@/stores/preferences-store";
import { StoreHydrator } from "./store-hydrator";

const cement = productBySlug("portland-cement")!;
const rebar = productBySlug("deformed-rebar")!;
const cementLine = { ...toLine(cement, cement.variants[0], cement.variants[0].offers[0]), quantity: 2 };
const rebarLine = { ...toLine(rebar, rebar.variants[1], rebar.variants[1].offers[0]), quantity: 5 };

/** What the browser fires here when another tab saves. */
async function anotherTabSaves(key: string, value: string) {
  localStorage.setItem(key, value);
  await act(async () => {
    window.dispatchEvent(new StorageEvent("storage", { key }));
  });
}

describe("StoreHydrator", () => {
  beforeEach(() => {
    useCartStore.setState({ lines: [] });
    usePreferences.setState({ saved: [], area: "Rizal" });
  });

  test("loads what's saved when it mounts", async () => {
    localStorage.setItem("matexpress-cart", JSON.stringify({ state: { lines: [cementLine] }, version: 2 }));
    await act(async () => {
      render(<StoreHydrator />);
    });
    expect(useCartStore.getState().lines).toMatchObject([{ id: cementLine.id, quantity: 2 }]);
  });

  test("two tabs add to one cart, rather than the second wiping the first", async () => {
    render(<StoreHydrator />);
    useCartStore.setState({ lines: [cementLine] });

    await anotherTabSaves("matexpress-cart", JSON.stringify({ state: { lines: [cementLine, rebarLine] }, version: 2 }));
    expect(useCartStore.getState().lines.map((l) => l.id)).toEqual([cementLine.id, rebarLine.id]);

    useCartStore.getState().setQuantity(cementLine.id, 3);
    const saved = JSON.parse(localStorage.getItem("matexpress-cart")!);
    expect(saved.state.lines.map((l: { id: string }) => l.id)).toEqual([cementLine.id, rebarLine.id]);
  });

  test("a cart emptied by an order in another tab empties here too", async () => {
    render(<StoreHydrator />);
    useCartStore.setState({ lines: [cementLine] });
    await anotherTabSaves("matexpress-cart", JSON.stringify({ state: { lines: [] }, version: 2 }));
    expect(useCartStore.getState().lines).toEqual([]);
  });

  test("a change of area in another tab follows here", async () => {
    render(<StoreHydrator />);
    await anotherTabSaves("matexpress-preferences", JSON.stringify({ state: { saved: [], area: "Cavite" }, version: 0 }));
    expect(usePreferences.getState().area).toBe("Cavite");
  });

  test("something else being saved changes nothing", async () => {
    render(<StoreHydrator />);
    useCartStore.setState({ lines: [cementLine] });
    await anotherTabSaves("someone-elses-key", "{}");
    expect(useCartStore.getState().lines).toHaveLength(1);
  });

  test("stops listening when it goes away", async () => {
    const { unmount } = render(<StoreHydrator />);
    unmount();
    useCartStore.setState({ lines: [cementLine] });
    await anotherTabSaves("matexpress-cart", JSON.stringify({ state: { lines: [] }, version: 2 }));
    expect(useCartStore.getState().lines).toHaveLength(1);
  });
});
