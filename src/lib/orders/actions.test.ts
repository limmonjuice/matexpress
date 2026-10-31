import { beforeEach, describe, expect, test, vi } from "vitest";
import { applyToSell, buyAgain, claimOrder, forgetBrowserOrders, lookupOrder, placeOrder, removeSite, saveSite } from "./actions";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
  findOrder: vi.fn(),
  ordersByNumbers: vi.fn(),
  itemsForOrder: vi.fn(),
  insertSellerApplication: vi.fn(),
  insertSite: vi.fn(),
  deleteSite: vi.fn(),
  currentUser: vi.fn(),
  provenOrders: vi.fn(),
  grantOrderAccess: vi.fn(),
  forgetOrderAccess: vi.fn(),
  claimOrders: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("./repo", () => ({
  claimOrders: mocks.claimOrders,
  deleteSite: mocks.deleteSite,
  findOrder: mocks.findOrder,
  insertSellerApplication: mocks.insertSellerApplication,
  insertSite: mocks.insertSite,
  itemsForOrder: mocks.itemsForOrder,
  ordersByNumbers: mocks.ordersByNumbers,
  orderStore: {},
  sitesForUser: vi.fn(),
}));
vi.mock("./session", () => ({
  currentUser: mocks.currentUser,
  forgetOrderAccess: mocks.forgetOrderAccess,
  grantOrderAccess: mocks.grantOrderAccess,
  provenOrders: mocks.provenOrders,
}));

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => data.set(key, value));
  return data;
};

const NOT_FOUND = "We couldn't find an order with that number and mobile. Check both and try again.";
const SITE_ID = "6f1c2b1e-3d4a-4b5c-8d6e-7f8091a2b3c4";

describe("placeOrder", () => {
  const good = {
    idempotencyKey: "0d9e8f7a-6b5c-4d3e-9f2a-1b0c9d8e7f6a",
    site: { contactName: "Rosa Santos", mobile: "0917 123 4567", street: "12 Sampaguita St", city: "San Roque, Antipolo", area: "Rizal" },
    deliveryDate: "2026-11-03",
    deliveryWindow: "8 AM to 12 NN",
    paymentMethod: "gcash",
    lines: [{ slug: "portland-cement", variantId: "40-kg", sellerSlug: "dalisay-hardware", quantity: 1, unitPrice: 252 }],
  };

  test.each([
    ["nothing at all", null],
    ["a string", "order"],
    ["a key that isn't a uuid", { ...good, idempotencyKey: "someone-elses-key" }],
    ["a very long key", { ...good, idempotencyKey: "x".repeat(100000) }],
    ["notes that aren't text", { ...good, site: { ...good.site, notes: ["x"] } }],
    ["a site that isn't one", { ...good, site: "here" }],
    ["lines that aren't a list", { ...good, lines: "all" }],
    ["a line with a text quantity", { ...good, lines: [{ ...good.lines[0], quantity: "1" }] }],
    ["too many lines", { ...good, lines: Array.from({ length: 101 }, () => good.lines[0]) }],
    ["a truck answer that isn't text", { ...good, truckAccess: { a: 1 } }],
  ])("%s is turned away before anything happens", async (_, bad) => {
    vi.clearAllMocks();
    expect(await placeOrder(bad as never)).toMatchObject({ kind: "changed" });
    expect(mocks.currentUser).not.toHaveBeenCalled();
    expect(mocks.grantOrderAccess).not.toHaveBeenCalled();
  });
});

