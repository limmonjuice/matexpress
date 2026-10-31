import { beforeEach, describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getProduct } from "@/lib/catalog/home-content";
import { cartCount, useCartStore } from "@/stores/cart-store";
import { usePreferences } from "@/stores/preferences-store";
import { ProductCard } from "./product-card";

const cement = getProduct("portland-cement")!;

describe("ProductCard", () => {
  beforeEach(() => {
    useCartStore.setState({ lines: [] });
    usePreferences.setState({ saved: [] });
  });

  test("shows the price, the old price and the discount", () => {
    render(<ProductCard product={cement} />);
    expect(screen.getByText("₱252")).toBeInTheDocument();
    expect(screen.getByText("₱265")).toBeInTheDocument();
    expect(screen.getByText("5% off")).toBeInTheDocument();
  });

  test("a product with no old price shows no discount", () => {
    render(<ProductCard product={{ ...cement, listPrice: undefined }} />);
    expect(screen.queryByText(/% off/)).not.toBeInTheDocument();
  });

  test("a product with no rating still renders", () => {
    render(<ProductCard product={{ ...cement, rating: undefined, reviewCount: undefined }} />);
    expect(screen.queryByRole("img", { name: /rated/i })).not.toBeInTheDocument();
    expect(screen.getByText("5 sellers")).toBeInTheDocument();
  });

  test("a section can hide the badge that repeats its own title", () => {
    render(<ProductCard product={{ ...cement, badge: "New" }} hideBadge="New" />);
    expect(screen.queryByText("New")).not.toBeInTheDocument();
  });

  test("hiding one badge leaves the others", () => {
    render(<ProductCard product={{ ...cement, badge: "Deal" }} hideBadge="New" />);
    expect(screen.getByText("Deal")).toBeInTheDocument();
  });

  test("one seller is singular", () => {
    render(<ProductCard product={{ ...cement, sellerCount: 1 }} />);
    expect(screen.getByText("1 seller")).toBeInTheDocument();
  });

  test("the name links to the product", () => {
    render(<ProductCard product={cement} />);
    expect(screen.getByRole("link", { name: cement.name })).toHaveAttribute("href", "/products/portland-cement");
  });

  test("adding puts the top seller's offer in the cart", async () => {
    render(<ProductCard product={cement} />);
    await userEvent.click(screen.getByRole("button", { name: `Add: ${cement.name}` }));
    const { lines } = useCartStore.getState();
    expect(cartCount(lines)).toBe(1);
    expect(lines[0]).toMatchObject({ price: 252, seller: cement.topSeller });
    expect(screen.getByRole("status")).toHaveTextContent(`${cement.name} added to cart`);
  });

  test("the heart saves and unsaves", async () => {
    render(<ProductCard product={cement} />);
    const heart = screen.getByRole("button", { name: `Save ${cement.name}` });
    await userEvent.click(heart);
    expect(heart).toHaveAttribute("aria-pressed", "true");
    expect(usePreferences.getState().saved).toContain(cement.slug);
    await userEvent.click(heart);
    expect(heart).toHaveAttribute("aria-pressed", "false");
  });
});
