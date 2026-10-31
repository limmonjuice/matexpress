import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddSiteForm, AuthForms, SignOutButton } from "./account-forms";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  replace: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  claimBrowserOrders: vi.fn(),
  forgetBrowserOrders: vi.fn(),
  saveSite: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh, replace: mocks.replace }) }));
vi.mock("@/lib/auth-client", () => ({ authClient: { signIn: { email: mocks.signIn }, signUp: { email: mocks.signUp }, signOut: mocks.signOut } }));
vi.mock("@/lib/orders/actions", () => ({
  claimBrowserOrders: mocks.claimBrowserOrders,
  forgetBrowserOrders: mocks.forgetBrowserOrders,
  removeSite: vi.fn(),
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
    expect(mocks.claimBrowserOrders).not.toHaveBeenCalled();
  });

  test("signing in brings this browser's orders into the account", async () => {
    render(<AuthForms />);
    await signInWith("a@example.com", "longenough");
    await waitFor(() => expect(mocks.claimBrowserOrders).toHaveBeenCalled());
    expect(mocks.refresh).toHaveBeenCalled();
  });

  test("signing in from checkout goes back to checkout", async () => {
    render(<AuthForms next="/checkout" />);
    await signInWith("a@example.com", "longenough");
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/checkout"));
  });

  test("a link can't send someone off the site after signing in", async () => {
    render(<AuthForms next="https://example.com/steal" />);
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
  test("leaves nothing of the buyer's in this browser", async () => {
    vi.clearAllMocks();
    sessionStorage.setItem("matexpress-checkout", JSON.stringify({ street: "12 Sampaguita St" }));
    render(<SignOutButton />);
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
    expect(mocks.signOut).toHaveBeenCalled();
    expect(mocks.forgetBrowserOrders).toHaveBeenCalled();
    expect(sessionStorage.getItem("matexpress-checkout")).toBeNull();
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

  test("a saved site closes the form and shows up", async () => {
    mocks.saveSite.mockResolvedValue({});
    render(<AddSiteForm name="Rosa Santos" />);
    await userEvent.click(screen.getByRole("button", { name: "Add a site" }));
    await userEvent.click(screen.getByRole("button", { name: "Save this site" }));
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "Add a site" })).toBeInTheDocument();
  });
});
