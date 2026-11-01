import { describe, expect, test, vi } from "vitest";
import { products } from "@/db/sample/products";
import { createOrder, newOrderNumber, NotEnoughStockError, type NewOrder, type OrderStore } from "./create-order";
import { lineTotal } from "@/lib/pricing";
import { toCentavos } from "@/lib/format";
import { priceOrder } from "./price-order";
import { formatMobile, normalizeMobile, validateCheckout, validateSite, type CheckoutInput } from "./rules";

const now = new Date("2026-11-02T09:00:00+08:00");

const line = (over: Partial<CheckoutInput["lines"][number]> = {}) => ({
  slug: "portland-cement",
  variantId: "40-kg",
  sellerSlug: "dalisay-hardware",
  quantity: 10,
  unitPrice: 252,
  ...over,
});

const input = (over: Partial<CheckoutInput> = {}): CheckoutInput => ({
  idempotencyKey: "key-1",
  site: { contactName: "Rosa Santos", mobile: "0917 123 4567", street: "12 Sampaguita St", city: "San Roque, Antipolo", area: "Rizal" },
  deliveryDate: "2026-11-03",
  deliveryWindow: "8 AM to 12 NN",
  paymentMethod: "gcash",
  lines: [line()],
  ...over,
});

function fakeStore(): OrderStore & { saved: NewOrder[] } {
  const saved: NewOrder[] = [];
  return {
    saved,
    findNumberByKey: async (key) => saved.find((o) => o.idempotencyKey === key)?.number,
    insert: async (order) => {
      if (saved.some((o) => o.idempotencyKey === order.idempotencyKey)) throw new Error("duplicate key");
      saved.push(order);
      return { soldOut: false };
    },
    recordPayment: async (number, { status, ref }) => {
      const order = saved.find((o) => o.number === number)!;
      order.paymentStatus = status;
      order.paymentRef = ref;
    },
  };
}

const loadProducts = async () => products;

const payments = { start: vi.fn(async () => ({ status: "paid" as const, ref: "SIM-1" })) };

describe("validateSite", () => {
  const site = input().site;

  test("a good site passes", () => {
    expect(validateSite(site)).toEqual({});
  });

  test("nothing typed past the limits gets stored", () => {
    expect(validateSite({ ...site, contactName: "x".repeat(81) }).contactName).toBeDefined();
    expect(validateSite({ ...site, street: "x".repeat(161) }).street).toBeDefined();
    expect(validateSite({ ...site, city: "x".repeat(121) }).city).toBeDefined();
    expect(validateSite({ ...site, notes: "x".repeat(501) }).notes).toBeDefined();
  });
});

describe("normalizeMobile", () => {
  test("accepts the ways people write a mobile number", () => {
    expect(normalizeMobile("09171234567")).toBe("+639171234567");
    expect(normalizeMobile("0917 123 4567")).toBe("+639171234567");
    expect(normalizeMobile("+63 917-123-4567")).toBe("+639171234567");
    expect(normalizeMobile("639171234567")).toBe("+639171234567");
  });

  test("rejects anything else", () => {
    expect(normalizeMobile("12345")).toBeUndefined();
    expect(normalizeMobile("02 8123 4567")).toBeUndefined();
    expect(normalizeMobile("")).toBeUndefined();
  });

  test("reads back the way it was written", () => {
    expect(formatMobile("+639171234567")).toBe("0917 123 4567");
  });
});

describe("validateCheckout", () => {
  test("a complete form has no errors", () => {
    expect(validateCheckout(input(), { needsAccess: false })).toEqual({});
  });

  test("each bad field gets a plain message", () => {
    const errors = validateCheckout(
      input({ site: { contactName: "", mobile: "123", street: "", city: "", area: "Mars" }, deliveryWindow: "", paymentMethod: "cash", deliveryDate: "soon" }),
      { needsAccess: false },
    );
    expect(Object.keys(errors).sort()).toEqual(["area", "city", "contactName", "deliveryDate", "deliveryWindow", "mobile", "paymentMethod", "street"]);
  });

  test("a big load must say whether a big truck fits", () => {
    expect(validateCheckout(input(), { needsAccess: true }).truckAccess).toBeDefined();
    expect(validateCheckout(input({ truckAccess: "wide" }), { needsAccess: true }).truckAccess).toBeUndefined();
  });
});

