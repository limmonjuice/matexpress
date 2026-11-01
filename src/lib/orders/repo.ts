import "server-only";
import { and, desc, eq, getTableColumns, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { offers, orderEvents, orderItems, orders, products, sellerApplications, sellers, sites, variants } from "@/db/schema";
import { NotEnoughStockError, type NewOrder, type OrderStore } from "./create-order";
import type { SiteFields } from "./rules";

/** The database refusing to let a seller's stock go below zero. */
function brokeStockCheck(error: unknown): boolean {
  const { constraint, cause } = (error ?? {}) as { constraint?: string; cause?: unknown };
  return constraint === "offers_stock_not_negative" || (cause !== undefined && brokeStockCheck(cause));
}

export const orderStore: OrderStore = {
  async findNumberByKey(key) {
    const [row] = await db.select({ number: orders.number }).from(orders).where(eq(orders.idempotencyKey, key)).limit(1);
    return row?.number;
  },

  // One batch runs as one transaction over HTTP: an order is never saved without its items or its stock taken,
  // and if any seller is short, nothing at all is saved.
  async insert(order: NewOrder) {
    const { lines, ...head } = order;
    // Always in the same order, so two orders for the same things wait for each other instead of deadlocking.
    const byOffer = [...lines].sort((a, b) => `${a.productSlug}:${a.variantId}:${a.sellerSlug}`.localeCompare(`${b.productSlug}:${b.variantId}:${b.sellerSlug}`));
    const takeStock = byOffer.map((line) =>
      db
        .update(offers)
        .set({ stock: sql`${offers.stock} - ${line.quantity}` })
        .where(and(eq(offers.productSlug, line.productSlug), eq(offers.variantId, line.variantId), eq(offers.sellerSlug, line.sellerSlug)))
        .returning({ stock: offers.stock }),
    );

    try {
      const [, , , ...stockLeft] = await db.batch([
        db.insert(orders).values(head),
        db.insert(orderItems).values(
          lines.map((line) => ({
            id: crypto.randomUUID(),
            orderId: order.id,
            productSlug: line.productSlug,
            variantId: line.variantId,
            variantLabel: line.variantLabel,
            sellerSlug: line.sellerSlug,
            sellerName: line.sellerName,
            name: line.name,
            unit: line.unit,
            image: line.image,
            unitPriceCentavos: line.unitPriceCentavos,
            quantity: String(line.quantity),
            lineTotalCentavos: line.lineTotalCentavos,
          })),
        ),
        db.insert(orderEvents).values({ id: crypto.randomUUID(), orderId: order.id, type: "placed" }),
        ...takeStock,
      ]);
      const left = stockLeft as { stock: number }[][];
      return { soldOut: byOffer.some((line, i) => left[i][0] !== undefined && left[i][0].stock < line.minOrder) };
    } catch (error) {
      if (brokeStockCheck(error)) throw new NotEnoughStockError();
      throw error;
    }
  },

  async recordPayment(number, { status, ref }) {
    await db.update(orders).set({ paymentStatus: status, paymentRef: ref }).where(eq(orders.number, number));
  },
};

export async function findOrder(number: string) {
  const thisOrder = db.select({ id: orders.id }).from(orders).where(eq(orders.number, number));
  // One batch is one trip to the database, however many queries are in it.
  const [[order], items, events] = await db.batch([
    db.select().from(orders).where(eq(orders.number, number)).limit(1),
    // What the page draws from the catalog comes along here, not from a read of the whole thing. Left joins, because an order outlives what it bought.
    db
      .select({ ...getTableColumns(orderItems), weightKg: variants.weightKg, categorySlug: products.categorySlug, sellerTint: sellers.tint })
      .from(orderItems)
      .leftJoin(variants, and(eq(variants.productSlug, orderItems.productSlug), eq(variants.id, orderItems.variantId)))
      .leftJoin(products, eq(products.slug, orderItems.productSlug))
      .leftJoin(sellers, eq(sellers.slug, orderItems.sellerSlug))
      .where(inArray(orderItems.orderId, thisOrder)),
    db.select().from(orderEvents).where(inArray(orderEvents.orderId, thisOrder)),
  ]);
  if (!order) return undefined;
  return { order, items, events };
}

export type LoadedOrder = NonNullable<Awaited<ReturnType<typeof findOrder>>>;

/** What a list of orders shows. The mobile, notes and the rest stay put until someone opens the order. */
const orderSummary = {
  id: orders.id,
  number: orders.number,
  userId: orders.userId,
  street: orders.street,
  area: orders.area,
  deliveryDate: orders.deliveryDate,
  totalCentavos: orders.totalCentavos,
};

export async function ordersByNumbers(numbers: string[]) {
  if (!numbers.length) return [];
  return db.select(orderSummary).from(orders).where(inArray(orders.number, numbers)).orderBy(desc(orders.createdAt));
}

/** Years of weekly orders, and a limit on how much one page can ever ask for. */
export const ACCOUNT_ORDER_LIMIT = 100;

/** Everything the account page lists, in one trip. Orders from this browser only count if no one owns them yet. */
export async function loadAccount(userId: string, proven: string[]) {
  const [ownOrders, ownSites, unclaimed] = await db.batch([
    db.select(orderSummary).from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt)).limit(ACCOUNT_ORDER_LIMIT),
    db.select().from(sites).where(eq(sites.userId, userId)).orderBy(desc(sites.createdAt)),
    db
      .select(orderSummary)
      .from(orders)
      .where(and(inArray(orders.number, proven), isNull(orders.userId)))
      .orderBy(desc(orders.createdAt)),
  ]);
  return { orders: ownOrders, sites: ownSites, unclaimed };
}

export async function itemsForOrder(orderId: string) {
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

/** Only orders no one owns yet: a signed-in buyer never takes one from another account. */
export async function claimOrders(numbers: string[], userId: string) {
  if (!numbers.length) return;
  await db
    .update(orders)
    .set({ userId })
    .where(and(inArray(orders.number, numbers), isNull(orders.userId)));
}

export async function sitesForUser(userId: string) {
  return db.select().from(sites).where(eq(sites.userId, userId)).orderBy(desc(sites.createdAt));
}

export async function insertSite(userId: string, site: SiteFields) {
  await db.insert(sites).values({
    id: crypto.randomUUID(),
    userId,
    contactName: site.contactName.trim(),
    mobile: site.mobile,
    street: site.street.trim(),
    city: site.city.trim(),
    area: site.area,
    notes: site.notes?.trim() || null,
  });
}

export async function deleteSite(userId: string, id: string) {
  await db.delete(sites).where(and(eq(sites.id, id), eq(sites.userId, userId)));
}

export async function insertSellerApplication(application: { storeName: string; contactName: string; mobile: string; city: string; sells: string; awning?: string }) {
  await db.insert(sellerApplications).values({ id: crypto.randomUUID(), ...application });
}
