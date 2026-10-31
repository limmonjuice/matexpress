import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddSiteForm, AuthForms, ClaimOrderButton, RemoveSiteButton, SignOutButton } from "./account-forms";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  replace: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  claimOrder: vi.fn(),
  forgetBrowserOrders: vi.fn(),
  removeSite: vi.fn(),
  saveSite: vi.fn(),
  assign: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh, replace: mocks.replace }) }));
vi.mock("@/lib/auth-client", () => ({ authClient: { signIn: { email: mocks.signIn }, signUp: { email: mocks.signUp }, signOut: mocks.signOut } }));
vi.mock("@/lib/orders/actions", () => ({
  claimOrder: mocks.claimOrder,
  forgetBrowserOrders: mocks.forgetBrowserOrders,
  removeSite: mocks.removeSite,
  saveSite: mocks.saveSite,
}));

const signInWith = async (email: string, password: string) => {
  await userEvent.type(screen.getByLabelText("Email"), email);
  await userEvent.type(screen.getByLabelText("Password"), password);
  await userEvent.click(screen.getAllByRole("button", { name: "Sign in" }).at(-1)!);
};

describe("AuthForms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.signIn.mockResolvedValue({ error: null });
    mocks.signUp.mockResolvedValue({ error: null });
  });

  test("a wrong password gets a plain answer, and no orders move", async () => {
    mocks.signIn.mockResolvedValue({ error: { message: "Invalid email or password" } });
    render(<AuthForms />);
    await signInWith("a@example.com", "longenough");
    expect(await screen.findByRole("alert")).toHaveTextContent("That email and password don't match.");
  });

  test("signing in doesn't quietly take the orders placed on this computer", async () => {
    render(<AuthForms />);
    await signInWith("a@example.com", "longenough");
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
    expect(mocks.claimOrder).not.toHaveBeenCalled();
  });

  test("a dropped connection says so, on the form", async () => {
    mocks.signIn.mockRejectedValue(new Error("offline"));
    render(<AuthForms />);
    await signInWith("a@example.com", "longenough");
    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't reach the store");
  });

  test("signing in from checkout goes back to checkout", async () => {
    render(<AuthForms next="/checkout" />);
    await signInWith("a@example.com", "longenough");
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/checkout"));
  });

  test.each(["https://example.com/steal", "//example.com/steal", "/\\example.com/steal", "/\t/example.com/steal", "javascript:alert(1)"])("a link to %j can't send someone off the site after signing in", async (next) => {
    render(<AuthForms next={next} />);
    await signInWith("a@example.com", "longenough");
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  test("an email that already has an account says to sign in", async () => {
    mocks.signUp.mockResolvedValue({ error: { message: "User already exists" } });
    render(<AuthForms />);
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    await userEvent.type(screen.getByLabelText("Your name"), "Rosa");
    await userEvent.type(screen.getByLabelText("Email"), "a@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "longenough");
    await userEvent.click(screen.getByRole("button", { name: "Create my account" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("There's already an account with that email. Try signing in.");
  });
});

describe("SignOutButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.signOut.mockResolvedValue({ error: null });
    vi.stubGlobal("location", { ...window.location, assign: mocks.assign });
  });
  afterEach(() => vi.unstubAllGlobals());

  test("leaves nothing of the buyer's in this browser, including pages kept alive in memory", async () => {
    sessionStorage.setItem("matexpress-checkout", JSON.stringify({ street: "12 Sampaguita St" }));
    sessionStorage.setItem("matexpress-checkout-attempt", JSON.stringify({ key: "k", fingerprint: "12 Sampaguita St" }));
    render(<SignOutButton />);
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(mocks.assign).toHaveBeenCalledWith("/account"));
    expect(mocks.signOut).toHaveBeenCalled();
    expect(mocks.forgetBrowserOrders).toHaveBeenCalled();
    expect(sessionStorage.getItem("matexpress-checkout")).toBeNull();
    expect(sessionStorage.getItem("matexpress-checkout-attempt")).toBeNull();
  });

  test("if signing out fails, it says so and doesn't pretend", async () => {
    mocks.signOut.mockResolvedValue({ error: { message: "nope" } });
    render(<SignOutButton />);
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't reach the store");
    expect(mocks.assign).not.toHaveBeenCalled();
    expect(mocks.forgetBrowserOrders).not.toHaveBeenCalled();
  });
});

describe("ClaimOrderButton", () => {
  beforeEach(() => vi.clearAllMocks());

  test("adds that one order, when asked", async () => {
    mocks.claimOrder.mockResolvedValue(undefined);
    render(<ClaimOrderButton number="MX-AAAA1111" />);
    await userEvent.click(screen.getByRole("button", { name: "Add to my account" }));
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
    expect(mocks.claimOrder).toHaveBeenCalledWith("MX-AAAA1111");
  });

  test("a failure stays on the button, not the whole page", async () => {
    mocks.claimOrder.mockRejectedValue(new Error("offline"));
    render(<ClaimOrderButton number="MX-AAAA1111" />);
    await userEvent.click(screen.getByRole("button", { name: "Add to my account" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't reach the store");
  });
});

describe("RemoveSiteButton", () => {
  test("a failure stays on the button, not the whole page", async () => {
    vi.clearAllMocks();
    mocks.removeSite.mockRejectedValue(new Error("offline"));
    render(<RemoveSiteButton id="s1" label="12 Sampaguita St" />);
    await userEvent.click(screen.getByRole("button", { name: "Remove 12 Sampaguita St" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't reach the store");
  });
});

describe("AddSiteForm", () => {
  beforeEach(() => vi.clearAllMocks());

  test("starts as a button, with the account's name ready", async () => {
    render(<AddSiteForm name="Rosa Santos" />);
    await userEvent.click(screen.getByRole("button", { name: "Add a site" }));
    expect(screen.getByLabelText("Who should the driver ask for?")).toHaveValue("Rosa Santos");
  });

  test("a refused site stays open with its messages", async () => {
    mocks.saveSite.mockResolvedValue({ errors: { mobile: "Enter a mobile number like 0917 123 4567." } });
    render(<AddSiteForm name="Rosa Santos" />);
    await userEvent.click(screen.getByRole("button", { name: "Add a site" }));
    await userEvent.click(screen.getByRole("button", { name: "Save this site" }));
    expect(await screen.findByText("Enter a mobile number like 0917 123 4567.")).toBeInTheDocument();
  });

  test("a dropped connection keeps what was typed and says so", async () => {
    mocks.saveSite.mockRejectedValue(new Error("offline"));
    render(<AddSiteForm name="Rosa Santos" />);
    await userEvent.click(screen.getByRole("button", { name: "Add a site" }));
    await userEvent.type(screen.getByLabelText("Street and lot"), "12 Sampaguita St");
    await userEvent.click(screen.getByRole("button", { name: "Save this site" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't reach the store");
    expect(screen.getByLabelText("Street and lot")).toHaveValue("12 Sampaguita St");
  });

  test("a saved site closes the form and shows up", async () => {
    mocks.saveSite.mockResolvedValue({});
    render(<AddSiteForm name="Rosa Santos" />);
    await userEvent.click(screen.getByRole("button", { name: "Add a site" }));
    await userEvent.click(screen.getByRole("button", { name: "Save this site" }));
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "Add a site" })).toBeInTheDocument();
  });
});
