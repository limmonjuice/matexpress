import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { products } from "@/lib/catalog/data/products";
import { parseListingParams, queryProducts, type ListingScope } from "@/lib/catalog/listing";
import { ListingView } from "./listing-view";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

const STEEL = "/categories/steel-rebar";

function show(raw: Record<string, string | string[]> = {}, scope: ListingScope = { categorySlug: "steel-rebar" }, pathname = STEEL) {
  const params = parseListingParams(raw);
  const { items, ...result } = queryProducts(products, scope, params);
  render(
    <ListingView pathname={pathname} params={params} result={result} shown={items.length} sorts={["best", "price-asc"]}>
      <li>The cards</li>
    </ListingView>,
  );
}

const sidebar = () => within(screen.getByRole("complementary", { name: "Filters" }));

describe("ListingView", () => {
  beforeEach(() => replace.mockClear());

  test("ticking a filter replaces the URL and keeps the scroll", async () => {
    show();
    await userEvent.click(sidebar().getByRole("checkbox", { name: /^16 mm/ }));
    expect(replace).toHaveBeenCalledWith(`${STEEL}?size=16+mm`, { scroll: false });
  });

  test("a value with nothing behind it can't be ticked", () => {
    show({ size: "16 mm", grade: "Grade 40" });
    expect(sidebar().getByRole("checkbox", { name: /^20 mm/ })).toBeDisabled();
    expect(sidebar().getByRole("checkbox", { name: /^12 mm/ })).toBeEnabled();
  });

  test("a ticked value can always be unticked, even with nothing left behind it", () => {
    show({ size: "16 mm", grade: "Grade 60" });
    expect(sidebar().getByRole("checkbox", { name: /^16 mm/ })).toBeEnabled();
  });

  test("a chip takes off its own filter", async () => {
    show({ size: "16 mm", grade: "Grade 40" });
    await userEvent.click(screen.getByRole("button", { name: "Remove filter: Size 16 mm" }));
    expect(replace).toHaveBeenCalledWith(`${STEEL}?grade=Grade+40`, { scroll: false });
  });

  test("Clear all takes off every filter", async () => {
    show({ size: "16 mm", grade: "Grade 40" });
    await userEvent.click(screen.getByRole("button", { name: "Clear all" }));
    expect(replace).toHaveBeenCalledWith(STEEL, { scroll: false });
  });

  test("the filter button counts what's applied", () => {
    show({ size: "16 mm", grade: "Grade 40" });
    expect(screen.getAllByRole("button", { name: /^Filter/ })[0]).toHaveTextContent("Filter2");
  });

  test("changing the sort replaces the URL and keeps the scroll", async () => {
    show();
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Sort by" }), "price-asc");
    expect(replace).toHaveBeenCalledWith(`${STEEL}?sort=price-asc`, { scroll: false });
  });

  test("Show more asks for the next batch and says how far along the list this is", () => {
    show({}, {}, "/products");
    expect(screen.getByRole("status")).toHaveTextContent("48 products");
    expect(screen.getByText("Showing 12 of 48")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Show more" })).toHaveAttribute("href", "/products?show=24");
  });

  test("Show more goes away at the end of the list", () => {
    show();
    expect(screen.queryByRole("link", { name: "Show more" })).not.toBeInTheDocument();
    expect(screen.getByText("Showing 6 of 6")).toBeInTheDocument();
  });

  test("no results say how to get them back, instead of an empty grid", async () => {
    show({ size: "16 mm", grade: "Grade 60" });
    expect(screen.getByRole("heading", { name: "Nothing matches all of those" })).toBeInTheDocument();
    expect(screen.queryByText("The cards")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Clear all filters" }));
    expect(replace).toHaveBeenCalledWith(STEEL, { scroll: false });
  });

  test("the types along the top narrow the list, and All undoes it", () => {
    show({ sub: "Tie wire" });
    expect(screen.getByRole("link", { name: /Tie wire/ })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "All" })).toHaveAttribute("href", STEEL);
  });

  test("the phone's drawer opens on its close button, and Escape returns to where you were", async () => {
    show();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const opener = screen.getAllByRole("button", { name: /^Filter/ })[0];
    await userEvent.click(opener);
    expect(screen.getByRole("dialog", { name: "Filters" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close filters" })).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  test("the drawer's filters work too, and its button says how many it will show", async () => {
    show({ size: "16 mm" });
    await userEvent.click(screen.getAllByRole("button", { name: /^Filter/ })[0]);
    const drawer = within(screen.getByRole("dialog", { name: "Filters" }));
    await userEvent.click(drawer.getByRole("checkbox", { name: /^12 mm/ }));
    expect(replace).toHaveBeenCalledWith(`${STEEL}?size=16+mm&size=12+mm`, { scroll: false });
    await userEvent.click(drawer.getByRole("button", { name: "Show 1 product" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("a long list of options starts short, and a ticked one stays in view", async () => {
    show({ size: "Φ20" });
    const size = sidebar().getByRole("group", { name: "Size" });
    const more = within(size).getByRole("button", { name: /^Show all/ });
    const short = within(size).getAllByRole("checkbox").length;
    await userEvent.click(more);
    expect(within(size).getAllByRole("checkbox").length).toBeGreaterThan(short);
    expect(more).toHaveTextContent("Show fewer");
  });
});
