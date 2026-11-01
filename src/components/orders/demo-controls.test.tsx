import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { NextStep } from "@/lib/orders/tracking";
import { DemoControls } from "./demo-controls";

const mocks = vi.hoisted(() => ({ refresh: vi.fn(), advance: vi.fn(), restart: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("@/lib/orders/actions", () => ({ demoAdvanceOrder: mocks.advance, demoRestartOrder: mocks.restart }));

const confirms: NextStep[] = [
  { type: "seller-confirmed", sellerSlug: "bakal-supply", label: "Bakal Supply confirms" },
  { type: "seller-confirmed", sellerSlug: "bato-aggregates", label: "Bato Aggregates confirms" },
];

describe("DemoControls", () => {
  beforeEach(() => {
    mocks.refresh.mockReset();
    mocks.advance.mockReset().mockResolvedValue(undefined);
    mocks.restart.mockReset().mockResolvedValue(undefined);
  });

  test("offers each step that's next", () => {
    render(<DemoControls number="MX-AAAA2222" steps={confirms} started={false} />);
    expect(screen.getByRole("button", { name: "Bakal Supply confirms" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bato Aggregates confirms" })).toBeInTheDocument();
  });

  test("says plainly that it isn't part of the store", () => {
    render(<DemoControls number="MX-AAAA2222" steps={confirms} started={false} />);
    expect(screen.getByRole("heading", { name: "Demo controls" })).toBeInTheDocument();
    expect(screen.getByText(/Real buyers never see this/)).toBeInTheDocument();
  });

  test("pressing a step does it, then shows the result", async () => {
    render(<DemoControls number="MX-AAAA2222" steps={confirms} started={false} />);
    await userEvent.click(screen.getByRole("button", { name: "Bato Aggregates confirms" }));
    expect(mocks.advance).toHaveBeenCalledWith("MX-AAAA2222", { type: "seller-confirmed", sellerSlug: "bato-aggregates" });
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalledOnce());
  });

  test("a step for the truck names no seller", async () => {
    render(<DemoControls number="MX-AAAA2222" steps={[{ type: "collecting", label: "Truck starts collecting" }]} started />);
    await userEvent.click(screen.getByRole("button", { name: "Truck starts collecting" }));
    expect(mocks.advance).toHaveBeenCalledWith("MX-AAAA2222", { type: "collecting", sellerSlug: undefined });
  });

  test("everything waits while a step is going through, so one press is one step", async () => {
    let finish = () => {};
    mocks.advance.mockImplementation(() => new Promise<void>((resolve) => (finish = resolve)));
    render(<DemoControls number="MX-AAAA2222" steps={confirms} started />);
    await userEvent.click(screen.getByRole("button", { name: "Bakal Supply confirms" }));
    for (const button of screen.getAllByRole("button")) expect(button).toBeDisabled();
    finish();
    await waitFor(() => expect(screen.getByRole("button", { name: "Bakal Supply confirms" })).toBeEnabled());
  });

  test("starting over is only offered once something has happened", async () => {
    const { rerender } = render(<DemoControls number="MX-AAAA2222" steps={confirms} started={false} />);
    expect(screen.queryByRole("button", { name: "Start over" })).not.toBeInTheDocument();

    rerender(<DemoControls number="MX-AAAA2222" steps={[]} started />);
    await userEvent.click(screen.getByRole("button", { name: "Start over" }));
    expect(mocks.restart).toHaveBeenCalledWith("MX-AAAA2222");
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalledOnce());
  });

  test("a step that can't reach the server says so", async () => {
    mocks.advance.mockRejectedValue(new Error("offline"));
    render(<DemoControls number="MX-AAAA2222" steps={confirms} started={false} />);
    await userEvent.click(screen.getByRole("button", { name: "Bakal Supply confirms" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't reach the store/);
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
