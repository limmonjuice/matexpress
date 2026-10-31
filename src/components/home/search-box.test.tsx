import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { products } from "@/lib/catalog/data/products";
import { buildSearchIndex } from "@/lib/catalog/search";
import { SearchBox } from "./search-box";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const index = buildSearchIndex(products);
const input = () => screen.getByRole("searchbox", { name: /search materials/i });

describe("SearchBox", () => {
  beforeEach(() => push.mockClear());

  test("focus shows popular searches, and choosing one fills the field", async () => {
    render(<SearchBox index={index} />);
    await userEvent.click(input());
    await userEvent.click(screen.getByRole("button", { name: "Rebar" }));
    expect(input()).toHaveValue("Rebar");
    expect(input()).toHaveFocus();
    expect(screen.getByRole("link", { name: /deformed rebar/i })).toHaveAttribute(
      "href",
      "/products/deformed-rebar",
    );
  });

  test("no matches still offers a way forward", async () => {
    render(<SearchBox index={index} />);
    await userEvent.type(input(), "zzz");
    expect(screen.getByText(/no quick matches/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /search all materials/i })).toHaveAttribute("href", "/search?q=zzz");
  });

  test("special characters are encoded and don't crash", async () => {
    render(<SearchBox index={index} />);
    await userEvent.type(input(), "a&b");
    expect(screen.getByRole("link", { name: /search all materials/i })).toHaveAttribute("href", "/search?q=a%26b");
  });

  test("enter goes to the search page, but not with only spaces", async () => {
    render(<SearchBox index={index} />);
    await userEvent.type(input(), "   {Enter}");
    expect(push).not.toHaveBeenCalled();
    await userEvent.clear(input());
    await userEvent.type(input(), " cement {Enter}");
    expect(push).toHaveBeenCalledWith("/search?q=cement");
  });

  test("a local word finds the material", async () => {
    render(<SearchBox index={index} />);
    await userEvent.type(input(), "semento");
    expect(screen.getByRole("link", { name: /portland cement/i })).toBeInTheDocument();
  });

  test("a size in the search opens the product on that size", async () => {
    render(<SearchBox index={index} />);
    await userEvent.type(input(), "rebar 16mm");
    expect(screen.getByRole("link", { name: /deformed rebar/i })).toHaveAttribute("href", "/products/deformed-rebar?size=16-mm");
  });

  test("escape closes the results", async () => {
    render(<SearchBox index={index} />);
    await userEvent.type(input(), "cement");
    expect(screen.getByRole("link", { name: /portland cement/i })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("link", { name: /portland cement/i })).not.toBeInTheDocument();
  });
});
