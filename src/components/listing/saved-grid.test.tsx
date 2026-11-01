import { beforeEach, describe, expect, test, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toCard } from "@/lib/catalog/card";
import { productBySlug } from "@/lib/catalog/data/products";
import { useCartStore } from "@/stores/cart-store";
import { usePreferences } from "@/stores/preferences-store";
import { ImportSharedList, SavedGrid } from "./saved-grid";

const cement = toCard(productBySlug("portland-cement")!);
const rebar = toCard(productBySlug("deformed-rebar")!);
const sand = toCard(productBySlug("washed-sand")!);
const cards = [cement, rebar, sand];

async function hydrate() {
  await act(() => usePreferences.persist.rehydrate());
}

describe("SavedGrid", () => {
  beforeEach(() => {
    useCartStore.setState({ lines: [], isOpen: false });
    usePreferences.setState({ saved: [], area: "Rizal" });
  });

  test("until the list has loaded it shows nothing, rather than a count or an empty message that would jump", () => {
    const loaded = vi.spyOn(usePreferences.persist, "hasHydrated").mockReturnValue(false);
    render(<SavedGrid cards={cards} />);
    expect(screen.queryByText(/saved item/)).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Nothing saved yet" })).not.toBeInTheDocument();
    loaded.mockRestore();
  });

  test("shows only what's saved", async () => {
    usePreferences.setState({ saved: [cement.slug, sand.slug] });
    await hydrate();
    usePreferences.setState({ saved: [cement.slug, sand.slug] });
    render(<SavedGrid cards={cards} />);
    expect(screen.getByText("2 saved items")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: cement.name })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: rebar.name })).not.toBeInTheDocument();
  });

  test("nothing saved says how to save, and that no account is needed", async () => {
    await hydrate();
    render(<SavedGrid cards={cards} />);
    expect(screen.getByRole("heading", { name: "Nothing saved yet" })).toBeInTheDocument();
    expect(screen.getByText(/No account needed/)).toBeInTheDocument();
  });

  test("Add all to cart skips what's out of stock and opens the cart", async () => {
    usePreferences.setState({ saved: [cement.slug, rebar.slug] });
    render(<SavedGrid cards={[cement, { ...rebar, inStock: false }]} />);
    await userEvent.click(screen.getByRole("button", { name: "Add all to cart" }));
    const { lines, isOpen } = useCartStore.getState();
    expect(lines.map((l) => l.slug)).toEqual([cement.slug]);
    expect(isOpen).toBe(true);
  });

  test("taking the heart off takes it off the list", async () => {
    usePreferences.setState({ saved: [cement.slug, sand.slug] });
    render(<SavedGrid cards={cards} />);
    const list = within(screen.getByRole("list"));
    await userEvent.click(list.getByRole("button", { name: `Save ${cement.name}` }));
    expect(screen.queryByRole("link", { name: cement.name })).not.toBeInTheDocument();
    expect(screen.getByText("1 saved item")).toBeInTheDocument();
  });
});

describe("ImportSharedList", () => {
  test("a shared link adds its items without doubling any", async () => {
    usePreferences.setState({ saved: [cement.slug], area: "Rizal" });
    await hydrate();
    usePreferences.setState({ saved: [cement.slug] });
    render(<ImportSharedList slugs={[cement.slug, rebar.slug]} />);
    expect(usePreferences.getState().saved.sort()).toEqual([cement.slug, rebar.slug].sort());
  });
});