describe("priceOrder", () => {
  test("uses catalog prices, with tiers", () => {
    const result = priceOrder([line({ quantity: 50, unitPrice: 246 })], products, "Rizal");
    if (!result.ok) throw new Error("expected ok");
    expect(result.lines[0].unitPriceCentavos).toBe(24600);
    expect(result.subtotalCentavos).toBe(1230000);
    expect(result.deliveryFeeCentavos).toBe(80000);
    expect(result.totalCentavos).toBe(1310000);
  });

  test("a price the browser got wrong comes back as a change, and nothing is priced", () => {
    const result = priceOrder([line({ unitPrice: 200 })], products, "Rizal");
    expect(result).toEqual({ ok: false, problems: [{ kind: "price", slug: "portland-cement", name: "Portland Cement Type I", was: 200, now: 252 }] });
  });

  test("delivery is free from the threshold", () => {
    const result = priceOrder([line({ quantity: 200, unitPrice: 240 })], products, "Cavite");
    if (!result.ok) throw new Error("expected ok");
    expect(result.deliveryFeeCentavos).toBe(0);
  });

  test("the far areas cost more", () => {
    const result = priceOrder([line()], products, "Cavite");
    if (!result.ok) throw new Error("expected ok");
    expect(result.deliveryFeeCentavos).toBe(100000);
  });

  test("more than the seller holds is refused", () => {
    const result = priceOrder([line({ quantity: 100000 })], products, "Rizal");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.problems[0]).toMatchObject({ kind: "quantity", quantity: 640 });
  });

  test("below the minimum order is refused", () => {
    const result = priceOrder([{ slug: "hollow-block", variantId: "4-in", sellerSlug: "bato-aggregates", quantity: 10, unitPrice: 15 }], products, "Rizal");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.problems[0]).toMatchObject({ kind: "quantity", quantity: 50 });
  });

  test("half cubic metres stay exact", () => {
    const result = priceOrder([{ slug: "washed-sand", variantId: "fine", sellerSlug: "bato-aggregates", quantity: 1.5, unitPrice: 1450 }], products, "Rizal");
    if (!result.ok) throw new Error("expected ok");
    expect(result.subtotalCentavos).toBe(217500);
  });

  test("centavo prices don't drift", () => {
    expect(toCentavos(14.25)).toBe(1425);
    expect(toCentavos(16.5)).toBe(1650);
    const result = priceOrder([{ slug: "hollow-block", variantId: "4-in", sellerSlug: "dalisay-hardware", quantity: 500, unitPrice: 14.25 }], products, "Rizal");
    if (!result.ok) throw new Error("expected ok");
    expect(result.subtotalCentavos).toBe(712500);
  });

  test("a product or seller that's gone is refused", () => {
    expect(priceOrder([line({ slug: "nothing" })], products, "Rizal")).toMatchObject({ ok: false, problems: [{ kind: "gone" }] });
    expect(priceOrder([line({ sellerSlug: "nobody" })], products, "Rizal")).toMatchObject({ ok: false, problems: [{ kind: "gone" }] });
  });

  test("the same line twice can't spend one seller's stock twice", () => {
    const twice = [line({ quantity: 640, unitPrice: 240 }), line({ quantity: 640, unitPrice: 240 })];
    expect(priceOrder(twice, products, "Rizal")).toMatchObject({ ok: false, problems: [{ kind: "quantity", note: "It's in the order twice." }] });
  });

  test("a seller holding less than their minimum is gone, not a quantity to argue over", () => {
    const low = products.map((p) => (p.slug === "hollow-block" ? { ...p, variants: p.variants.map((v) => ({ ...v, offers: v.offers.map((o) => ({ ...o, stock: 10 })) })) } : p));
    const blocks = line({ slug: "hollow-block", variantId: "4-in", sellerSlug: "bato-aggregates", quantity: 50, unitPrice: 15 });
    expect(priceOrder([blocks], low, "Rizal")).toMatchObject({ ok: false, problems: [{ kind: "gone" }] });
  });

  test("a line's total is the sum the cart showed, to the centavo", () => {
    const odd = products.map((p) => (p.slug === "washed-sand" ? { ...p, variants: p.variants.map((v) => ({ ...v, offers: v.offers.map((o) => ({ ...o, price: 1000.05, tiers: undefined })) })) } : p));
    const sand = line({ slug: "washed-sand", variantId: "fine", sellerSlug: "bato-aggregates", quantity: 1.5, unitPrice: 1000.05 });
    const priced = priceOrder([sand], odd, "Rizal");
    expect(priced).toMatchObject({ ok: true });
    if (priced.ok) expect(priced.lines[0].lineTotalCentavos).toBe(toCentavos(lineTotal(1000.05, 1.5)));
  });

  test("an empty order is refused", () => {
    expect(priceOrder([], products, "Rizal").ok).toBe(false);
  });

  test("each line knows the least its seller can sell", () => {
    const blocks = priceOrder([{ slug: "hollow-block", variantId: "4-in", sellerSlug: "bato-aggregates", quantity: 50, unitPrice: 15 }], products, "Rizal");
    const sand = priceOrder([{ slug: "washed-sand", variantId: "fine", sellerSlug: "bato-aggregates", quantity: 1.5, unitPrice: 1450 }], products, "Rizal");
    const cement = priceOrder([line()], products, "Rizal");
    expect(blocks).toMatchObject({ ok: true, lines: [{ minOrder: 50 }] });
    expect(sand).toMatchObject({ ok: true, lines: [{ minOrder: 1 }] });
    expect(cement).toMatchObject({ ok: true, lines: [{ minOrder: 1 }] });
  });
});

