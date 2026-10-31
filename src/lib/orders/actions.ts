"use server";

import { redirect } from "next/navigation";
import { listProducts } from "@/lib/catalog";
import { toLine } from "@/lib/catalog/card";
import type { LineData } from "@/lib/catalog/types";
import { createOrder, type CreateOrderResult, type PaymentProvider } from "./create-order";
import { canSeeOrder } from "./proof";
import { claimOrders, deleteSite, findOrder, insertSellerApplication, insertSite, itemsForOrder, ordersByNumbers, orderStore, sitesForUser } from "./repo";
import { FIELD_LIMITS, isCheckoutInput, isId, isSiteFields, normalizeMobile, SELLER_AWNINGS, validateSite, type CheckoutInput, type FieldErrors, type SiteFields } from "./rules";
import { currentUser, forgetOrderAccess, grantOrderAccess, provenOrders } from "./session";
import { simulatedPayments } from "./simulated-payments";

const payments: PaymentProvider = simulatedPayments;

export async function placeOrder(input: CheckoutInput): Promise<CreateOrderResult> {
  if (!isCheckoutInput(input)) return { kind: "changed", problems: [{ kind: "gone", slug: "" }] };
  const user = await currentUser();
  const result = await createOrder(input, {
    products: await listProducts(),
    store: orderStore,
    payments,
    now: new Date(),
    userId: user?.id,
  });
  if (result.kind === "placed") await grantOrderAccess(result.number);
  return result;
}

/** The same answer for a wrong number and a wrong mobile, so this can't be used to find orders that exist. */
export async function lookupOrder(_: { error?: string } | undefined, form: FormData): Promise<{ error?: string }> {
  const number = String(form.get("number") ?? "").trim().toUpperCase();
  const mobile = normalizeMobile(String(form.get("mobile") ?? ""));
  const notFound = { error: "We couldn't find an order with that number and mobile. Check both and try again." };
  if (!number || !mobile) return notFound;

  const found = await findOrder(number);
  if (!found || found.order.mobile !== mobile) return notFound;

  await grantOrderAccess(number);
  redirect(`/orders/${number}`);
}

/**
 * Adds one order this browser can prove to the signed-in account, when the buyer asks.
 * Never on signing in: on a shared computer, the last buyer's order isn't the next one's.
 */
export async function claimOrder(number: string) {
  const user = await currentUser();
  if (!user || typeof number !== "string") return;
  if ((await provenOrders()).includes(number)) await claimOrders([number], user.id);
}

export async function forgetBrowserOrders() {
  await forgetOrderAccess();
}

/** What's in an old order, as cart lines at today's prices, and what can no longer be bought. */
export async function buyAgain(number: string): Promise<{ lines: (LineData & { quantity: number })[]; unavailable: string[] }> {
  if (typeof number !== "string") return { lines: [], unavailable: [] };
  const user = await currentUser();
  const proven = await provenOrders();
  const [order] = await ordersByNumbers([number]);
  if (!order || !canSeeOrder(order, proven, user)) return { lines: [], unavailable: [] };

  const products = await listProducts();
  const lines: (LineData & { quantity: number })[] = [];
  const unavailable: string[] = [];
  for (const item of await itemsForOrder(order.id)) {
    const product = products.find((p) => p.slug === item.productSlug);
    const variant = product?.variants.find((v) => v.id === item.variantId);
    const offer = variant?.offers.find((o) => o.sellerSlug === item.sellerSlug && o.stock > 0);
    if (product && variant && offer) lines.push({ ...toLine(product, variant, offer), quantity: Math.min(Number(item.quantity), offer.stock) });
    else unavailable.push(item.name);
  }
  return { lines, unavailable };
}

export async function listMySites() {
  const user = await currentUser();
  if (!user) return [];
  const rows = await sitesForUser(user.id);
  return rows.map((row) => ({ id: row.id, contactName: row.contactName, mobile: row.mobile, street: row.street, city: row.city, area: row.area, notes: row.notes ?? "" }));
}

export async function saveSite(site: SiteFields): Promise<{ errors?: FieldErrors }> {
  const user = await currentUser();
  if (!user) return { errors: { contactName: "Sign in to save a site." } };
  if (!isSiteFields(site)) return { errors: { contactName: "Enter a name for the driver to ask for." } };
  const errors = validateSite(site);
  if (Object.keys(errors).length) return { errors };
  await insertSite(user.id, { ...site, mobile: normalizeMobile(site.mobile)! });
  return {};
}

export async function removeSite(id: string) {
  const user = await currentUser();
  if (user && isId(id)) await deleteSite(user.id, id);
}

export async function applyToSell(_: { error?: string; done?: boolean } | undefined, form: FormData): Promise<{ error?: string; done?: boolean }> {
  const storeName = String(form.get("storeName") ?? "").trim();
  const contactName = String(form.get("contactName") ?? "").trim();
  const city = String(form.get("city") ?? "").trim();
  const sells = String(form.get("sells") ?? "").trim();
  const mobile = normalizeMobile(String(form.get("mobile") ?? ""));
  const awning = SELLER_AWNINGS.find((a) => a.name === form.get("awning"))?.name;
  if (storeName.length < 2 || storeName.length > FIELD_LIMITS.storeName) return { error: "Enter your store's name." };
  if (contactName.length < 2 || contactName.length > FIELD_LIMITS.contactName) return { error: "Enter who we should talk to." };
  if (!mobile) return { error: "Enter a mobile number like 0917 123 4567." };
  if (city.length < 2 || city.length > FIELD_LIMITS.city) return { error: "Enter your store's city." };
  if (sells.length < 2 || sells.length > FIELD_LIMITS.sells) return { error: "Tell us what your store sells." };
  await insertSellerApplication({ storeName, contactName, mobile, city, sells, awning });
  return { done: true };
}
