import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StoreShell } from "@/components/home/store-shell";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/components/smooth-scroll", () => ({ SmoothScroll: () => null }));

describe("the store's shell", () => {
  test("renders the header, footer and page once", async () => {
    render(await StoreShell({ children: <p>The page</p> }));
    expect(screen.getAllByRole("banner")).toHaveLength(1);
    expect(screen.getAllByRole("contentinfo")).toHaveLength(1);
    expect(screen.getAllByText("The page")).toHaveLength(1);
  });
});
