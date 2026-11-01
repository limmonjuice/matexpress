import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { products } from "@/db/sample/products";
import { applyToSell, buyAgain, claimOrder, demoAdvanceOrder, demoRestartOrder, forgetBrowserOrders, lookupOrder, placeOrder, removeSite, saveSite } from "./actions";
import { CONNECTION_ERROR } from "./rules";

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
  consume: vi.fn(),
  revalidateTag: vi.fn(),
  liveProducts: vi.fn(),
  store: { findNumberByKey: vi.fn(), insert: vi.fn(), recordPayment: vi.fn() },
  addOrderEvent: vi.fn(),
  clearOrderProgress: vi.fn(),
  mightBeSignedIn: vi.fn(),
  address: null as string | null,
}));

vi.mock("next/cache", () => ({ revalidateTag: mocks.revalidateTag }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/catalog", () => ({ CATALOG_TAG: "catalog", liveProducts: mocks.liveProducts }));
vi.mock("next/headers", () => ({ headers: async () => new Headers(mocks.address ? { "x-forwarded-for": mocks.address } : {}) }));
vi.mock("@/lib/throttle", () => ({ consume: mocks.consume }));
vi.mock("./repo", () => ({
  addOrderEvent: mocks.addOrderEvent,
  claimOrders: mocks.claimOrders,
  clearOrderProgress: mocks.clearOrderProgress,
  deleteSite: mocks.deleteSite,
  findOrder: mocks.findOrder,
  insertSellerApplication: mocks.insertSellerApplication,
  insertSite: mocks.insertSite,
  itemsForOrder: mocks.itemsForOrder,
  ordersByNumbers: mocks.ordersByNumbers,
  orderStore: mocks.store,
  sitesForUser: vi.fn(),
}));
vi.mock("./session", () => ({
  currentUser: mocks.currentUser,
  forgetOrderAccess: mocks.forgetOrderAccess,
  grantOrderAccess: mocks.grantOrderAccess,
  mightBeSignedIn: mocks.mightBeSignedIn,
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

  describe("with a good order", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      vi.useFakeTimers({ now: new Date("2026-11-02T09:00:00+08:00"), toFake: ["Date"] });
      mocks.liveProducts.mockResolvedValue(products);
      mocks.store.findNumberByKey.mockResolvedValue(undefined);
      mocks.store.insert.mockResolvedValue({ soldOut: false });
      mocks.store.recordPayment.mockResolvedValue(undefined);
    });
    afterEach(() => vi.useRealTimers());

    test("it's priced from live stock, only for what's being bought", async () => {
      expect(await placeOrder(good)).toMatchObject({ kind: "placed" });
      expect(mocks.liveProducts).toHaveBeenCalledWith(["portland-cement"]);
    });

    test("an ordinary order doesn't rebuild the store's pages", async () => {
      await placeOrder(good);
      expect(mocks.revalidateTag).not.toHaveBeenCalled();
    });

    test("an order that leaves a seller sold out does, so nobody is shown what's gone", async () => {
      mocks.store.insert.mockResolvedValue({ soldOut: true });
      await placeOrder(good);
      expect(mocks.revalidateTag).toHaveBeenCalledWith("catalog", "max");
    });

    test("a retry that finds the order already placed rebuilds nothing", async () => {
      mocks.store.findNumberByKey.mockResolvedValue("MX-AAAA2222");
      expect(await placeOrder(good)).toMatchObject({ kind: "placed", number: "MX-AAAA2222", alreadyPlaced: true });
      expect(mocks.revalidateTag).not.toHaveBeenCalled();
    });
  });
});