describe("lookupOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findOrder.mockResolvedValue({ order: { number: "MX-AAAA1111", mobile: "+639171234567" } });
  });

  test("a wrong number and a wrong mobile get the same answer, and no access", async () => {
    const wrongMobile = await lookupOrder(undefined, form({ number: "MX-AAAA1111", mobile: "0917 000 0000" }));
    mocks.findOrder.mockResolvedValue(undefined);
    const wrongNumber = await lookupOrder(undefined, form({ number: "MX-NOPE", mobile: "0917 123 4567" }));
    expect(wrongMobile).toEqual({ error: NOT_FOUND });
    expect(wrongNumber).toEqual({ error: NOT_FOUND });
    expect(mocks.grantOrderAccess).not.toHaveBeenCalled();
  });

  test("something that isn't a mobile number doesn't even look", async () => {
    expect(await lookupOrder(undefined, form({ number: "MX-AAAA1111", mobile: "hello" }))).toEqual({ error: NOT_FOUND });
    expect(mocks.findOrder).not.toHaveBeenCalled();
  });

  test.each(["0917 123 4567", "+63 917 123 4567", "09171234567"])("the right number with %s opens the order", async (mobile) => {
    await expect(lookupOrder(undefined, form({ number: " mx-aaaa1111 ", mobile }))).rejects.toThrow("redirect:/orders/MX-AAAA1111");
    expect(mocks.grantOrderAccess).toHaveBeenCalledWith("MX-AAAA1111");
  });
});

describe("claimOrder", () => {
  beforeEach(() => vi.clearAllMocks());

  test("adds the one order asked for, for the browser that proved it", async () => {
    mocks.currentUser.mockResolvedValue({ id: "u1" });
    mocks.provenOrders.mockResolvedValue(["MX-AAAA1111", "MX-BBBB2222"]);
    await claimOrder("MX-AAAA1111");
    expect(mocks.claimOrders).toHaveBeenCalledWith(["MX-AAAA1111"], "u1");
  });

  test("an order this browser can't prove stays where it is", async () => {
    mocks.currentUser.mockResolvedValue({ id: "u1" });
    mocks.provenOrders.mockResolvedValue(["MX-BBBB2222"]);
    await claimOrder("MX-AAAA1111");
    expect(mocks.claimOrders).not.toHaveBeenCalled();
  });

  test("it needs an account", async () => {
    mocks.currentUser.mockResolvedValue(undefined);
    mocks.provenOrders.mockResolvedValue(["MX-AAAA1111"]);
    await claimOrder("MX-AAAA1111");
    expect(mocks.claimOrders).not.toHaveBeenCalled();
  });
});

describe("buyAgain", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.currentUser.mockResolvedValue(undefined);
    mocks.provenOrders.mockResolvedValue([]);
    mocks.ordersByNumbers.mockResolvedValue([{ id: "o1", number: "MX-AAAA1111", userId: "someone-else" }]);
    mocks.itemsForOrder.mockResolvedValue([
      { name: "Deformed Rebar", productSlug: "deformed-rebar", variantId: "12-mm", sellerSlug: "bakal-supply", quantity: "500" },
      { name: "Discontinued Item", productSlug: "gone", variantId: "x", sellerSlug: "y", quantity: "1" },
    ]);
  });

  test("a stranger's browser gets nothing from someone else's order", async () => {
    expect(await buyAgain("MX-AAAA1111")).toEqual({ lines: [], unavailable: [] });
    expect(mocks.itemsForOrder).not.toHaveBeenCalled();
  });

  test("the browser that proved the order gets it back at today's prices, and hears what's gone", async () => {
    mocks.provenOrders.mockResolvedValue(["MX-AAAA1111"]);
    const { lines, unavailable } = await buyAgain("MX-AAAA1111");
    expect(lines).toMatchObject([{ slug: "deformed-rebar", sellerSlug: "bakal-supply", quantity: 500, price: 236 }]);
    expect(unavailable).toEqual(["Discontinued Item"]);
  });

  test("the account it belongs to can too", async () => {
    mocks.currentUser.mockResolvedValue({ id: "someone-else" });
    expect((await buyAgain("MX-AAAA1111")).lines).toHaveLength(1);
  });
});

