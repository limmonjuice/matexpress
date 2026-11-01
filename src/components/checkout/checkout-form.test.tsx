import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { sellerDirectory, toLine } from "@/lib/catalog/card";
import { productBySlug } from "@/db/sample/products";
import { sellers } from "@/db/sample/sellers";
import { deliveryFee } from "@/lib/delivery";
import { formatPeso } from "@/lib/format";
import { useCartStore, type CartLine } from "@/stores/cart-store";
import { usePreferences } from "@/stores/preferences-store";
import { Checkout } from "./checkout-form";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  placeOrder: vi.fn(),
  listMySites: vi.fn(),
  saveSite: vi.fn(),
  session: { data: null as null | { user: { id: string; email: string } } },
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace }) }));
vi.mock("@/lib/orders/actions", () => ({ placeOrder: mocks.placeOrder, listMySites: mocks.listMySites, saveSite: mocks.saveSite }));
vi.mock("@/lib/auth-client", () => ({ authClient: { useSession: () => mocks.session } }));

function line(slug: string, variantId: string, sellerSlug: string, quantity: number): CartLine {
  const product = productBySlug(slug)!;
  const variant = product.variants.find((v) => v.id === variantId)!;
  return { ...toLine(product, variant, variant.offers.find((o) => o.sellerSlug === sellerSlug)!), quantity };
}

const smallOrder = () => [line("portland-cement", "40-kg", "dalisay-hardware", 2)];
const bigLoad = () => [line("portland-cement", "40-kg", "dalisay-hardware", 200)];

async function show(lines: CartLine[]) {
  await act(async () => {
    await useCartStore.persist.rehydrate();
    await usePreferences.persist.rehydrate();
  });
  useCartStore.setState({ lines });
  usePreferences.setState({ area: "Rizal", saved: [] });
  render(<Checkout sellers={sellerDirectory(sellers)} />);
}

async function fillSite() {
  await userEvent.type(screen.getByLabelText("Who should the driver ask for?"), "Rosa Santos");
  await userEvent.type(screen.getByLabelText("Mobile number"), "0917 123 4567");
  await userEvent.type(screen.getByLabelText("Street and lot"), "12 Sampaguita St");
  await userEvent.type(screen.getByLabelText("Barangay and city"), "San Roque, Antipolo");
}

const place = () => screen.getByRole("button", { name: /^Place order/ });

