import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SellerForm } from "./seller-form";

const { applyToSell } = vi.hoisted(() => ({ applyToSell: vi.fn() }));
vi.mock("@/lib/orders/actions", () => ({ applyToSell }));

async function fill() {
  await userEvent.type(screen.getByLabelText("Store name"), "Mabuhay Hardware");
  await userEvent.type(screen.getByLabelText("Your name"), "Rosa Santos");
  await userEvent.type(screen.getByLabelText("Mobile number"), "12345");
  await userEvent.type(screen.getByLabelText("City"), "Antipolo");
  await userEvent.type(screen.getByLabelText("What does your store sell?"), "Cement");
}

describe("SellerForm", () => {
  beforeEach(() => applyToSell.mockReset());

  test("the sign is painted as the name and city are typed", async () => {
    const { container } = render(<SellerForm />);
    const sign = container.querySelector(".hm-storesign")!;
    expect(sign).toHaveTextContent("Your Store");
    await userEvent.type(screen.getByLabelText("Store name"), "Mabuhay Hardware");
    await userEvent.type(screen.getByLabelText("City"), "Antipolo");
    expect(sign).toHaveTextContent("Mabuhay Hardware");
    expect(sign).toHaveTextContent("MH");
    expect(sign).toHaveTextContent("Antipolo");
  });

  test("picking a colour repaints the awning and goes with the application", async () => {
    applyToSell.mockResolvedValue({ done: true });
    const { container } = render(<SellerForm />);
    await userEvent.click(screen.getByRole("radio", { name: "Navy" }));
    expect(container.querySelector(".hm-storesign path")).toHaveAttribute("fill", "#2a3240");
    await fill();
    await userEvent.click(screen.getByRole("button", { name: "Apply to sell" }));
    expect(applyToSell.mock.calls[0][1].get("awning")).toBe("Navy");
  });

  test("a refused application keeps everything that was typed", async () => {
    applyToSell.mockResolvedValue({ error: "Enter a mobile number like 0917 123 4567." });
    render(<SellerForm />);
    await fill();
    await userEvent.click(screen.getByRole("button", { name: "Apply to sell" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Enter a mobile number like 0917 123 4567.");
    expect(screen.getByLabelText("Store name")).toHaveValue("Mabuhay Hardware");
    expect(screen.getByLabelText("Your name")).toHaveValue("Rosa Santos");
    expect(screen.getByLabelText("Mobile number")).toHaveValue("12345");
    expect(screen.getByLabelText("City")).toHaveValue("Antipolo");
    expect(screen.getByLabelText("What does your store sell?")).toHaveValue("Cement");
  });

  test("a good application says what happens next", async () => {
    applyToSell.mockResolvedValue({ done: true });
    render(<SellerForm />);
    await fill();
    await userEvent.click(screen.getByRole("button", { name: "Apply to sell" }));
    expect(await screen.findByRole("heading", { name: "Thanks, we have your application" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Our team will call");
  });
});
