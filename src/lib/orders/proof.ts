import { createHmac, timingSafeEqual } from "node:crypto";

// A signed list of the orders this browser may open. Buyers without an account
// prove an order is theirs once, by placing it or by giving its number and mobile.

const MAX_ORDERS = 20;

const sign = (payload: string, secret: string) => createHmac("sha256", secret).update(payload).digest("base64url");

export function signProof(numbers: string[], secret: string) {
  const payload = Buffer.from(JSON.stringify(numbers.slice(-MAX_ORDERS))).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

/** The orders a cookie proves. Anything tampered with or unreadable proves nothing. */
export function readProof(cookie: string | undefined, secret: string): string[] {
  if (!cookie) return [];
  const [payload, signature] = cookie.split(".");
  if (!payload || !signature) return [];
  const expected = Buffer.from(sign(payload, secret));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return [];
  try {
    const parsed: unknown = JSON.parse(Buffer.from(payload, "base64url").toString());
    return Array.isArray(parsed) ? parsed.filter((n): n is string => typeof n === "string") : [];
  } catch {
    return [];
  }
}

/** An order opens for the browser that proved it, or for the account it belongs to. Nobody else. */
export function canSeeOrder(order: { number: string; userId: string | null }, proven: string[], user?: { id: string }) {
  return proven.includes(order.number) || (user !== undefined && order.userId === user.id);
}
