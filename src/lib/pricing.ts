import { formatPeso } from "./format";
import type { Measure, Offer, PriceTier } from "./catalog/types";

export type PriceRules = { price: number; tiers?: PriceTier[] };
export type QuantityRules = { minQty?: number; step?: number; stock?: number };

const round2 = (value: number) => Math.round(value * 100) / 100;

/** The best price a quantity reaches: sellers drop their price per unit as the order grows. */
export function priceForQuantity(rules: PriceRules, quantity: number) {
  return (rules.tiers ?? []).reduce((best, tier) => (quantity >= tier.from && tier.price < best ? tier.price : best), rules.price);
}

export const lineTotal = (price: number, quantity: number) => round2(price * quantity);

/** Turns whatever was typed into a quantity this seller can fill, and says why when it had to change it. */
export function clampQuantity(raw: string | number, rules: QuantityRules): { quantity: number; note?: string } {
  const min = rules.minQty ?? rules.step ?? 1;
  const step = rules.step ?? 1;
  const parsed = typeof raw === "number" ? raw : Number(raw.replace(/,/g, "").trim());
  const hasValue = typeof raw === "number" || raw.trim() !== "";

  if (!hasValue || !Number.isFinite(parsed) || parsed <= 0) {
    return { quantity: rules.stock !== undefined ? Math.min(min, rules.stock) : min };
  }

  const snapped = round2(Math.round(parsed / step) * step);
  if (snapped < min) return { quantity: min, note: `The minimum order is ${min}.` };
  if (rules.stock !== undefined && snapped > rules.stock) return { quantity: rules.stock, note: `Only ${rules.stock.toLocaleString("en-PH")} left from this seller.` };
  if (snapped !== parsed) return { quantity: snapped, note: step === 1 ? "Whole units only." : `Sold in steps of ${step}.` };
  return { quantity: snapped };
}

/** "₱21.67/m" for a ₱3,250 box of 150 m. */
export function unitPriceLabel(price: number, measure?: Measure) {
  if (!measure) return undefined;
  return `${formatPeso(round2(price / measure.amount))}/${measure.per}`;
}

export type RankedOffer = {
  offer: Offer;
  unitPrice: number;
  total: number;
  /** This seller has enough stock for the whole quantity. */
  canFill: boolean;
};

/**
 * Sellers for one quantity, best first. Prices drop at different quantities, so
 * the cheapest seller at 10 bags is not always the cheapest at 200.
 */
export function rankOffers(offers: Offer[], quantity: number): RankedOffer[] {
  return offers
    .map((offer) => {
      const unitPrice = priceForQuantity(offer, quantity);
      return { offer, unitPrice, total: lineTotal(unitPrice, quantity), canFill: offer.stock >= quantity };
    })
    .sort((a, b) => Number(b.canFill) - Number(a.canFill) || a.total - b.total || a.offer.leadDays - b.offer.leadDays);
}

/** Fills a quantity no single seller holds, cheapest stock first. Undefined if every seller together falls short. */
export function splitOrder(offers: Offer[], quantity: number): { offer: Offer; quantity: number }[] | undefined {
  const inStock = offers.filter((o) => o.stock > 0);
  if (inStock.some((o) => o.stock >= quantity)) return undefined;
  if (inStock.reduce((sum, o) => sum + o.stock, 0) < quantity) return undefined;

  const byPrice = [...inStock].sort((a, b) => priceForQuantity(a, a.stock) - priceForQuantity(b, b.stock));
  const plan: { offer: Offer; quantity: number }[] = [];
  let left = quantity;
  for (const offer of byPrice) {
    if (left <= 0) break;
    const take = Math.min(offer.stock, left);
    plan.push({ offer, quantity: take });
    left -= take;
  }
  return plan;
}
