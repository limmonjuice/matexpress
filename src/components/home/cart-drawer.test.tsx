import { beforeEach, describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toLine } from "@/lib/catalog/card";
import { productBySlug } from "@/lib/catalog/data/products";
import { useCartStore } from "@/stores/cart-store";
import { CartDrawer } from "./cart-drawer";

const rebar = productBySlug("deformed-rebar")!;
const twelve = rebar.variants.find((v) => v.id === "12-mm")!;
const bakal = twelve.offers.find((o) => o.sellerSlug === "bakal-supply")!;
const tibay = twelve.offers.find((o) => o.sellerSlug === "tibay-steel")!;

const field = () => screen.getByRole("textbox", { name: "Quantity of Deformed Rebar" });

async function typeQuantity(value: string) {
  await userEvent.clear(field());
  await userEvent.type(field(), value);
  await userEvent.tab();
}

describe("CartDrawer", () => {
  beforeEach(() => {
    useCartStore.setState({ lines: [{ ...toLine(rebar, twelve, bakal), quantity: 1 }], isOpen: true });
  });

  test("a typed quantity sticks, and the subtotal moves to the volume price", async () => {
    render(<CartDrawer />);
    await typeQuantity("500");
    expect(useCartStore.getState().lines[0].quantity).toBe(500);
    expect(screen.getByText("₱214 / length · Bakal Supply")).toBeInTheDocument();
    expect(screen.getByText("Subtotal").parentElement).toHaveTextContent("₱107,000");
  });

  test("more than the seller has is lowered, and it says why", async () => {
    render(<CartDrawer />);
    await typeQuantity("9999");
    expect(useCartStore.getState().lines[0].quantity).toBe(bakal.stock);
    expect(screen.getByText(`Only ${bakal.stock.toLocaleString("en-PH")} left from this seller.`)).toBeInTheDocument();
  });

  test("something that isn't a number leaves the minimum, and never an empty line", async () => {
    render(<CartDrawer />);
    await typeQuantity("abc");
    expect(useCartStore.getState().lines[0].quantity).toBe(1);
  });

  test("the plus button can't go past what the seller has", () => {
    useCartStore.setState({ lines: [{ ...toLine(rebar, twelve, bakal), quantity: bakal.stock }] });
    render(<CartDrawer />);
    expect(screen.getByRole("button", { name: "More Deformed Rebar" })).toBeDisabled();
  });

  test("says which truck the load needs, and how much more for free delivery", () => {
    render(<CartDrawer />);
    expect(screen.getByText("5.3 kg on a Multicab")).toBeInTheDocument();
    expect(screen.getByText("₱24,764 more for free delivery")).toBeInTheDocument();
  });

  test("two sellers still make one delivery", () => {
    useCartStore.setState({ lines: [...useCartStore.getState().lines, { ...toLine(rebar, twelve, tibay), quantity: 1 }] });
    render(<CartDrawer />);
    expect(screen.getByText(/2 sellers, one delivery/)).toBeInTheDocument();
  });

  test("Remove takes the line off, down to an empty truck", async () => {
    render(<CartDrawer />);
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(useCartStore.getState().lines).toHaveLength(0);
    expect(screen.getByText(/Your truck is empty/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Explore materials/ })).toHaveAttribute("href", "/categories");
  });

  test("leads to the cart and to checkout", () => {
    render(<CartDrawer />);
    expect(screen.getByRole("link", { name: "View cart" })).toHaveAttribute("href", "/cart");
    expect(screen.getByRole("link", { name: "Check out" })).toHaveAttribute("href", "/checkout");
  });

  test("Escape closes it", async () => {
    render(<CartDrawer />);
    await userEvent.keyboard("{Escape}");
    expect(useCartStore.getState().isOpen).toBe(false);
  });
});