describe("the demo controls", () => {
  const NUMBER = "MX-AAAA2222";
  const order = (events: { type: string; sellerSlug?: string }[] = [{ type: "placed" }]) => ({
    order: { id: "order-id", number: NUMBER, userId: null },
    items: [
      { sellerSlug: "bakal-supply", sellerName: "Bakal Supply" },
      { sellerSlug: "bato-aggregates", sellerName: "Bato Aggregates" },
      { sellerSlug: "bakal-supply", sellerName: "Bakal Supply" },
    ],
    events,
  });
  const confirmed = [{ type: "placed" }, { type: "seller-confirmed", sellerSlug: "bakal-supply" }, { type: "seller-confirmed", sellerSlug: "bato-aggregates" }];
  const confirm = { type: "seller-confirmed", sellerSlug: "bakal-supply" };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("SITE_MODE", "demo");
    mocks.currentUser.mockResolvedValue(undefined);
    mocks.mightBeSignedIn.mockResolvedValue(false);
    mocks.provenOrders.mockResolvedValue([NUMBER]);
    mocks.findOrder.mockResolvedValue(order());
  });
  afterEach(() => vi.unstubAllEnvs());

  test("a seller confirming is saved as a real event", async () => {
    await demoAdvanceOrder(NUMBER, confirm);
    expect(mocks.addOrderEvent).toHaveBeenCalledWith("order-id", "seller-confirmed", "bakal-supply");
  });

  test("a truck step names no seller", async () => {
    mocks.findOrder.mockResolvedValue(order(confirmed));
    await demoAdvanceOrder(NUMBER, { type: "collecting" });
    expect(mocks.addOrderEvent).toHaveBeenCalledWith("order-id", "collecting", undefined);
  });

  test("with the switch off they do nothing, even for the order's own browser", async () => {
    vi.stubEnv("SITE_MODE", "");
    await demoAdvanceOrder(NUMBER, confirm);
    await demoRestartOrder(NUMBER);
    expect(mocks.findOrder).not.toHaveBeenCalled();
    expect(mocks.addOrderEvent).not.toHaveBeenCalled();
    expect(mocks.clearOrderProgress).not.toHaveBeenCalled();
  });

  test("a stranger can't move someone else's order", async () => {
    mocks.provenOrders.mockResolvedValue(["MX-BBBB3333"]);
    await demoAdvanceOrder(NUMBER, confirm);
    await demoRestartOrder(NUMBER);
    expect(mocks.addOrderEvent).not.toHaveBeenCalled();
    expect(mocks.clearOrderProgress).not.toHaveBeenCalled();
  });

  test("another account can't either", async () => {
    mocks.provenOrders.mockResolvedValue([]);
    mocks.mightBeSignedIn.mockResolvedValue(true);
    mocks.currentUser.mockResolvedValue({ id: "someone-else" });
    await demoAdvanceOrder(NUMBER, confirm);
    expect(mocks.addOrderEvent).not.toHaveBeenCalled();
  });

  test.each([
    ["delivery before the sellers have confirmed", { type: "delivered" }],
    ["the truck before the sellers have confirmed", { type: "collecting" }],
    ["a seller who isn't on this order", { type: "seller-confirmed", sellerSlug: "tibay-steel" }],
    ["a step that doesn't exist", { type: "placed" }],
    ["nothing at all", undefined as never],
  ])("%s is refused", async (_, step) => {
    await demoAdvanceOrder(NUMBER, step);
    expect(mocks.addOrderEvent).not.toHaveBeenCalled();
  });

  test("a seller can't confirm twice", async () => {
    mocks.findOrder.mockResolvedValue(order([{ type: "placed" }, confirm]));
    await demoAdvanceOrder(NUMBER, confirm);
    expect(mocks.addOrderEvent).not.toHaveBeenCalled();
  });

  test("a delivered order has nothing left to do", async () => {
    mocks.findOrder.mockResolvedValue(order([...confirmed, { type: "collecting" }, { type: "on-the-way" }, { type: "delivered" }]));
    await demoAdvanceOrder(NUMBER, { type: "delivered" });
    expect(mocks.addOrderEvent).not.toHaveBeenCalled();
  });

  test("starting over clears the progress", async () => {
    await demoRestartOrder(NUMBER);
    expect(mocks.clearOrderProgress).toHaveBeenCalledWith("order-id");
  });

  test("what isn't an order number is turned away", async () => {
    await demoAdvanceOrder(["MX-AAAA2222"] as never, confirm);
    await demoRestartOrder({ number: NUMBER } as never);
    expect(mocks.findOrder).not.toHaveBeenCalled();
  });
});

const ALLOWED = { allowed: true, retryAfter: null };
const REFUSED = { allowed: false, retryAfter: 60 };

beforeEach(() => {
  mocks.address = null;
  mocks.consume.mockResolvedValue(ALLOWED);
  mocks.liveProducts.mockResolvedValue(products);
});