describe("Checkout", () => {
  beforeEach(() => {
    sessionStorage.clear();
    mocks.session.data = null;
    mocks.replace.mockClear();
    mocks.saveSite.mockReset().mockResolvedValue({});
    mocks.listMySites.mockReset().mockResolvedValue([]);
    mocks.placeOrder.mockReset().mockResolvedValue({ kind: "placed", number: "MX-TEST1234" });
  });

  test("an empty cart goes back to the cart page", async () => {
    await show([]);
    expect(mocks.replace).toHaveBeenCalledWith("/cart");
    expect(screen.queryByRole("heading", { name: "Check out" })).not.toBeInTheDocument();
  });

  test("no account is needed to buy", async () => {
    await show(smallOrder());
    expect(screen.getByText(/No account needed/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/account?next=/checkout");
  });

  test("a form with gaps says what's missing, on the first gap, and sends nothing", async () => {
    await show(smallOrder());
    await userEvent.click(place());
    expect(mocks.placeOrder).not.toHaveBeenCalled();
    expect(screen.getByText("Enter a name for the driver to ask for.")).toBeInTheDocument();
    expect(screen.getByText("Enter a mobile number like 0917 123 4567.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText("Who should the driver ask for?")).toHaveFocus());
  });

  test("correcting a field clears its message", async () => {
    await show(smallOrder());
    await userEvent.click(place());
    await userEvent.type(screen.getByLabelText("Mobile number"), "0");
    expect(screen.queryByText("Enter a mobile number like 0917 123 4567.")).not.toBeInTheDocument();
  });

  test("placing the order sends the site and lines, empties the cart and opens the order", async () => {
    await show(smallOrder());
    await fillSite();
    await userEvent.click(place());

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/orders/MX-TEST1234?placed=1"));
    expect(mocks.placeOrder).toHaveBeenCalledTimes(1);
    expect(mocks.placeOrder.mock.calls[0][0]).toMatchObject({
      site: { contactName: "Rosa Santos", mobile: "0917 123 4567", street: "12 Sampaguita St", city: "San Roque, Antipolo", area: "Rizal" },
      paymentMethod: "gcash",
      lines: [{ slug: "portland-cement", variantId: "40-kg", sellerSlug: "dalisay-hardware", quantity: 2, unitPrice: 252 }],
    });
    expect(useCartStore.getState().lines).toHaveLength(0);
    // Emptying the cart must not bounce the buyer to /cart on the way to their order.
    expect(mocks.replace).not.toHaveBeenCalledWith("/cart");
    expect(sessionStorage.getItem("matexpress-checkout")).toBeNull();
  });

  test("pressing Place order twice makes one order", async () => {
    let finish!: (value: unknown) => void;
    mocks.placeOrder.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    await show(smallOrder());
    await fillSite();

    const button = place();
    await userEvent.dblClick(button);
    expect(mocks.placeOrder).toHaveBeenCalledTimes(1);
    expect(button).toBeDisabled();
    await act(async () => finish({ kind: "placed", number: "MX-TEST1234" }));
  });

  test("a price that changed stops the order, says so, and leaves the cart alone", async () => {
    mocks.placeOrder.mockResolvedValue({ kind: "changed", problems: [{ kind: "price", name: "Portland Cement", was: 252, now: 260 }] });
    await show(smallOrder());
    await fillSite();
    await userEvent.click(place());

    expect(await screen.findByText("Something in your cart changed, so nothing was charged.")).toBeInTheDocument();
    expect(screen.getByText("Portland Cement is now ₱260, was ₱252.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Review your cart/ })).toHaveAttribute("href", "/cart");
    expect(useCartStore.getState().lines).toHaveLength(1);
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  test("a lost connection can be retried safely: the second try carries the same key", async () => {
    mocks.placeOrder.mockRejectedValueOnce(new Error("offline"));
    await show(smallOrder());
    await fillSite();
    await userEvent.click(place());
    expect(await screen.findByText(/We couldn't reach the store/)).toBeInTheDocument();

    await userEvent.click(await screen.findByRole("button", { name: /^Place order/ }));
    await waitFor(() => expect(mocks.placeOrder).toHaveBeenCalledTimes(2));
    expect(mocks.placeOrder.mock.calls[1][0].idempotencyKey).toBe(mocks.placeOrder.mock.calls[0][0].idempotencyKey);
  });

  test("a reply lost on a bad connection can't become a second order after a refresh", async () => {
    mocks.placeOrder.mockRejectedValueOnce(new Error("offline"));
    await show(smallOrder());
    await fillSite();
    await userEvent.click(place());
    expect(await screen.findByText(/We couldn't reach the store/)).toBeInTheDocument();
    cleanup();

    render(<Checkout sellers={sellerDirectory(sellers)} />);
    await userEvent.click(await screen.findByRole("button", { name: /^Place order/ }));
    await waitFor(() => expect(mocks.placeOrder).toHaveBeenCalledTimes(2));
    expect(mocks.placeOrder.mock.calls[1][0].idempotencyKey).toBe(mocks.placeOrder.mock.calls[0][0].idempotencyKey);
  });

  test("a different order gets a different key, so it's never answered with the old one", async () => {
    mocks.placeOrder.mockRejectedValueOnce(new Error("offline"));
    await show(smallOrder());
    await fillSite();
    await userEvent.click(place());
    expect(await screen.findByText(/We couldn't reach the store/)).toBeInTheDocument();
    await act(async () => useCartStore.getState().setQuantity(useCartStore.getState().lines[0].id, 3));

    await userEvent.click(await screen.findByRole("button", { name: /^Place order/ }));
    await waitFor(() => expect(mocks.placeOrder).toHaveBeenCalledTimes(2));
    expect(mocks.placeOrder.mock.calls[1][0].idempotencyKey).not.toBe(mocks.placeOrder.mock.calls[0][0].idempotencyKey);
  });

  test("a placed order forgets its key, so the next one is new", async () => {
    await show(smallOrder());
    await fillSite();
    await userEvent.click(place());
    await waitFor(() => expect(mocks.replace).toHaveBeenCalled());
    expect(sessionStorage.getItem("matexpress-checkout-attempt")).toBeNull();
  });

  test("an area changed elsewhere in the store shows here, and goes with the order", async () => {
    await show(smallOrder());
    await act(async () => usePreferences.getState().setArea("Cavite"));
    expect(screen.getByLabelText("Area")).toHaveValue("Cavite");
    await fillSite();
    await userEvent.click(place());
    await waitFor(() => expect(mocks.placeOrder).toHaveBeenCalled());
    expect(mocks.placeOrder.mock.calls[0][0].site.area).toBe("Cavite");
  });

  test("if the server says a big truck is coming, the question appears even when this cart looks light", async () => {
    mocks.placeOrder.mockResolvedValue({ kind: "invalid", errors: { truckAccess: "Tell us whether a big truck can reach the gate." } });
    await show(smallOrder());
    await fillSite();
    expect(screen.queryByText(/Can it reach the gate/)).not.toBeInTheDocument();
    await userEvent.click(place());
    expect(await screen.findByText("Tell us whether a big truck can reach the gate.")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Not sure, call me first" })).toBeInTheDocument();
  });

  describe("late in the morning", () => {
    beforeEach(() => vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-02T13:30:00+08:00") }));
    afterEach(() => vi.useRealTimers());

    test("a window that's already gone can't be picked, and today's order goes in the later one", async () => {
      await show(smallOrder());
      expect(screen.getByRole("radio", { name: "8 AM to 12 NN" })).toBeDisabled();
      expect(screen.getByRole("radio", { name: "1 PM to 5 PM" })).toBeChecked();
      await fillSite();
      await userEvent.click(place());
      await waitFor(() => expect(mocks.placeOrder).toHaveBeenCalled());
      expect(mocks.placeOrder.mock.calls[0][0]).toMatchObject({ deliveryDate: "2026-11-02", deliveryWindow: "1 PM to 5 PM" });
    });

    test("tomorrow has both windows", async () => {
      await show(smallOrder());
      await userEvent.click(screen.getAllByRole("radio", { name: /Nov/ })[1]);
      expect(screen.getByRole("radio", { name: "8 AM to 12 NN" })).toBeEnabled();
    });
  });

  test("too many orders in a few minutes says so, and leaves the cart alone", async () => {
    mocks.placeOrder.mockResolvedValue({ kind: "limited" });
    await show(smallOrder());
    await fillSite();
    await userEvent.click(place());
    expect(await screen.findByText(/That's a lot of orders in a few minutes/)).toBeInTheDocument();
    expect(useCartStore.getState().lines).toHaveLength(1);
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  test("a load that needs a big truck asks if it can reach the gate", async () => {
    await show(bigLoad());
    await fillSite();
    await userEvent.click(place());
    expect(mocks.placeOrder).not.toHaveBeenCalled();
    expect(screen.getByText("Tell us whether a big truck can reach the gate.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("radio", { name: "Yes, the road is wide enough" }));
    await userEvent.click(place());
    await waitFor(() => expect(mocks.placeOrder.mock.calls[0]?.[0].truckAccess).toBe("wide"));
  });

  test("a small load doesn't ask about trucks at all", async () => {
    await show(smallOrder());
    expect(screen.queryByText(/Can it reach the gate/)).not.toBeInTheDocument();
  });

  test("the fee follows the area, and the button shows the amount", async () => {
    await show(smallOrder());
    expect(place()).toHaveTextContent(formatPeso(504 + deliveryFee("Rizal", 504)));
    await userEvent.selectOptions(screen.getByLabelText("Area"), "Bulacan");
    expect(place()).toHaveTextContent(formatPeso(504 + deliveryFee("Bulacan", 504)));
    expect(usePreferences.getState().area).toBe("Bulacan");
  });

  test("what's been typed survives a refresh, in this tab", async () => {
    await show(smallOrder());
    await userEvent.type(screen.getByLabelText("Street and lot"), "12 Sampaguita St");
    expect(JSON.parse(sessionStorage.getItem("matexpress-checkout")!).street).toBe("12 Sampaguita St");
  });

  describe("signed in", () => {
    const site = { id: "s1", contactName: "Rosa Santos", mobile: "+639171234567", street: "45 Saved Rd", city: "San Roque, Antipolo", area: "Cavite", notes: "" };

    beforeEach(() => {
      mocks.session.data = { user: { id: "u1", email: "rosa@example.com" } };
      mocks.listMySites.mockResolvedValue([site]);
    });

    test("the usual site is ready to go", async () => {
      await show(smallOrder());
      await waitFor(() => expect(screen.getByLabelText("Street and lot")).toHaveValue("45 Saved Rd"));
      expect(screen.getByLabelText("Mobile number")).toHaveValue("0917 123 4567");
      expect(screen.getByLabelText("Area")).toHaveValue("Cavite");
      expect(screen.getByRole("button", { name: /45 Saved Rd/ })).toHaveAttribute("aria-pressed", "true");
    });

    test("it never overwrites what's already been typed", async () => {
      sessionStorage.setItem("matexpress-checkout", JSON.stringify({ street: "99 Typed St" }));
      await show(smallOrder());
      await waitFor(() => expect(screen.getByRole("button", { name: /45 Saved Rd/ })).toHaveAttribute("aria-pressed", "false"));
      expect(screen.getByLabelText("Street and lot")).toHaveValue("99 Typed St");
    });

    test("saved sites failing to load leaves a form that still works", async () => {
      mocks.listMySites.mockRejectedValue(new Error("offline"));
      await show(smallOrder());
      await waitFor(() => expect(mocks.listMySites).toHaveBeenCalled());
      expect(screen.queryByRole("group", { name: "Saved sites" })).not.toBeInTheDocument();
      expect(screen.getByLabelText("Street and lot")).toBeEnabled();
    });

    test("a site that fails to save can't make a placed order look failed", async () => {
      mocks.listMySites.mockResolvedValue([]);
      mocks.saveSite.mockRejectedValue(new Error("offline"));
      await show(smallOrder());
      await fillSite();
      await userEvent.click(screen.getByRole("checkbox", { name: "Save this site to my account" }));
      await userEvent.click(place());
      await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/orders/MX-TEST1234?placed=1"));
      expect(mocks.saveSite).toHaveBeenCalled();
      expect(screen.queryByText(/We couldn't reach the store/)).not.toBeInTheDocument();
    });
  });
});
