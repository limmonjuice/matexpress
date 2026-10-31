import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { heroProducts } from "@/lib/catalog/home-content";
import { Hero } from "./hero";

describe("Hero", () => {
  test("has the one page heading", () => {
    render(<Hero />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/The right materials\.\s*Right on schedule\./);
  });

  test("leads to shopping and to the story", () => {
    render(<Hero />);
    expect(screen.getByRole("link", { name: /explore materials/i })).toHaveAttribute("href", "/categories");
    expect(screen.getByRole("link", { name: /how it works/i })).toHaveAttribute("href", "/how-it-works");
  });

  test("each floating card opens its product", () => {
    render(<Hero />);
    heroProducts.forEach((product) => {
      expect(screen.getByRole("link", { name: new RegExp(product.name) })).toHaveAttribute(
        "href",
        `/products/${product.slug}`,
      );
    });
  });

  test("does not use the yard photo", () => {
    const source = readFileSync("src/components/home/hero.tsx", "utf8");
    expect(source).not.toMatch(/yard/i);
  });
});