describe("how often the public forms can be used", () => {
  const goodApplication = { storeName: "Mabuhay Hardware", contactName: "Rosa Santos", mobile: "0917 123 4567", city: "Antipolo", sells: "Cement" };
  const goodOrder = {
    idempotencyKey: "0d9e8f7a-6b5c-4d3e-9f2a-1b0c9d8e7f6a",
    site: { contactName: "Rosa Santos", mobile: "0917 123 4567", street: "12 Sampaguita St", city: "San Roque, Antipolo", area: "Rizal" },
    deliveryDate: "2026-11-03",
    deliveryWindow: "8 AM to 12 NN",
    paymentMethod: "gcash",
    lines: [{ slug: "portland-cement", variantId: "40-kg", sellerSlug: "dalisay-hardware", quantity: 1, unitPrice: 252 }],
  };

  beforeEach(() => vi.clearAllMocks());

  test("too many lookups from one address stop before the database is asked", async () => {
    mocks.address = "203.0.113.9";
    mocks.consume.mockResolvedValue(REFUSED);
    expect(await lookupOrder(undefined, form({ number: "MX-AAAA2222", mobile: "0917 123 4567" }))).toEqual({ error: "Too many tries. Wait 15 minutes, then try again." });
    expect(mocks.consume).toHaveBeenCalledWith("track:203.0.113.9", expect.anything());
    expect(mocks.findOrder).not.toHaveBeenCalled();
  });

  test("changing address doesn't buy more guesses at one order's mobile", async () => {
    mocks.address = "198.51.100.7";
    mocks.consume.mockImplementation(async (key: string) => (key === "track-order:MX-AAAA2222" ? REFUSED : ALLOWED));
    expect(await lookupOrder(undefined, form({ number: "mx-aaaa2222", mobile: "0917 123 4567" }))).toEqual({ error: "Too many tries. Wait 15 minutes, then try again." });
    expect(mocks.findOrder).not.toHaveBeenCalled();
  });

  test("an order number no one could have costs no database row", async () => {
    await lookupOrder(undefined, form({ number: "x".repeat(5000), mobile: "0917 123 4567" }));
    expect(mocks.consume).not.toHaveBeenCalled();
  });

  test("too many applications from one address are refused, and a typo doesn't count as one", async () => {
    mocks.address = "203.0.113.9";
    await applyToSell(undefined, form({ ...goodApplication, mobile: "123" }));
    expect(mocks.consume).not.toHaveBeenCalled();

    mocks.consume.mockResolvedValue(REFUSED);
    expect((await applyToSell(undefined, form(goodApplication))).error).toMatch(/several applications/);
    expect(mocks.insertSellerApplication).not.toHaveBeenCalled();
  });

  test("too many orders from one address are refused before anything else happens", async () => {
    mocks.address = "203.0.113.9";
    mocks.consume.mockResolvedValue(REFUSED);
    expect(await placeOrder(goodOrder as never)).toEqual({ kind: "limited" });
    expect(mocks.currentUser).not.toHaveBeenCalled();
  });

  test("a chain of addresses isn't trusted, so everyone isn't lumped into one count", async () => {
    mocks.address = "203.0.113.9, 198.51.100.7";
    mocks.findOrder.mockResolvedValue(undefined);
    await lookupOrder(undefined, form({ number: "MX-AAAA2222", mobile: "0917 123 4567" }));
    expect(mocks.consume).toHaveBeenCalledTimes(1);
    expect(mocks.consume).toHaveBeenCalledWith("track-order:MX-AAAA2222", expect.anything());
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

  test("when the database can't answer, the buyer is told and keeps what they typed", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const typed = form({ number: "MX-AAAA1111", mobile: "0917 123 4567" });

    mocks.findOrder.mockRejectedValue(new Error("down"));
    expect(await lookupOrder(undefined, typed)).toEqual({ error: CONNECTION_ERROR });

    mocks.consume.mockRejectedValue(new Error("down"));
    expect(await lookupOrder(undefined, typed)).toEqual({ error: CONNECTION_ERROR });

    expect(mocks.grantOrderAccess).not.toHaveBeenCalled();
    expect(logged).toHaveBeenCalledTimes(2);
    logged.mockRestore();
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

  test("when the database can't answer, the applicant is told and keeps what they typed", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.insertSellerApplication.mockRejectedValueOnce(new Error("down"));
    expect(await applyToSell(undefined, form(good))).toEqual({ error: CONNECTION_ERROR });
    expect(logged).toHaveBeenCalledTimes(1);
    logged.mockRestore();
  });
});

test("signing out forgets this browser's orders", async () => {
  await forgetBrowserOrders();
  expect(mocks.forgetOrderAccess).toHaveBeenCalled();
});
