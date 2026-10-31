import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ProductRow } from "./product-row";

let notifySize: () => void;

class FakeResizeObserver {
  constructor(callback: () => void) {
    notifySize = callback;
  }
  observe() {}
  disconnect() {}
}

function setSize(el: HTMLElement, { scrollWidth, clientWidth, scrollLeft = 0 }: Record<string, number>) {
  Object.defineProperties(el, {
    scrollWidth: { configurable: true, value: scrollWidth },
    clientWidth: { configurable: true, value: clientWidth },
    scrollLeft: { configurable: true, writable: true, value: scrollLeft },
  });
}

const renderRow = () => {
  render(
    <ProductRow title="New arrivals">
      <li>One</li>
    </ProductRow>,
  );
  return screen.getByRole("list", { name: "New arrivals" });
};

describe("ProductRow", () => {
  beforeEach(() => vi.stubGlobal("ResizeObserver", FakeResizeObserver));
  afterEach(() => vi.unstubAllGlobals());

  test("no arrows when everything fits", () => {
    const row = renderRow();
    setSize(row, { scrollWidth: 800, clientWidth: 800 });
    act(() => notifySize());
    expect(screen.queryByRole("button", { name: /next/i })).not.toBeInTheDocument();
  });

  test("arrows appear on overflow, and each end disables its own arrow", () => {
    const row = renderRow();
    setSize(row, { scrollWidth: 2000, clientWidth: 800 });
    act(() => notifySize());
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).toBeEnabled();

    setSize(row, { scrollWidth: 2000, clientWidth: 800, scrollLeft: 1200 });
    fireEvent.scroll(row);
    expect(screen.getByRole("button", { name: /previous/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });

  test("the next arrow scrolls by most of a screen", () => {
    const row = renderRow();
    setSize(row, { scrollWidth: 2000, clientWidth: 1000 });
    const scrollBy = vi.fn();
    row.scrollBy = scrollBy;
    act(() => notifySize());
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(scrollBy).toHaveBeenCalledWith({ left: 800, behavior: "smooth" });
  });

  test("it never moves on its own", () => {
    vi.useFakeTimers();
    const row = renderRow();
    setSize(row, { scrollWidth: 2000, clientWidth: 1000 });
    const scrollBy = vi.fn();
    row.scrollBy = scrollBy;
    act(() => notifySize());
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(scrollBy).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
