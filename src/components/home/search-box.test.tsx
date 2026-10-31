import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBox } from "./search-box";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const input = () => screen.getByRole("searchbox", { name: /search materials/i });

describe("SearchBox", () => {
  beforeEach(() => push.mockClear());

  test("focus shows popular searches, and choosing one fills the field", async () => {
    render(<SearchBox />);
    await userEvent.click(input());
    await userEvent.click(screen.getByRole("button", { name: "Rebar" }));
    expect(input()).toHaveValue("Rebar");
    expect(input()).toHaveFocus();
    expect(screen.getByRole("link", { name: /deformed rebar 12 mm/i })).toHaveAttribute(
      "href",
      "/products/deformed-rebar-12mm",
    );
  });

  test("no matches still offers a way forward", async () => {
    render(<SearchBox />);
    await userEvent.type(input(), "zzz");
    expect(screen.getByText(/no quick matches/i)).toBeInTheDocument();
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

  test("escape closes the results", async () => {
    render(<SearchBox />);
    await userEvent.type(input(), "cement");
    expect(screen.getByRole("link", { name: /portland cement/i })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("link", { name: /portland cement/i })).not.toBeInTheDocument();
  });
});