describe("two buyers after the same stock", () => {
  // What's left once the other buyer's order has gone through.
  const leaving = (stock: number) =>
    products.map((p) => (p.slug === "portland-cement" ? { ...p, variants: p.variants.map((v) => ({ ...v, offers: v.offers.map((o) => (o.sellerSlug === "dalisay-hardware" ? { ...o, stock } : o)) })) } : p));
  const lost = (): OrderStore & { saved: NewOrder[] } => ({ ...fakeStore(), insert: async () => Promise.reject(new NotEnoughStockError()) });

  test("the one who loses is told what's left, and isn't charged", async () => {
    payments.start.mockClear();
    const store = lost();
    const load = vi.fn<() => Promise<typeof products>>().mockResolvedValueOnce(products).mockResolvedValue(leaving(4));
    const result = await createOrder(input(), { loadProducts: load, store, payments, now });
    expect(result).toMatchObject({ kind: "changed", problems: [{ kind: "quantity", slug: "portland-cement", quantity: 4 }] });
    expect(payments.start).not.toHaveBeenCalled();
    expect(store.saved).toEqual([]);
  });

  test("if none is left, it's gone", async () => {
    const load = vi.fn<() => Promise<typeof products>>().mockResolvedValueOnce(products).mockResolvedValue(leaving(0));
    expect(await createOrder(input(), { loadProducts: load, store: lost(), payments, now })).toMatchObject({ kind: "changed", problems: [{ kind: "gone", slug: "portland-cement" }] });
  });

  test("if there's enough again a moment later, they're still asked to look again, not charged on a guess", async () => {
    payments.start.mockClear();
    expect(await createOrder(input(), { loadProducts, store: lost(), payments, now })).toMatchObject({ kind: "changed" });
    expect(payments.start).not.toHaveBeenCalled();
  });

  test("the same key arriving twice is one order, not a shortage", async () => {
    const store = fakeStore();
    await createOrder(input(), { loadProducts, store, payments, now });
    const racing: OrderStore = {
      findNumberByKey: vi.fn<OrderStore["findNumberByKey"]>().mockResolvedValueOnce(undefined).mockImplementation(store.findNumberByKey),
      insert: async () => Promise.reject(new NotEnoughStockError()),
      recordPayment: store.recordPayment,
    };
    expect(await createOrder(input(), { loadProducts, store: racing, payments, now })).toMatchObject({ kind: "placed", alreadyPlaced: true });
  });

  test("an order that leaves a seller sold out says so", async () => {
    const store: OrderStore = { ...fakeStore(), insert: async () => ({ soldOut: true }) };
    expect(await createOrder(input(), { loadProducts, store, payments, now })).toMatchObject({ kind: "placed", soldOut: true });
  });

  test("prices are read fresh for the order, not reused from before", async () => {
    const load = vi.fn(loadProducts);
    await createOrder(input(), { loadProducts: load, store: fakeStore(), payments, now });
    expect(load).toHaveBeenCalledTimes(1);
  });
});

