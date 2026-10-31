import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toLine } from "@/lib/catalog/card";
import { productBySlug } from "@/lib/catalog/data/products";
import { useCartStore } from "@/stores/cart-store";
import { BuyAgainButton, TrackForm } from "./order-bits";

const mocks = vi.hoisted(() => ({ lookupOrder: vi.fn(), buyAgain: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/auth-client", () => ({ authClient: {} }));
vi.mock("@/lib/orders/actions", () => ({ lookupOrder: mocks.lookupOrder, buyAgain: mocks.buyAgain, claimBrowserOrders: vi.fn() }));

describe("TrackForm", () => {
  beforeEach(() => mocks.lookupOrder.mockReset());

  test("a failed lookup says so and leaves both fields to correct", async () => {
    mocks.lookupOrder.mockResolvedValue({ error: "We couldn't find an order with that number and mobile." });
    render(<TrackForm />);
    await userEvent.type(screen.getByLabelText("Order number"), "MX-AAAA1111");
    await userEvent.type(screen.getByLabelText("Mobile number on the order"), "0917 000 0000");
    await userEvent.click(screen.getByRole("button", { name: "Track this order" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't find an order");
    expect(screen.getByLabelText("Order number")).toHaveValue("MX-AAAA1111");
    expect(screen.getByLabelText("Mobile number on the order")).toHaveValue("0917 000 0000");
  });

  test("a link with a number in it only needs the mobile", () => {
    render(<TrackForm initialNumber="MX-AAAA1111" />);
    expect(screen.getByLabelText("Order number")).toHaveValue("MX-AAAA1111");
    expect(screen.getByLabelText("Mobile number on the order")).toHaveValue("");
  });
});

describe("BuyAgainButton", () => {
  const rebar = productBySlug("deformed-rebar")!;
  const twelve = rebar.variants.find((v) => v.id === "12-mm")!;
  const line = toLine(rebar, twelve, twelve.offers[0]);

  beforeEach(() => {
    mocks.buyAgain.mockReset();
    useCartStore.setState({ lines: [], isOpen: false });
  });

  test("refills the cart with the old quantities and opens it", async () => {
    mocks.buyAgain.mockResolvedValue({ lines: [{ ...line, quantity: 200 }], unavailable: [] });
    render(<BuyAgainButton number="MX-AAAA1111" />);
    await userEvent.click(screen.getByRole("button", { name: "Buy again" }));
    await waitFor(() => expect(useCartStore.getState().lines).toMatchObject([{ id: line.id, quantity: 200 }]));
    expect(useCartStore.getState().isOpen).toBe(true);
  });

  test("says what can no longer be bought", async () => {
    mocks.buyAgain.mockResolvedValue({ lines: [], unavailable: ["Discontinued Item"] });
    render(<BuyAgainButton number="MX-AAAA1111" />);
    await userEvent.click(screen.getByRole("button", { name: "Buy again" }));
    expect(await screen.findByText("No longer available: Discontinued Item.")).toBeInTheDocument();
    expect(useCartStore.getState().isOpen).toBe(false);
  });
});