describe("saved sites", () => {
  const site = { contactName: "Rosa Santos", mobile: "0917 123 4567", street: "12 Sampaguita St", city: "San Roque, Antipolo", area: "Rizal" };

  beforeEach(() => vi.clearAllMocks());

  test("saving needs an account", async () => {
    mocks.currentUser.mockResolvedValue(undefined);
    expect((await saveSite(site)).errors?.contactName).toBe("Sign in to save a site.");
    expect(mocks.insertSite).not.toHaveBeenCalled();
  });

  test("a bad site isn't saved", async () => {
    mocks.currentUser.mockResolvedValue({ id: "u1" });
    expect((await saveSite({ ...site, mobile: "123" })).errors?.mobile).toBeDefined();
    expect(mocks.insertSite).not.toHaveBeenCalled();
  });

  test("a good site is saved with its mobile in one form", async () => {
    mocks.currentUser.mockResolvedValue({ id: "u1" });
    expect(await saveSite(site)).toEqual({});
    expect(mocks.insertSite).toHaveBeenCalledWith("u1", { ...site, mobile: "+639171234567" });
  });

  test("something that isn't a site is refused, not stored", async () => {
    mocks.currentUser.mockResolvedValue({ id: "u1" });
    for (const bad of [null, "x", { ...site, street: ["x"] }, { ...site, notes: { a: 1 } }, { ...site, city: "x".repeat(2000) }]) {
      expect((await saveSite(bad as never)).errors).toBeDefined();
    }
    expect(mocks.insertSite).not.toHaveBeenCalled();
  });

  test("an id that isn't one goes nowhere near the database", async () => {
    mocks.currentUser.mockResolvedValue({ id: "u1" });
    for (const bad of ["s1", "' OR 1=1", 5, null, { id: 1 }]) await removeSite(bad as never);
    expect(mocks.deleteSite).not.toHaveBeenCalled();
  });

  test("removing only ever touches the signed-in account's own sites", async () => {
    mocks.currentUser.mockResolvedValue(undefined);
    await removeSite(SITE_ID);
    expect(mocks.deleteSite).not.toHaveBeenCalled();
    mocks.currentUser.mockResolvedValue({ id: "u1" });
    await removeSite(SITE_ID);
    expect(mocks.deleteSite).toHaveBeenCalledWith("u1", SITE_ID);
  });
});

describe("applyToSell", () => {
  const good = { storeName: "Mabuhay Hardware", contactName: "Rosa Santos", mobile: "0917 123 4567", city: "Antipolo", sells: "Cement, rebar", awning: "Navy" };

  beforeEach(() => vi.clearAllMocks());

  test.each([
    ["storeName", "A", "Enter your store's name."],
    ["contactName", " ", "Enter who we should talk to."],
    ["mobile", "12345", "Enter a mobile number like 0917 123 4567."],
    ["city", "", "Enter your store's city."],
    ["sells", "x", "Tell us what your store sells."],
    ["sells", "x".repeat(301), "Tell us what your store sells."],
    ["storeName", "x".repeat(121), "Enter your store's name."],
  ])("%s set to %j is refused", async (key, value, error) => {
    expect(await applyToSell(undefined, form({ ...good, [key]: value }))).toEqual({ error });
    expect(mocks.insertSellerApplication).not.toHaveBeenCalled();
  });

  test("a good application is kept, with its mobile in one form and its awning", async () => {
    expect(await applyToSell(undefined, form(good))).toEqual({ done: true });
    expect(mocks.insertSellerApplication).toHaveBeenCalledWith({ ...good, mobile: "+639171234567" });
  });

  test("an awning colour that isn't on the list is dropped, not stored", async () => {
    await applyToSell(undefined, form({ ...good, awning: "<script>" }));
    expect(mocks.insertSellerApplication.mock.calls[0][0].awning).toBeUndefined();
  });
});

test("signing out forgets this browser's orders", async () => {
  await forgetBrowserOrders();
  expect(mocks.forgetOrderAccess).toHaveBeenCalled();
});
