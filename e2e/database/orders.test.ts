// The real order code against a real database, with buyers fired at the same instant. Run with `npm run test:db`.
// Every order made here is removed afterwards, and the stock it touched is put back. Needs the sample catalog.
// Never point it at production.
import { config } from "dotenv";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

config({ path: [".env.local"], quiet: true });

const SLUG = "masonry-cement";
const VARIANT = "40-kg";
const SELLER = "dalisay-hardware";
const SECOND = { slug: "premixed-mortar", variantId: "25-kg", sellerSlug: "dalisay-hardware" };

describe("orders against the real database", async () => {
  const { db } = await import("@/db");
  const { offers, orders } = await import("@/db/schema");
  const { readProducts } = await import("@/lib/catalog/read");
  const { arrivalDate, bookableDays, dayKey, openWindows } = await import("@/lib/delivery");
  const { createOrder, NotEnoughStockError } = await import("@/lib/orders/create-order");
  const { orderStore } = await import("@/lib/orders/repo");
  const { and, eq, inArray } = await import("drizzle-orm");

  const created: string[] = [];
  const row = (slug: string, variant: string, seller: string) => and(eq(offers.productSlug, slug), eq(offers.variantId, variant), eq(offers.sellerSlug, seller));
  const stockOf = async (slug: string, variant: string, seller: string) => (await db.select({ stock: offers.stock }).from(offers).where(row(slug, variant, seller)))[0].stock;
  const setStock = (slug: string, variant: string, seller: string, stock: number) => db.update(offers).set({ stock }).where(row(slug, variant, seller));

  const now = new Date();
  const deliveryDate = bookableDays(arrivalDate(now, 0, "Rizal")).map(dayKey).at(-1)!;
  const deliveryWindow = openWindows(deliveryDate, now)[0];
  const input = (lines: { slug: string; variantId: string; sellerSlug: string; quantity: number; unitPrice: number }[], key: string = crypto.randomUUID()) => ({
    idempotencyKey: key,
    site: { contactName: "Test Buyer", mobile: "0917 000 1234", street: "12 Test Street", city: "San Roque, Antipolo", area: "Rizal" },
    deliveryDate,
    deliveryWindow,
    paymentMethod: "gcash",
    lines,
  });
  const cement = (quantity: number) => ({ slug: SLUG, variantId: VARIANT, sellerSlug: SELLER, quantity, unitPrice: 241 });
  const load = (slugs: string[]) => () => readProducts(slugs);

  let startFirst = 0;
  let startSecond = 0;
  beforeAll(async () => {
    startFirst = await stockOf(SLUG, VARIANT, SELLER);
    startSecond = await stockOf(SECOND.slug, SECOND.variantId, SECOND.sellerSlug);
  });
  afterAll(async () => {
    if (created.length) await db.delete(orders).where(inArray(orders.number, created));
    await setStock(SLUG, VARIANT, SELLER, startFirst);
    await setStock(SECOND.slug, SECOND.variantId, SECOND.sellerSlug, startSecond);
  });

  test("two buyers at the same instant, stock for one: one wins, the other is told and never charged", async () => {
    let collisions = 0;
    for (let round = 0; round < 6; round++) {
      await setStock(SLUG, VARIANT, SELLER, 5);
      const insert = vi.spyOn(orderStore, "insert");
      const payments = { start: vi.fn(async ({ number }: { number: string }) => ({ status: "paid" as const, ref: `TEST-${number}` })) };
      const results = await Promise.all([1, 2].map(() => createOrder(input([cement(5)]), { loadProducts: load([SLUG]), store: orderStore, payments, now })));
      const attempts = insert.mock.calls.length;
      insert.mockRestore();
      if (attempts === 2) collisions++;

      const won = results.filter((r) => r.kind === "placed");
      const lost = results.filter((r) => r.kind === "changed");
      won.forEach((r) => r.kind === "placed" && created.push(r.number));
      expect(won).toHaveLength(1);
      expect(lost).toHaveLength(1);
      expect(lost[0]).toMatchObject({ kind: "changed", problems: [{ kind: "gone", slug: SLUG }] });
      expect(payments.start).toHaveBeenCalledTimes(1);
      expect(await stockOf(SLUG, VARIANT, SELLER)).toBe(0);
      expect(won[0]).toMatchObject({ soldOut: true });
    }
    expect(collisions).toBeGreaterThan(0);
  });

  test("ten buyers at once for stock enough for three", async () => {
    await setStock(SLUG, VARIANT, SELLER, 15);
    const payments = { start: vi.fn(async ({ number }: { number: string }) => ({ status: "paid" as const, ref: `TEST-${number}` })) };
    const results = await Promise.all(Array.from({ length: 10 }, () => createOrder(input([cement(5)]), { loadProducts: load([SLUG]), store: orderStore, payments, now })));
    const won = results.filter((r) => r.kind === "placed");
    won.forEach((r) => r.kind === "placed" && created.push(r.number));
    expect(won).toHaveLength(3);
    expect(payments.start).toHaveBeenCalledTimes(3);
    expect(await stockOf(SLUG, VARIANT, SELLER)).toBe(0);
  });

  test("an order that can only half be filled saves nothing and takes nothing", async () => {
    await setStock(SLUG, VARIANT, SELLER, 100);
    await setStock(SECOND.slug, SECOND.variantId, SECOND.sellerSlug, 1);
    const number = `MX-TEST${Math.floor(Math.random() * 9000 + 1000)}`;
    const line = (over: object) => ({ variantLabel: undefined, sellerName: "Dalisay Hardware", name: "Test", unit: "bag", image: "/x.webp", categorySlug: "cement-concrete", unitPriceCentavos: 100, lineTotalCentavos: 100, leadDays: 0, weightKg: 1, minOrder: 1, ...over });
    await expect(
      orderStore.insert({
        id: crypto.randomUUID(),
        number,
        contactName: "Test Buyer",
        mobile: "+639170001234",
        street: "12 Test Street",
        city: "Antipolo",
        area: "Rizal",
        deliveryDate,
        deliveryWindow,
        subtotalCentavos: 100,
        deliveryFeeCentavos: 0,
        totalCentavos: 100,
        paymentMethod: "gcash",
        paymentStatus: "pending",
        idempotencyKey: crypto.randomUUID(),
        // Only what saving an order reads. It never gets as far as the rest.
        lines: [
          line({ productSlug: SLUG, variantId: VARIANT, sellerSlug: SELLER, quantity: 10 }),
          line({ productSlug: SECOND.slug, variantId: SECOND.variantId, sellerSlug: SECOND.sellerSlug, quantity: 2 }),
        ] as never,
      }),
    ).rejects.toBeInstanceOf(NotEnoughStockError);
    expect(await stockOf(SLUG, VARIANT, SELLER)).toBe(100);
    expect(await stockOf(SECOND.slug, SECOND.variantId, SECOND.sellerSlug)).toBe(1);
    expect(await db.select().from(orders).where(eq(orders.number, number))).toEqual([]);
  });

  test("the same order sent twice at once is one order, and takes stock once", async () => {
    await setStock(SLUG, VARIANT, SELLER, 50);
    const key = crypto.randomUUID();
    const payments = { start: vi.fn(async ({ number }: { number: string }) => ({ status: "paid" as const, ref: `TEST-${number}` })) };
    const results = await Promise.all([1, 2, 3].map(() => createOrder(input([cement(5)], key), { loadProducts: load([SLUG]), store: orderStore, payments, now })));
    const numbers = new Set(results.flatMap((r) => (r.kind === "placed" ? [r.number] : [])));
    numbers.forEach((n) => created.push(n));
    expect(results.every((r) => r.kind === "placed")).toBe(true);
    expect(numbers.size).toBe(1);
    expect(await stockOf(SLUG, VARIANT, SELLER)).toBe(45);
    expect(payments.start).toHaveBeenCalledTimes(1);
  });

  test("half units come off exactly", async () => {
    const sand = { slug: "washed-sand", variantId: "fine", sellerSlug: "bato-aggregates" };
    const before = await stockOf(sand.slug, sand.variantId, sand.sellerSlug);
    await setStock(sand.slug, sand.variantId, sand.sellerSlug, 10);
    const payments = { start: vi.fn(async ({ number }: { number: string }) => ({ status: "paid" as const, ref: `TEST-${number}` })) };
    const result = await createOrder(input([{ ...sand, quantity: 1.5, unitPrice: 1450 }]), { loadProducts: load([sand.slug]), store: orderStore, payments, now });
    expect(result).toMatchObject({ kind: "placed" });
    if (result.kind === "placed") created.push(result.number);
    expect(await stockOf(sand.slug, sand.variantId, sand.sellerSlug)).toBe(8.5);
    await setStock(sand.slug, sand.variantId, sand.sellerSlug, before);
  });
});
