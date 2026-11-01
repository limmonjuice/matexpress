import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { productBySlug } from "@/db/sample/products";
import { sellers } from "@/db/sample/sellers";
import { sellerDirectory } from "@/lib/catalog/card";
import type { Product } from "@/lib/catalog/types";
import { deliveryFee } from "@/lib/delivery";
import { formatPeso } from "@/lib/format";
import { useCartStore } from "@/stores/cart-store";
import { usePreferences } from "@/stores/preferences-store";
import { ProductView } from "./product-view";

const url = vi.hoisted(() => ({ search: "" }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(url.search) }));

const rebar = productBySlug("deformed-rebar")!;
const blocks = productBySlug("hollow-block")!;
const directory = sellerDirectory(sellers);

const show = (product: Product) => render(<ProductView product={product} sellers={directory} specsFor={product.variants.map(() => ({ Standard: "PNS 49" }))} />);

const quantity = (product: Product) => screen.getByRole("textbox", { name: `Quantity of ${product.name}` });

async function type(product: Product, value: string) {
  await userEvent.clear(quantity(product));
  await userEvent.type(quantity(product), value);
}

/** The sellers in the order the canvass ranks them. */
const rowOrder = () => screen.getAllByRole("radio", { name: /·|Only|Out of stock/ }).map((radio) => radio.id.replace("hm-offer-", ""));

const costRow = (label: RegExp | string) => screen.getByText(label).closest("div")!;