describe("createOrder", () => {
  const run = (i: CheckoutInput, store = fakeStore()) => createOrder(i, { loadProducts, store, payments, now });

  test("places an order with the server's totals and a normalized mobile", async () => {
    const store = fakeStore();
    const result = await run(input(), store);
    expect(result.kind).toBe("placed");
    expect(store.saved[0]).toMatchObject({ totalCentavos: 332000, mobile: "+639171234567", paymentStatus: "paid", paymentRef: "SIM-1" });
    expect(store.saved[0].lines).toHaveLength(1);
  });

  test("the same key makes one order, and answers with its number", async () => {
    const store = fakeStore();
    const first = await run(input(), store);
    const second = await run(input(), store);
    expect(store.saved).toHaveLength(1);
    expect(second).toMatchObject({ kind: "placed", alreadyPlaced: true });
    if (first.kind === "placed" && second.kind === "placed") expect(second.number).toBe(first.number);
  });

  test("two requests racing past the first check still make one order", async () => {
    const store = fakeStore();
    await run(input(), store);
    const racing: OrderStore = {
      // The first look finds nothing, as if the other request hadn't saved yet.
      findNumberByKey: vi.fn<OrderStore["findNumberByKey"]>().mockResolvedValueOnce(undefined).mockImplementation(store.findNumberByKey),
      insert: store.insert,
      recordPayment: store.recordPayment,
    };
    const result = await createOrder(input(), { loadProducts, store: racing, payments, now });
    expect(result).toMatchObject({ kind: "placed", alreadyPlaced: true });
    expect(store.saved).toHaveLength(1);
  });

  test("a store failure that isn't a duplicate isn't hidden", async () => {
    const broken: OrderStore = { findNumberByKey: async () => undefined, insert: async () => Promise.reject(new Error("database down")), recordPayment: async () => {} };
    await expect(createOrder(input(), { loadProducts, store: broken, payments, now })).rejects.toThrow("database down");
  });

  test("an order that can't be saved is never charged", async () => {
    payments.start.mockClear();
    const broken: OrderStore = { findNumberByKey: async () => undefined, insert: async () => Promise.reject(new Error("database down")), recordPayment: async () => {} };
    await expect(createOrder(input(), { loadProducts, store: broken, payments, now })).rejects.toThrow();
    expect(payments.start).not.toHaveBeenCalled();
  });

  test("the order is saved before the charge starts", async () => {
    const store = fakeStore();
    const start = vi.fn(async () => {
      expect(store.saved).toHaveLength(1);
      expect(store.saved[0].paymentStatus).toBe("pending");
      return { status: "paid" as const, ref: "SIM-2" };
    });
    await createOrder(input(), { loadProducts, store, payments: { start }, now });
    expect(start).toHaveBeenCalledTimes(1);
    expect(store.saved[0]).toMatchObject({ paymentStatus: "paid", paymentRef: "SIM-2" });
  });

  test("two requests with one key charge once", async () => {
    payments.start.mockClear();
    const store = fakeStore();
    await Promise.all([run(input(), store), run(input(), store)]);
    expect(store.saved).toHaveLength(1);
    expect(payments.start).toHaveBeenCalledTimes(1);
  });

  test("a failed charge leaves an unpaid order, and a retry finds it without charging again", async () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    const store = fakeStore();
    const start = vi.fn(async () => Promise.reject<{ status: "paid" }>(new Error("gateway down")));
    const first = await createOrder(input(), { loadProducts, store, payments: { start }, now });
    expect(first.kind).toBe("placed");
    expect(store.saved[0].paymentStatus).toBe("pending");

    const second = await createOrder(input(), { loadProducts, store, payments: { start }, now });
    expect(second).toMatchObject({ kind: "placed", alreadyPlaced: true });
    expect(start).toHaveBeenCalledTimes(1);
    quiet.mockRestore();
  });

  test("a window today that's too soon is refused, and a later one isn't", async () => {
    const lunchtime = new Date("2026-11-02T13:30:00+08:00");
    const today = { deliveryDate: "2026-11-02" };
    const cement = [line({ quantity: 2 })];
    const tooSoon = await createOrder(input({ ...today, lines: cement, deliveryWindow: "8 AM to 12 NN" }), { loadProducts, store: fakeStore(), payments, now: lunchtime });
    expect(tooSoon.kind).toBe("invalid");
    if (tooSoon.kind === "invalid") expect(tooSoon.errors.deliveryWindow).toMatch(/too soon/);

    const later = await createOrder(input({ ...today, lines: cement, deliveryWindow: "1 PM to 5 PM" }), { loadProducts, store: fakeStore(), payments, now: lunchtime });
    expect(later.kind).toBe("placed");
  });

  test("a truck answer on a small load isn't stored", async () => {
    const store = fakeStore();
    await run(input({ truckAccess: "wide" }), store);
    expect(store.saved[0].truckAccess).toBeUndefined();
  });

  test("a changed price stops the order before any payment", async () => {
    payments.start.mockClear();
    const store = fakeStore();
    const result = await run(input({ lines: [line({ unitPrice: 200 })] }), store);
    expect(result.kind).toBe("changed");
    expect(payments.start).not.toHaveBeenCalled();
    expect(store.saved).toEqual([]);
  });

  test("a day before the sellers can be ready is refused", async () => {
    const result = await run(input({ deliveryDate: "2026-11-01" }));
    expect(result.kind).toBe("invalid");
    if (result.kind === "invalid") expect(result.errors.deliveryDate).toMatch(/too soon/);
  });

  test("a day past the week that can be booked is refused", async () => {
    const result = await run(input({ deliveryDate: "2099-01-01" }));
    expect(result.kind).toBe("invalid");
    if (result.kind === "invalid") expect(result.errors.deliveryDate).toMatch(/days shown/);
  });

  test("a heavy load must answer the truck question", async () => {
    const heavy = input({ lines: [{ slug: "hollow-block", variantId: "4-in", sellerSlug: "bato-aggregates", quantity: 2000, unitPrice: 14 }] });
    const result = await run(heavy);
    expect(result.kind).toBe("invalid");
    if (result.kind === "invalid") expect(result.errors.truckAccess).toBeDefined();
    expect((await run({ ...heavy, truckAccess: "wide" })).kind).toBe("placed");
  });
});

describe("newOrderNumber", () => {
  test("has the right shape", () => {
    expect(newOrderNumber()).toMatch(/^MX-[A-HJ-NP-Z2-9]{8}$/);
  });

  test("isn't sequential", () => {
    const numbers = new Set(Array.from({ length: 200 }, newOrderNumber));
    expect(numbers.size).toBe(200);
  });
});
