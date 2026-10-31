import type { LineData, Offer, Product } from "./types";
import { priceForQuantity } from "@/lib/pricing";
import { toLine } from "./card";

type Line = LineData & { quantity: number };

export type CartNotice =
  | { lineId: string; kind: "price"; name: string; was: number; now: number }
  | { lineId: string; kind: "stock"; name: string; left: number }
  | { lineId: string; kind: "gone"; name: string };

/**
 * A cart can sit in a browser for weeks. This checks every line against the
 * catalog as it is now, updates what changed, and says what it changed.
 * A line that can no longer be bought stays visible until the buyer removes it.
 */
export function reconcileCart(lines: Line[], products: Product[]): { lines: Line[]; notices: CartNotice[] } {
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const notices: CartNotice[] = [];

  const next = lines.map((line) => {
    const product = bySlug.get(line.slug);
    const variant = product?.variants.find((v) => v.id === line.variantId);
    const offer = variant?.offers.find((o) => o.sellerSlug === line.sellerSlug);
    if (!product || !variant || !offer || offer.stock <= 0) {
      notices.push({ lineId: line.id, kind: "gone", name: line.name });
      return { ...line, stock: 0 };
    }

    const fresh = toLine(product, variant, offer);
    if (fresh.price !== line.price) {
      notices.push({ lineId: line.id, kind: "price", name: line.name, was: line.price, now: fresh.price });
    }
    let quantity = line.quantity;
    if (quantity > offer.stock) {
      quantity = offer.stock;
      notices.push({ lineId: line.id, kind: "stock", name: line.name, left: offer.stock });
    }
    return { ...fresh, quantity };
  });

  return { lines: next, notices };
}

/** Whether another seller would fill this same line for less, and by how much. */
export function cheaperOffer(line: Line, products: Product[]): { offer: Offer; saves: number } | undefined {
  const variant = products.find((p) => p.slug === line.slug)?.variants.find((v) => v.id === line.variantId);
  if (!variant) return undefined;
  const current = priceForQuantity(line, line.quantity) * line.quantity;
  const best = variant.offers
    .filter((o) => o.sellerSlug !== line.sellerSlug && o.stock >= line.quantity)
    .map((offer) => ({ offer, total: priceForQuantity(offer, line.quantity) * line.quantity }))
    .sort((a, b) => a.total - b.total)[0];
  if (!best || best.total >= current) return undefined;
  return { offer: best.offer, saves: Math.round((current - best.total) * 100) / 100 };
}
