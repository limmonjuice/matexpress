import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorScreen } from "./error-screen";

const route = vi.hoisted(() => ({ params: {} as { number?: string } }));
vi.mock("next/navigation", () => ({ useParams: () => route.params }));

const back = { href: "/categories", label: "Browse materials" };

describe("ErrorScreen", () => {
  beforeEach(() => {
    route.params = {};
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  test("says the cart is safe, and offers another try and a way out", async () => {
    const retry = vi.fn();
    render(<ErrorScreen error={new Error("boom")} retry={retry} back={back} />);
    expect(screen.getByText(/Your cart is safe/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse materials" })).toHaveAttribute("href", "/categories");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalled();
  });

  test("on an order's page, it still gives the number", () => {
    route.params = { number: "mx-aaaa1111" };
    render(<ErrorScreen error={new Error("boom")} retry={vi.fn()} back={back} />);
    expect(screen.getByText(/Keep its number, MX-AAAA1111/)).toBeInTheDocument();
  });

  test("reports the error, and never shows it to the buyer", () => {
    render(<ErrorScreen error={new Error("password=secret at db.ts")} retry={vi.fn()} back={back} />);
    expect(console.error).toHaveBeenCalled();
    expect(screen.queryByText(/secret/)).not.toBeInTheDocument();
  });
});