describe("ProductView", () => {
  beforeEach(() => {
    url.search = "";
    window.history.replaceState(null, "", "/");
    useCartStore.setState({ lines: [], isOpen: false });
    usePreferences.setState({ saved: [], area: "Rizal" });
  });

  test("opens on the usual size, with the cheapest seller chosen", () => {
    show(rebar);
    expect(screen.getByRole("radio", { name: "12 mm" })).toBeChecked();
    expect(rowOrder()[0]).toBe("tibay-steel");
    expect(screen.getByRole("radio", { name: /Tibay Steel/ })).toBeChecked();
    expect(screen.getByText("Lowest total")).toBeInTheDocument();
  });

  test("typing a bigger quantity re-ranks the sellers at their volume prices, before leaving the field", async () => {
    show(rebar);
    await type(rebar, "500");
    expect(rowOrder()[0]).toBe("bakal-supply");
    expect(screen.getByRole("radio", { name: /Bakal Supply/ })).toBeChecked();
    expect(screen.getByText("₱214")).toBeInTheDocument();
    expect(screen.getByText("₱107,000", { selector: ".hm-offer-price b" })).toBeInTheDocument();
  });

  test("a seller without enough stock drops down, says what it has, and can't be chosen", async () => {
    show(rebar);
    await type(rebar, "500");
    const dalisay = screen.getByRole("radio", { name: /Dalisay Hardware/ });
    expect(dalisay).toBeDisabled();
    expect(screen.getByText(/Only 300 left/)).toBeInTheDocument();
  });

  test("the soonest seller is marked when it isn't also the cheapest", async () => {
    show(rebar);
    await type(rebar, "500");
    expect(within(screen.getByRole("radio", { name: /Tibay Steel/ }).parentElement!).getByText("Soonest")).toBeInTheDocument();
  });

  test("adding uses the chosen seller and the typed quantity, at its volume price", async () => {
    show(rebar);
    await type(rebar, "500");
    await userEvent.click(screen.getAllByRole("button", { name: "Add to cart" })[0]);
    const { lines, isOpen } = useCartStore.getState();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ sellerSlug: "bakal-supply", variantId: "12-mm", quantity: 500 });
    expect(isOpen).toBe(true);
  });

  test("picking a dearer seller is allowed, and it says what that costs", async () => {
    show(rebar);
    await userEvent.click(screen.getByRole("radio", { name: /Dalisay Hardware/ }));
    expect(screen.getByRole("radio", { name: /Dalisay Hardware/ })).toBeChecked();
    expect(screen.getByText(/Tibay Steel would save you ₱9 at this quantity/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Switch" }));
    expect(screen.getByRole("radio", { name: /Tibay Steel/ })).toBeChecked();
    expect(screen.queryByText(/would save you/)).not.toBeInTheDocument();
  });

  test("a size changes the sellers and the address, so the link can be shared", async () => {
    show(rebar);
    await userEvent.click(screen.getByRole("radio", { name: "16 mm" }));
    expect(screen.getByRole("radio", { name: "16 mm" })).toBeChecked();
    expect(window.location.search).toBe("?size=16-mm");
    await userEvent.click(screen.getByRole("radio", { name: "12 mm" }));
    expect(window.location.search).toBe("");
  });

  test("a link with ?size= opens on that size", () => {
    url.search = "size=16-mm";
    show(rebar);
    expect(screen.getByRole("radio", { name: "16 mm" })).toBeChecked();
  });

  describe("opened from a link with ?size=, as every cart and order link is", () => {
    beforeEach(() => {
      url.search = "size=16-mm";
    });

    test("picking a seller stays picked", async () => {
      show(rebar);
      await userEvent.click(screen.getByRole("radio", { name: /Dalisay Hardware/ }));
      expect(screen.getByRole("radio", { name: /Dalisay Hardware/ })).toBeChecked();
    });

    test("typing still re-ranks, and a note about the quantity stays", async () => {
      show(rebar);
      const before = rowOrder()[0];
      await type(rebar, "500");
      expect(screen.getByRole("radio", { name: "16 mm" })).toBeChecked();
      expect(rowOrder()[0]).toBe("bakal-supply");
      expect(before).toBe("tibay-steel");
      await type(rebar, "1.5");
      await userEvent.tab();
      expect(screen.getByText("Whole units only.")).toBeInTheDocument();
    });

    test("a seller and a quantity survive the size being set again by the same link", async () => {
      const { rerender } = show(rebar);
      await userEvent.click(screen.getByRole("radio", { name: /Dalisay Hardware/ }));
      rerender(<ProductView product={rebar} sellers={directory} specsFor={rebar.variants.map(() => ({ Standard: "PNS 49" }))} />);
      expect(screen.getByRole("radio", { name: /Dalisay Hardware/ })).toBeChecked();
    });
  });

  test("a page kept alive follows its address back to the usual size", () => {
    url.search = "size=16-mm";
    const { rerender } = show(rebar);
    expect(screen.getByRole("radio", { name: "16 mm" })).toBeChecked();
    url.search = "";
    rerender(<ProductView product={rebar} sellers={directory} specsFor={rebar.variants.map(() => ({ Standard: "PNS 49" }))} />);
    expect(screen.getByRole("radio", { name: "12 mm" })).toBeChecked();
  });

  test("adding while the field still holds a bad number adds what the seller can sell", async () => {
    show(blocks);
    await type(blocks, "3");
    await userEvent.click(screen.getAllByRole("button", { name: "Add to cart" })[0]);
    expect(useCartStore.getState().lines[0].quantity).toBe(50);
  });

  test("a split never leaves a seller less than the minimum", async () => {
    show(blocks);
    await type(blocks, "11010");
    await userEvent.click(screen.getByRole("button", { name: "Add both to cart" }));
    const { lines } = useCartStore.getState();
    expect(lines.reduce((sum, line) => sum + line.quantity, 0)).toBe(11010);
    lines.forEach((line) => expect(line.quantity).toBeGreaterThanOrEqual(50));
  });

  test("a link with a size that doesn't exist opens on the usual one", () => {
    url.search = "size=99-mm";
    show(rebar);
    expect(screen.getByRole("radio", { name: "12 mm" })).toBeChecked();
  });

  test("a quantity below the minimum is raised, and it says why", async () => {
    show(blocks);
    expect(quantity(blocks)).toHaveValue("50");
    expect(screen.getByText("Minimum 50")).toBeInTheDocument();
    await type(blocks, "3");
    await userEvent.tab();
    expect(quantity(blocks)).toHaveValue("50");
    expect(screen.getByText("The minimum order is 50.")).toBeInTheDocument();
  });

  test("the quick quantities fill it in", async () => {
    show(rebar);
    await userEvent.click(screen.getByRole("button", { name: "100" }));
    expect(quantity(rebar)).toHaveValue("100");
    expect(screen.getByRole("button", { name: "100" })).toHaveAttribute("aria-pressed", "true");
    expect(rowOrder()[0]).toBe("bakal-supply");
  });

  test("a sold-out seller can't be chosen, and the next one is", () => {
    const [variant] = rebar.variants.filter((v) => v.id === "12-mm");
    const soldOut: Product = {
      ...rebar,
      variants: rebar.variants.map((v) => (v === variant ? { ...v, offers: v.offers.map((o) => (o.sellerSlug === "tibay-steel" ? { ...o, stock: 0 } : o)) } : v)),
    };
    show(soldOut);
    expect(screen.getByRole("radio", { name: /Tibay Steel/ })).toBeDisabled();
    expect(screen.getByText(/Out of stock/)).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Bakal Supply/ })).toBeChecked();
  });

  test("with nothing left anywhere, it can't be added", () => {
    const gone: Product = { ...rebar, variants: rebar.variants.map((v) => ({ ...v, offers: v.offers.map((o) => ({ ...o, stock: 0 })) })) };
    show(gone);
    expect(screen.getAllByText("Out of stock").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Out of stock" })).toBeDisabled();
  });

  test("the cost panel adds up, and changing the area changes the fee", async () => {
    show(rebar);
    const fee = deliveryFee("Rizal", 232);
    expect(costRow("1 × ₱232")).toHaveTextContent("₱232");
    expect(costRow("Total")).toHaveTextContent(formatPeso(232 + fee));

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Delivery area" }), "Bulacan");
    expect(usePreferences.getState().area).toBe("Bulacan");
    expect(costRow("Total")).toHaveTextContent(formatPeso(232 + deliveryFee("Bulacan", 232)));
  });

  test("a big enough order says delivery is free", async () => {
    show(rebar);
    await type(rebar, "500");
    expect(screen.getByText("Free delivery on this order")).toBeInTheDocument();
    expect(costRow("Total")).toHaveTextContent("₱107,000");
  });

  test("the truck in the panel grows with the quantity", async () => {
    show(rebar);
    expect(screen.getByText("Fits a Multicab")).toBeInTheDocument();
    await type(rebar, "500");
    expect(screen.getByText("Fits an Elf truck")).toBeInTheDocument();
  });

  test("more than any one seller holds is split between them, and adds as one", async () => {
    show(rebar);
    await type(rebar, "3000");
    expect(screen.getByText("No single seller holds 3,000.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose a smaller quantity" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Add both to cart" }));
    const { lines } = useCartStore.getState();
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.reduce((sum, line) => sum + line.quantity, 0)).toBe(3000);
    expect(new Set(lines.map((l) => l.sellerSlug)).size).toBe(lines.length);
  });

  test("the heart saves it", async () => {
    show(rebar);
    await userEvent.click(screen.getByRole("button", { name: "Save Deformed Rebar" }));
    expect(usePreferences.getState().saved).toContain("deformed-rebar");
  });
});
