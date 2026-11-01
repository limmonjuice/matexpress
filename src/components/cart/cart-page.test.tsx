import { StrictMode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { sellerDirectory, toLine } from "@/lib/catalog/card";
import { productBySlug, products } from "@/db/sample/products";
import { sellers } from "@/db/sample/sellers";
import { deliveryFee } from "@/lib/delivery";
import { formatPeso } from "@/lib/format";
import { useCartStore, type CartLine } from "@/stores/cart-store";
import { usePreferences } from "@/stores/preferences-store";
import { CartPage } from "./cart-page";

function line(slug: string, variantId: string, sellerSlug: string, quantity: number): CartLine {
  const product = productBySlug(slug)!;
  const variant = product.variants.find((v) => v.id === variantId)!;
  return { ...toLine(product, variant, variant.offers.find((o) => o.sellerSlug === sellerSlug)!), quantity };
}

const rebarFromBakal = () => line("deformed-rebar", "12-mm", "bakal-supply", 500);
const cementFromDalisay = () => line("portland-cement", "40-kg", "dalisay-hardware", 10);
const notices = () => within(screen.getByRole("list", { name: "Changes to your cart" })).getAllByRole("listitem").map((li) => li.textContent);

async function show(lines: CartLine[]) {
  useCartStore.setState({ lines });
  await useCartStore.persist.rehydrate();
  useCartStore.setState({ lines });
  render(
    <StrictMode>
      <CartPage products={products} sellers={sellerDirectory(sellers)} />
    </StrictMode>,
  );
}

describe("CartPage", () => {
  beforeEach(() => {
    usePreferences.setState({ area: "Rizal", saved: [] });
  });

  test("until the saved cart has loaded it shows only the title, so nothing wrong appears and nothing jumps", () => {
    const loaded = vi.spyOn(useCartStore.persist, "hasHydrated").mockReturnValue(false);
    render(<CartPage products={products} sellers={sellerDirectory(sellers)} />);
    expect(screen.getByRole("heading", { name: "Your cart" })).toBeInTheDocument();
    expect(screen.queryByText(/₱/)).not.toBeInTheDocument();
    expect(screen.queryByText(/your truck is empty/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("complementary", { name: "Order summary" })).not.toBeInTheDocument();
    loaded.mockRestore();
  });

  test("groups the cart by seller, the way the truck collects it", async () => {
    await show([rebarFromBakal(), cementFromDalisay()]);
    expect(screen.getByRole("heading", { name: "Bakal Supply" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Dalisay Hardware" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "The route for this order" })).toHaveTextContent("Your site, Rizal");
  });

  test("names the seller holding the delivery date back", async () => {
    await show([{ ...cementFromDalisay(), leadDays: 0 }, { ...rebarFromBakal(), leadDays: 1 }]);
    await waitFor(() => expect(screen.getByText(/Arrives together/)).toBeInTheDocument());
    expect(screen.getByText("Bakal Supply is the last one ready. Pick a faster seller to bring this forward.")).toBeInTheDocument();
  });

  test("names nobody when everyone's ready together", async () => {
    // Both ready tomorrow, by the catalog: the cart refreshes lead times as it loads.
    await show([line("washed-sand", "fine", "bato-aggregates", 1), rebarFromBakal()]);
    await waitFor(() => expect(screen.getByText(/Arrives together/)).toBeInTheDocument());
    expect(screen.queryByText(/is the last one ready/)).not.toBeInTheDocument();
  });

  test("the total includes the fee for the chosen area", async () => {
    await show([line("deformed-rebar", "12-mm", "bakal-supply", 1)]);
    const total = () => screen.getByText("Total").parentElement;
    expect(total()).toHaveTextContent(formatPeso(236 + deliveryFee("Rizal", 236)));
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Delivery area" }), "Bulacan");
    expect(total()).toHaveTextContent(formatPeso(236 + deliveryFee("Bulacan", 236)));
    expect(usePreferences.getState().area).toBe("Bulacan");
  });

  test("the volume price counts: 500 lengths cost what the seller charges for 500", async () => {
    await show([rebarFromBakal()]);
    expect(screen.getByText("Items").parentElement).toHaveTextContent("₱107,000");
    expect(screen.getByText("Total").parentElement).toHaveTextContent("₱107,000");
  });

  test("a saved cart that's gone stale says everything that changed, and keeps saying it", async () => {
    const cheaper = { ...rebarFromBakal(), price: 100 };
    const tooMany = { ...cementFromDalisay(), quantity: 99999 };
    const gone = { ...rebarFromBakal(), id: "gone:x:y", slug: "gone", name: "Discontinued Item" };
    await show([cheaper, tooMany, gone]);

    await waitFor(() =>
      expect(notices()).toEqual([
        "Deformed Rebar changed from ₱100 to ₱214.",
        "Only 640 left of Portland Cement Type I, so we lowered your quantity.",
        "Discontinued Item is no longer available from this seller.",
      ]),
    );
    expect(useCartStore.getState().lines[1].quantity).toBe(640);
  });

  test("something that can't be bought stops checkout until it's removed, and its notice goes with it", async () => {
    await show([cementFromDalisay(), { ...cementFromDalisay(), id: "gone:x:y", slug: "gone", name: "Discontinued Item" }]);
    await waitFor(() => expect(screen.getByText("Remove what's no longer available to check out.")).toBeInTheDocument());
    expect(screen.queryByRole("link", { name: "Check out" })).not.toBeInTheDocument();

    const row = screen.getAllByRole("link", { name: "Discontinued Item" })[0].closest("li")!;
    await userEvent.click(within(row).getByRole("button", { name: "Remove" }));

    expect(screen.queryByText(/is no longer available/)).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Check out" })[0]).toHaveAttribute("href", "/checkout");
  });

  test("offers a cheaper seller for the same thing, and switches keeping the quantity", async () => {
    await show([line("deformed-rebar", "12-mm", "tibay-steel", 500)]);
    expect(screen.getByText(/Bakal Supply has this for ₱2,500 less/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Switch" }));
    expect(useCartStore.getState().lines).toMatchObject([{ sellerSlug: "bakal-supply", quantity: 500 }]);
    expect(screen.queryByRole("button", { name: "Switch" })).not.toBeInTheDocument();
  });

  test("says how much more until delivery is free", async () => {
    await show([cementFromDalisay()]);
    expect(screen.getByText("₱22,480 more and delivery is free")).toBeInTheDocument();
  });

  test("an empty cart is an empty truck with somewhere to go", async () => {
    await show([]);
    expect(screen.getByRole("heading", { name: "Your truck is empty" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Explore materials/ })).toHaveAttribute("href", "/categories");
  });
});
