import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { flashDeal } from "@/lib/catalog/home-content";
import { PromoPanels } from "./promo-panels";

describe("PromoPanels", () => {
  afterEach(() => vi.useRealTimers());

  test("while the deal is live it shows the timer and the deal's link", () => {
    vi.useFakeTimers({ now: new Date("2026-11-01T00:00:00+08:00") });
    render(<PromoPanels />);
    expect(screen.getByRole("timer")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /shop the deal/i })).toHaveAttribute("href", flashDeal.href);
  });

  test("once the deal has ended the timer goes and the link moves to this week's deals", () => {
    vi.useFakeTimers({ now: new Date("2027-01-01T00:00:00+08:00") });
    render(<PromoPanels />);
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /shop the deal/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /this week's deals/i })).toHaveAttribute("href", "/deals");
  });

  test("the seller panel is always there", () => {
    render(<PromoPanels />);
    expect(screen.getByRole("link", { name: /become a seller/i })).toHaveAttribute("href", "/sell");
  });
});
