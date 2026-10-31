import { describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { areaFee, CUTOFF_HOUR, deliveryAreas, DELIVERY_WINDOWS, FREE_DELIVERY_OVER } from "@/lib/delivery";
import { formatPeso } from "@/lib/format";
import { formatWeight, TRUCKS } from "@/lib/load";
import DeliveryHelp from "./page";

vi.mock("next/navigation", () => ({ useRouter: () => ({}) }));

// The page reads every number from the rules checkout uses, so the two can't disagree.
describe("the delivery help page", () => {
  test("lists every area at the fee checkout charges", () => {
    render(<DeliveryHelp />);
    for (const area of deliveryAreas) {
      const row = within(screen.getByRole("rowheader", { name: area }).closest("tr")!);
      expect(row.getByText(formatPeso(areaFee(area)))).toBeInTheDocument();
    }
  });

  test("states the free-delivery line, the cut-off and the windows", () => {
    render(<DeliveryHelp />);
    expect(screen.getByText(new RegExp(`Orders of ${formatPeso(FREE_DELIVERY_OVER)} or more deliver free`))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`placed before ${CUTOFF_HOUR - 12} PM`))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(DELIVERY_WINDOWS.join(" or ")))).toBeInTheDocument();
  });

  test("lists every truck with what it really carries", () => {
    render(<DeliveryHelp />);
    for (const truck of TRUCKS) {
      expect(within(screen.getByRole("rowheader", { name: truck.name }).closest("tr")!).getByText(formatWeight(truck.capacityKg))).toBeInTheDocument();
    }
  });
});
