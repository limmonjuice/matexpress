import { afterEach, describe, expect, test, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { categories } from "@/lib/catalog/data/categories";
import { CategoryMenu, HOVER_DELAY } from "./category-menu";

const isOpen = () => screen.getByTestId("category-panel").dataset.open === "true";
const trigger = () => screen.getByRole("button", { name: /all categories/i });

describe("CategoryMenu", () => {
  afterEach(() => vi.useRealTimers());

  test("a press opens it without any hover", async () => {
    render(<CategoryMenu />);
    await userEvent.click(trigger());
    expect(isOpen()).toBe(true);
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
  });

  test("the keyboard opens it, and Escape closes it and returns focus", async () => {
    render(<CategoryMenu />);
    trigger().focus();
    await userEvent.keyboard("{Enter}");
    expect(isOpen()).toBe(true);
    await userEvent.keyboard("{Escape}");
    expect(isOpen()).toBe(false);
    expect(trigger()).toHaveFocus();
  });

  test("hovering opens only after the delay", () => {
    vi.useFakeTimers();
    render(<CategoryMenu />);
    fireEvent.mouseEnter(trigger().parentElement!);
    act(() => {
      vi.advanceTimersByTime(HOVER_DELAY - 50);
    });
    expect(isOpen()).toBe(false);
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(isOpen()).toBe(true);
  });

  test("a pointer that just passes over never opens it", () => {
    vi.useFakeTimers();
    render(<CategoryMenu />);
    const root = trigger().parentElement!;
    fireEvent.mouseEnter(root);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    fireEvent.mouseLeave(root);
    act(() => {
      vi.advanceTimersByTime(HOVER_DELAY * 2);
    });
    expect(isOpen()).toBe(false);
  });

  test("every group heading is a real link", () => {
    render(<CategoryMenu />);
    categories.forEach((c) => {
      const link = screen.getAllByRole("link", { name: c.name, hidden: true })[0];
      expect(link).toHaveAttribute("href", `/categories/${c.slug}`);
    });
  });
});
