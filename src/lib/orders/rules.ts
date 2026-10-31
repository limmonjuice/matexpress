import { deliveryAreas, DELIVERY_WINDOWS } from "@/lib/delivery";

// The checkout's form rules. Pure and shared, so the browser and the server agree.

export const PAYMENT_METHODS = [
  { id: "gcash", label: "GCash" },
  { id: "maya", label: "Maya" },
  { id: "card", label: "Credit or debit card" },
  { id: "banking", label: "Online banking" },
] as const;

export const TRUCK_ACCESS = [
  { id: "wide", label: "Yes, the road is wide enough" },
  { id: "narrow", label: "Narrow road, send smaller trucks" },
  { id: "unsure", label: "Not sure, call me first" },
] as const;

/** What to say when a call to the server fails outright. */
export const CONNECTION_ERROR = "We couldn't reach the store. Check your connection and try again.";

/** Better Auth's messages, in plain words. */
export function friendlyAuthError(message?: string) {
  if (!message) return "Something went wrong. Please try again.";
  if (/invalid email or password/i.test(message)) return "That email and password don't match.";
  if (/already exists/i.test(message)) return "There's already an account with that email. Try signing in.";
  return message;
}

/** A path on this site, or nothing. "//evil.example" and "/\\evil.example" start with a slash too, so the browser's own parser decides. */
export function localPath(next: unknown) {
  if (typeof next !== "string" || !next.startsWith("/")) return undefined;
  const here = "https://matexpress.invalid";
  try {
    const url = new URL(next, here);
    return url.origin === here ? `${url.pathname}${url.search}${url.hash}` : undefined;
  } catch {
    return undefined;
  }
}

/** Where checkout keeps what's been typed, for this tab only. Never holds payment details. */
export const CHECKOUT_DRAFT_KEY = "matexpress-checkout";

/** The key of the order being placed, and what it was for. Holds what the draft holds, so it goes when the draft does. */
export const CHECKOUT_ATTEMPT_KEY = "matexpress-checkout-attempt";

/** The longest each typed field can be. The browser stops there, and the server refuses anything past it. */
export const FIELD_LIMITS = { contactName: 80, street: 160, city: 120, notes: 500, storeName: 120, sells: 300 } as const;

/** The colours a store can pick for its awning when it applies to sell. */
export const SELLER_AWNINGS = [
  { name: "Orange", colour: "#f48b3e" },
  { name: "Navy", colour: "#2a3240" },
  { name: "Bronze", colour: "#b08d57" },
  { name: "Gold", colour: "#d9a521" },
  { name: "Steel", colour: "#5b6472" },
  { name: "Brown", colour: "#8a5a2b" },
] as const;

export type SiteFields = {
  contactName: string;
  mobile: string;
  street: string;
  city: string;
  area: string;
  notes?: string;
};

export type CheckoutInput = {
  idempotencyKey: string;
  site: SiteFields;
  truckAccess?: string;
  deliveryDate: string;
  deliveryWindow: string;
  paymentMethod: string;
  lines: { slug: string; variantId: string; sellerSlug: string; quantity: number; unitPrice: number }[];
};

export type FieldErrors = Partial<Record<"contactName" | "mobile" | "street" | "city" | "area" | "notes" | "deliveryDate" | "deliveryWindow" | "paymentMethod" | "truckAccess", string>>;

/** "0917 123 4567" and "+63 917 123 4567" are the same number. Undefined if it isn't a Philippine mobile. */
export function normalizeMobile(raw: string) {
  const digits = raw.replace(/[\s()-]/g, "");
  const match = digits.match(/^(?:\+?63|0)(9\d{9})$/);
  return match ? `+63${match[1]}` : undefined;
}

export const formatMobile = (mobile: string) => mobile.replace(/^\+63(\d{3})(\d{3})(\d{4})$/, "0$1 $2 $3");

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_LINES = 100;
const text = (value: unknown): value is string => typeof value === "string" && value.length <= 1000;
const optionalText = (value: unknown) => value === undefined || value === null || text(value);

export const isId = (value: unknown): value is string => typeof value === "string" && UUID.test(value);

/** Server Actions are public endpoints: what arrives is whatever someone chose to send, not what the form sends. */
export function isSiteFields(raw: unknown): raw is SiteFields {
  const site = raw as SiteFields | null;
  return typeof raw === "object" && raw !== null && text(site?.contactName) && text(site?.mobile) && text(site?.street) && text(site?.city) && text(site?.area) && optionalText(site?.notes);
}

export function isCheckoutInput(raw: unknown): raw is CheckoutInput {
  const input = raw as CheckoutInput | null;
  return (
    typeof raw === "object" &&
    raw !== null &&
    isId(input?.idempotencyKey) &&
    isSiteFields(input?.site) &&
    optionalText(input?.truckAccess) &&
    text(input?.deliveryDate) &&
    text(input?.deliveryWindow) &&
    text(input?.paymentMethod) &&
    Array.isArray(input?.lines) &&
    input.lines.length <= MAX_LINES &&
    input.lines.every((line) => text(line?.slug) && text(line?.variantId) && text(line?.sellerSlug) && typeof line?.quantity === "number" && typeof line?.unitPrice === "number")
  );
}

export function validateSite(site: SiteFields): FieldErrors {
  const errors: FieldErrors = {};
  const { contactName, street, city, notes } = FIELD_LIMITS;
  if (site.contactName.trim().length < 2 || site.contactName.length > contactName) errors.contactName = "Enter a name for the driver to ask for.";
  if (!normalizeMobile(site.mobile)) errors.mobile = "Enter a mobile number like 0917 123 4567.";
  if (site.street.trim().length < 5 || site.street.length > street) errors.street = "Enter the street and lot, so the driver can find it.";
  if (site.city.trim().length < 2 || site.city.length > city) errors.city = "Enter the barangay and city.";
  if ((site.notes?.length ?? 0) > notes) errors.notes = "Keep the notes shorter.";
  if (!deliveryAreas.includes(site.area)) errors.area = "We deliver to Metro Manila, Rizal, Cavite, Laguna and Bulacan.";
  return errors;
}

export function validateCheckout(input: CheckoutInput, { needsAccess }: { needsAccess: boolean }): FieldErrors {
  const errors = validateSite(input.site);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.deliveryDate)) errors.deliveryDate = "Pick a delivery day.";
  if (!DELIVERY_WINDOWS.includes(input.deliveryWindow)) errors.deliveryWindow = "Pick a delivery window.";
  if (!PAYMENT_METHODS.some((m) => m.id === input.paymentMethod)) errors.paymentMethod = "Pick how you'll pay.";
  if (needsAccess && !TRUCK_ACCESS.some((a) => a.id === input.truckAccess)) errors.truckAccess = "Tell us whether a big truck can reach the gate.";
  return errors;
}
