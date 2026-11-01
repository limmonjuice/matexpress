import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StoreShell } from "@/components/home/store-shell";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/components/home/store-scroll", () => ({ StoreScroll: () => null }));

describe("the store's shell", () => {
  test("renders the header, footer and page once", () => {
    render(<StoreShell>{<p>The page</p>}</StoreShell>);
    expect(screen.getAllByRole("banner")).toHaveLength(1);
    expect(screen.getAllByRole("contentinfo")).toHaveLength(1);
    expect(screen.getAllByText("The page")).toHaveLength(1);
  });
});
