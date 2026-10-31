import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toLine } from "@/lib/catalog/card";
import { productBySlug } from "@/lib/catalog/data/products";
import { useCartStore } from "@/stores/cart-store";
import { BuyAgainButton, CreateAccountOffer, ForgetOrdersButton, TrackForm } from "./order-bits";

const mocks = vi.hoisted(() => ({ lookupOrder: vi.fn(), buyAgain: vi.fn(), claimOrder: vi.fn(), forgetBrowserOrders: vi.fn(), signUp: vi.fn(), refresh: vi.fn(), assign: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("@/lib/auth-client", () => ({ authClient: { signUp: { email: mocks.signUp } } }));
vi.mock("@/lib/orders/actions", () => ({ lookupOrder: mocks.lookupOrder, buyAgain: mocks.buyAgain, claimOrder: mocks.claimOrder, forgetBrowserOrders: mocks.forgetBrowserOrders }));

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

describe("CreateAccountOffer", () => {
  beforeEach(() => vi.clearAllMocks());

  const fill = async () => {
    await userEvent.type(screen.getByLabelText("Email"), "rosa@example.com");
    await userEvent.type(screen.getByLabelText("Choose a password"), "longenough");
    await userEvent.click(screen.getByRole("button", { name: "Create my account" }));
  };

  test("keeps this order in the new account, and only this one", async () => {
    mocks.signUp.mockResolvedValue({ error: null });
    render(<CreateAccountOffer name="Rosa Santos" number="MX-AAAA1111" />);
    await fill();
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
    expect(mocks.claimOrder).toHaveBeenCalledWith("MX-AAAA1111");
  });

  test("an email already in use says to sign in, and the order stays put", async () => {
    mocks.signUp.mockResolvedValue({ error: { message: "User already exists" } });
    render(<CreateAccountOffer name="Rosa Santos" number="MX-AAAA1111" />);
    await fill();
    expect(await screen.findByRole("alert")).toHaveTextContent("Try signing in");
    expect(mocks.claimOrder).not.toHaveBeenCalled();
  });

  test("a dropped connection stays on the form", async () => {
    mocks.signUp.mockRejectedValue(new Error("offline"));
    render(<CreateAccountOffer name="Rosa Santos" number="MX-AAAA1111" />);
    await fill();
    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't reach the store");
  });
});

describe("ForgetOrdersButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("location", { ...window.location, assign: mocks.assign });
  });
  afterEach(() => vi.unstubAllGlobals());

  test("forgets this browser's orders and reloads, leaving nothing in memory", async () => {
    mocks.forgetBrowserOrders.mockResolvedValue(undefined);
    render(<ForgetOrdersButton />);
    await userEvent.click(screen.getByRole("button", { name: "Forget these on this computer" }));
    await waitFor(() => expect(mocks.assign).toHaveBeenCalledWith("/track"));
    expect(mocks.forgetBrowserOrders).toHaveBeenCalled();
  });

  test("a failure stays on the button", async () => {
    mocks.forgetBrowserOrders.mockRejectedValue(new Error("offline"));
    render(<ForgetOrdersButton />);
    await userEvent.click(screen.getByRole("button", { name: "Forget these on this computer" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't reach the store");
    expect(mocks.assign).not.toHaveBeenCalled();
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

  test("a dropped connection stays on the button, not the whole page", async () => {
    mocks.buyAgain.mockRejectedValue(new Error("offline"));
    render(<BuyAgainButton number="MX-AAAA1111" />);
    await userEvent.click(screen.getByRole("button", { name: "Buy again" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't reach the store");
  });

  test("says what can no longer be bought", async () => {
    mocks.buyAgain.mockResolvedValue({ lines: [], unavailable: ["Discontinued Item"] });
    render(<BuyAgainButton number="MX-AAAA1111" />);
    await userEvent.click(screen.getByRole("button", { name: "Buy again" }));
    expect(await screen.findByText("No longer available: Discontinued Item.")).toBeInTheDocument();
    expect(useCartStore.getState().isOpen).toBe(false);
  });
});
