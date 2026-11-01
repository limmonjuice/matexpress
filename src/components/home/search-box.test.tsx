import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { products } from "@/db/sample/products";
import { buildSearchIndex } from "@/lib/catalog/search";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const index = buildSearchIndex(products);
const input = () => screen.getByRole("searchbox", { name: /search materials/i });
const fetchIndex = vi.fn();

describe("SearchBox", () => {
  let SearchBox: typeof import("./search-box").SearchBox;

  beforeEach(async () => {
    push.mockClear();
    fetchIndex.mockReset().mockImplementation(async () => Response.json(index));
    vi.stubGlobal("fetch", fetchIndex);
    // A fresh module each time: it holds on to the index once it has it.
    vi.resetModules();
    ({ SearchBox } = await import("./search-box"));
  });
  afterEach(() => vi.unstubAllGlobals());

  test("the page doesn't ask for the index until someone goes to search", async () => {
    render(<SearchBox />);
    expect(fetchIndex).not.toHaveBeenCalled();
    await userEvent.click(input());
    expect(fetchIndex).toHaveBeenCalledWith("/api/search-index");
  });

  test("asks only once, however much is typed", async () => {
    render(<SearchBox />);
    await userEvent.type(input(), "cement");
    expect(await screen.findByRole("link", { name: /portland cement/i })).toBeInTheDocument();
    await userEvent.type(input(), " type");
    expect(fetchIndex).toHaveBeenCalledOnce();
  });

  test("while it's on its way, nothing says there are no matches", async () => {
    let arrive: (response: Response) => void = () => {};
    fetchIndex.mockImplementation(() => new Promise((resolve) => (arrive = resolve)));
    render(<SearchBox />);
    await userEvent.type(input(), "cement");
    expect(screen.queryByText(/no quick matches/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /search all materials/i })).toHaveAttribute("href", "/search?q=cement");
    arrive(Response.json(index));
    expect(await screen.findByRole("link", { name: /portland cement/i })).toBeInTheDocument();
  });

  test("if it can't be fetched, searching still works and the next try asks again", async () => {
    fetchIndex.mockImplementationOnce(async () => new Response("", { status: 500 }));
    render(<SearchBox />);
    await userEvent.type(input(), "cement{Enter}");
    expect(push).toHaveBeenCalledWith("/search?q=cement");
    await vi.waitFor(() => expect(fetchIndex).toHaveBeenCalled());

    await userEvent.type(input(), " type");
    expect(await screen.findByRole("link", { name: /portland cement/i })).toBeInTheDocument();
    expect(fetchIndex.mock.calls.length).toBeGreaterThan(1);
  });

  test("focus shows popular searches, and choosing one fills the field", async () => {
    render(<SearchBox />);
    await userEvent.click(input());
    await userEvent.click(screen.getByRole("button", { name: "Rebar" }));
    expect(input()).toHaveValue("Rebar");
    expect(input()).toHaveFocus();
    expect(await screen.findByRole("link", { name: /deformed rebar/i })).toHaveAttribute(
      "href",
      "/products/deformed-rebar",
    );
  });

  test("no matches still offers a way forward", async () => {
    render(<SearchBox />);
    await userEvent.type(input(), "zzz");
    expect(await screen.findByText(/no quick matches/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /search all materials/i })).toHaveAttribute("href", "/search?q=zzz");
  });

  test("special characters are encoded and don't crash", async () => {
    render(<SearchBox />);
    await userEvent.type(input(), "a&b");
    expect(screen.getByRole("link", { name: /search all materials/i })).toHaveAttribute("href", "/search?q=a%26b");
  });

  test("enter goes to the search page, but not with only spaces", async () => {
    render(<SearchBox />);
    await userEvent.type(input(), "   {Enter}");
    expect(push).not.toHaveBeenCalled();
    await userEvent.clear(input());
    await userEvent.type(input(), " cement {Enter}");
    expect(push).toHaveBeenCalledWith("/search?q=cement");
  });

  test("a local word finds the material", async () => {
    render(<SearchBox />);
    await userEvent.type(input(), "semento");
    expect(await screen.findByRole("link", { name: /portland cement/i })).toBeInTheDocument();
  });

  test("a size in the search opens the product on that size", async () => {
    render(<SearchBox />);
    await userEvent.type(input(), "rebar 16mm");
    expect(await screen.findByRole("link", { name: /deformed rebar/i })).toHaveAttribute("href", "/products/deformed-rebar?size=16-mm");
  });

  test("escape closes the results", async () => {
    render(<SearchBox />);
    await userEvent.type(input(), "cement");
    expect(await screen.findByRole("link", { name: /portland cement/i })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("link", { name: /portland cement/i })).not.toBeInTheDocument();
  });
});
