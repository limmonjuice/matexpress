import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "./page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/components/home/home-motion", () => ({ HomeMotion: () => null }));
vi.mock("@/lib/catalog", async () => {
  const { products } = await import("@/db/sample/products");
  return { listProducts: async () => products };
});
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    disconnect() {}
  },
);

const sourcesIn = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourcesIn(path);
    return /\.tsx?$/.test(entry.name) && !/\.test\./.test(entry.name) ? [path] : [];
  });

describe("Home page", () => {
  test("has exactly one h1", async () => {
    render(await HomePage());
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  test("sections come in the planned order", async () => {
    render(await HomePage());
    const titles = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    const order = ["Shop by category", "New arrivals", "Best sellers", "Steel month", "Sell on MatExpress"];
    expect(titles.filter((title) => order.includes(title ?? ""))).toEqual(order);
  });

  test("the store never pulls in the 3D truck", () => {
    const files = [...sourcesIn("src/components/home"), "src/app/(store)/page.tsx"];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/components\/journey|from "three"|@react-three/);
    }
  });

  test("nothing on the page compares the store to another brand", async () => {
    render(await HomePage());
    expect(document.body.textContent).not.toMatch(/amazon/i);
  });
});
