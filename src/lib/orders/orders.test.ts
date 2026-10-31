import { describe, expect, test, vi } from "vitest";
import { products } from "@/lib/catalog/data/products";
import { createOrder, newOrderNumber, type NewOrder, type OrderStore } from "./create-order";
import { priceOrder, toCentavos } from "./price-order";
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
    },
  };
}

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

  test("an empty order is refused", () => {
    expect(priceOrder([], products, "Rizal").ok).toBe(false);
  });
});

describe("createOrder", () => {
  const run = (i: CheckoutInput, store = fakeStore()) => createOrder(i, { products, store, payments, now });

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
    };
    const result = await createOrder(input(), { products, store: racing, payments, now });
    expect(result).toMatchObject({ kind: "placed", alreadyPlaced: true });
    expect(store.saved).toHaveLength(1);
  });

  test("a store failure that isn't a duplicate isn't hidden", async () => {
    const broken: OrderStore = { findNumberByKey: async () => undefined, insert: async () => Promise.reject(new Error("database down")) };
    await expect(createOrder(input(), { products, store: broken, payments, now })).rejects.toThrow("database down");
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
