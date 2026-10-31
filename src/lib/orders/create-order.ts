import type { Product } from "@/lib/catalog/types";
import { arrivalDate, bookableDays, dayKey, openWindows } from "@/lib/delivery";
import { loadFor } from "@/lib/load";
import { priceOrder, type OrderProblem, type PricedLine } from "./price-order";
import { normalizeMobile, validateCheckout, type CheckoutInput, type FieldErrors } from "./rules";

// Placing an order, kept apart from the database and cookies so every way it can go wrong can be tested.

const ORDER_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Random, not sequential: an order number shouldn't say how many orders there are, or what the next one is. */
export function newOrderNumber() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return `MX-${Array.from(bytes, (b) => ORDER_ALPHABET[b % ORDER_ALPHABET.length]).join("")}`;
}

export type PaymentStatus = "paid" | "pending";

export type NewOrder = {
  id: string;
  number: string;
  userId?: string;
  contactName: string;
  mobile: string;
  street: string;
  city: string;
  area: string;
  notes?: string;
  truckAccess?: string;
  deliveryDate: string;
  deliveryWindow: string;
  subtotalCentavos: number;
  deliveryFeeCentavos: number;
  totalCentavos: number;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  paymentRef?: string;
  idempotencyKey: string;
  lines: PricedLine[];
};

export type OrderStore = {
  findNumberByKey: (key: string) => Promise<string | undefined>;
  /** Throws if the idempotency key is already taken. */
  insert: (order: NewOrder) => Promise<void>;
  recordPayment: (number: string, payment: { status: PaymentStatus; ref?: string }) => Promise<void>;
};

export type PaymentProvider = {
  start: (order: { number: string; totalCentavos: number; method: string }) => Promise<{ status: PaymentStatus; ref?: string }>;
};

export type CreateOrderResult =
  | { kind: "placed"; number: string; alreadyPlaced?: boolean }
  | { kind: "invalid"; errors: FieldErrors }
  | { kind: "changed"; problems: OrderProblem[] };

type Deps = {
  products: Product[];
  store: OrderStore;
  payments: PaymentProvider;
  now: Date;
  userId?: string;
};

export async function createOrder(input: CheckoutInput, { products, store, payments, now, userId }: Deps): Promise<CreateOrderResult> {
  // A double tap or a retry on a slow network sends the same key: answer with the order it already made.
  const existing = await store.findNumberByKey(input.idempotencyKey);
  if (existing) return { kind: "placed", number: existing, alreadyPlaced: true };

  const priced = priceOrder(input.lines, products, input.site.area);
  if (!priced.ok) return { kind: "changed", problems: priced.problems };

  const { needsAccess } = loadFor(priced.weightKg);
  const errors = validateCheckout(input, { needsAccess });
  const slowest = Math.max(...priced.lines.map((l) => l.leadDays));
  if (!errors.deliveryDate) {
    const days = bookableDays(arrivalDate(now, slowest, input.site.area)).map(dayKey);
    if (input.deliveryDate < days[0]) errors.deliveryDate = "That day is too soon for these sellers. Pick a later one.";
    else if (!days.includes(input.deliveryDate)) errors.deliveryDate = "We can only book the days shown. Pick one of them.";
    else if (!errors.deliveryWindow && !openWindows(input.deliveryDate, now).includes(input.deliveryWindow)) errors.deliveryWindow = "That window is too soon for today. Pick a later one.";
  }
  if (Object.keys(errors).length) return { kind: "invalid", errors };

  const number = newOrderNumber();

  // Saved before any charge: the unique key lets one request through, and no one pays for an order that doesn't exist.
  try {
    await store.insert({
      id: crypto.randomUUID(),
      number,
      ...(userId ? { userId } : {}),
      contactName: input.site.contactName.trim(),
      mobile: normalizeMobile(input.site.mobile)!,
      street: input.site.street.trim(),
      city: input.site.city.trim(),
      area: input.site.area,
      ...(input.site.notes?.trim() ? { notes: input.site.notes.trim() } : {}),
      ...(needsAccess ? { truckAccess: input.truckAccess } : {}),
      deliveryDate: input.deliveryDate,
      deliveryWindow: input.deliveryWindow,
      subtotalCentavos: priced.subtotalCentavos,
      deliveryFeeCentavos: priced.deliveryFeeCentavos,
      totalCentavos: priced.totalCentavos,
      paymentMethod: input.paymentMethod,
      paymentStatus: "pending",
      idempotencyKey: input.idempotencyKey,
      lines: priced.lines,
    });
  } catch (error) {
    // Two identical requests can pass the first check together. The database keeps one; the other finds it here.
    const raced = await store.findNumberByKey(input.idempotencyKey);
    if (raced) return { kind: "placed", number: raced, alreadyPlaced: true };
    throw error;
  }

  // The order stands either way. If the charge fails it shows as unpaid, and a retry finds it instead of charging again.
  try {
    await store.recordPayment(number, await payments.start({ number, totalCentavos: priced.totalCentavos, method: input.paymentMethod }));
  } catch (error) {
    console.error(`Payment failed for ${number}`, error);
  }

  return { kind: "placed", number };
}
