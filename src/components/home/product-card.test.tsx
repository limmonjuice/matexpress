import { beforeEach, describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toCard } from "@/lib/catalog/card";
import { productBySlug } from "@/lib/catalog/data/products";
import { useCartStore } from "@/stores/cart-store";
import { usePreferences } from "@/stores/preferences-store";
import { ProductCard } from "./product-card";

const cement = toCard(productBySlug("portland-cement")!);
const rebar16 = toCard(productBySlug("deformed-rebar")!, { variantId: "16-mm" });
const blocks = toCard(productBySlug("hollow-block")!);
const sand = toCard(productBySlug("washed-sand")!);

describe("ProductCard", () => {
  beforeEach(() => {
    useCartStore.setState({ lines: [] });
    usePreferences.setState({ saved: [], area: "Rizal" });
  });

  test("only a card on the first screen fetches its photo right away", () => {
    const { container, unmount } = render(<ProductCard product={cement} eager />);
    expect(container.querySelector("img")).toHaveAttribute("loading", "eager");
    unmount();
    const later = render(<ProductCard product={cement} />);
    expect(later.container.querySelector("img")).toHaveAttribute("loading", "lazy");
  });

  test("shows the price, the old price and the discount", () => {
    render(<ProductCard product={cement} />);
    expect(screen.getByText("₱252")).toBeInTheDocument();
    expect(screen.getByText("₱265")).toBeInTheDocument();
    expect(screen.getByText("5% off")).toBeInTheDocument();
  });

  test("a product with no old price shows its price per unit instead", () => {
    render(<ProductCard product={{ ...cement, listPrice: undefined }} />);
    expect(screen.queryByText(/% off/)).not.toBeInTheDocument();
    expect(screen.getByText("₱6.30/kg")).toBeInTheDocument();
  });

  test("shows the spec, separate from the name", () => {
    render(<ProductCard product={cement} />);
    expect(screen.getByText("40 kg bag, ASTM C150")).toBeInTheDocument();
  });

  test("says how many sizes there are when there's more than one", () => {
    render(<ProductCard product={rebar16} />);
    expect(screen.getByText("4 sizes")).toBeInTheDocument();
  });

  test("says when it would arrive", () => {
    render(<ProductCard product={cement} />);
    expect(screen.getByText(/^Arrives (today|tomorrow|\w{3}, \w{3} \d+)$/)).toBeInTheDocument();
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

  test("the name links to the product, on the shown size", () => {
    const { unmount } = render(<ProductCard product={cement} />);
    expect(screen.getByRole("link", { name: cement.name })).toHaveAttribute("href", "/products/portland-cement");
    unmount();
    render(<ProductCard product={rebar16} />);
    expect(screen.getByRole("link", { name: rebar16.name })).toHaveAttribute("href", "/products/deformed-rebar?size=16-mm");
  });

  test("adding puts the shown seller's offer in the cart", async () => {
    render(<ProductCard product={cement} />);
    await userEvent.click(screen.getByRole("button", { name: `Add: ${cement.name}` }));
    const { lines } = useCartStore.getState();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ price: 252, seller: "Dalisay Hardware", quantity: 1 });
    expect(screen.getByRole("status")).toHaveTextContent(`${cement.name} added to cart`);
  });

  test("adding respects the minimum order", async () => {
    render(<ProductCard product={blocks} />);
    await userEvent.click(screen.getByRole("button", { name: `Add: ${blocks.name}` }));
    expect(useCartStore.getState().lines[0].quantity).toBe(50);
  });

  test("sand starts at one cubic metre", async () => {
    render(<ProductCard product={sand} />);
    await userEvent.click(screen.getByRole("button", { name: `Add: ${sand.name}` }));
    expect(useCartStore.getState().lines[0].quantity).toBe(1);
  });

  test("out of stock can't be added and says so", () => {
    render(<ProductCard product={{ ...cement, inStock: false }} />);
    expect(screen.getByRole("button", { name: `Add: ${cement.name}` })).toBeDisabled();
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
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
