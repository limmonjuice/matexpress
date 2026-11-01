import { categoryBySlug } from "@/lib/catalog/data/categories";
import { productImage } from "@/lib/catalog/card";
import type { Product } from "@/lib/catalog/types";
import { deliveryFee } from "@/lib/delivery";
import { toCentavos, toPesos } from "@/lib/format";
import { clampQuantity, lineTotal, priceForQuantity } from "@/lib/pricing";
import type { CheckoutInput } from "./rules";

export type PricedLine = {
  productSlug: string;
  variantId: string;
  variantLabel?: string;
  sellerSlug: string;
  sellerName: string;
  name: string;
  unit: string;
  image: string;
  categorySlug: string;
  unitPriceCentavos: number;
  quantity: number;
  lineTotalCentavos: number;
  leadDays: number;
  weightKg: number;
  /** The least this seller can sell of this size: with less than this left, they've sold out. */
  minOrder: number;
};

export type OrderProblem =
  | { kind: "gone"; slug: string; name?: string }
  | { kind: "price"; slug: string; name: string; was: number; now: number }
  | { kind: "quantity"; slug: string; name: string; quantity: number; note: string };

export type PricedOrder =
  | { ok: true; lines: PricedLine[]; subtotalCentavos: number; deliveryFeeCentavos: number; totalCentavos: number; weightKg: number }
  | { ok: false; problems: OrderProblem[] };

/**
 * The server's own sum. Browser prices are only compared, never used: a changed
 * price comes back as a problem to show the buyer, and nothing is charged.
 */
export function priceOrder(lines: CheckoutInput["lines"], products: Product[], area: string): PricedOrder {
  if (lines.length === 0) return { ok: false, problems: [{ kind: "gone", slug: "" }] };

  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const problems: OrderProblem[] = [];
  const priced: PricedLine[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const product = bySlug.get(line.slug);
    const variant = product?.variants.find((v) => v.id === line.variantId);
    const offer = variant?.offers.find((o) => o.sellerSlug === line.sellerSlug);
    const minOrder = variant?.minQty ?? variant?.step ?? 1;
    // A seller holding less than their own minimum can't fill any order.
    if (!product || !variant || !offer || offer.stock < minOrder) {
      problems.push({ kind: "gone", slug: line.slug, name: product?.name });
      continue;
    }

    // One seller's stock can't be spent twice by listing it twice.
    const id = `${line.slug}:${line.variantId}:${line.sellerSlug}`;
    if (seen.has(id)) {
      problems.push({ kind: "quantity", slug: line.slug, name: product.name, quantity: line.quantity, note: "It's in the order twice." });
      continue;
    }
    seen.add(id);

    const { quantity, note } = clampQuantity(line.quantity, { minQty: variant.minQty, step: variant.step, stock: offer.stock });
    if (quantity !== line.quantity) {
      problems.push({ kind: "quantity", slug: line.slug, name: product.name, quantity, note: note ?? "The quantity had to change." });
      continue;
    }

    const unitPrice = priceForQuantity(offer, quantity);
    if (toCentavos(unitPrice) !== toCentavos(line.unitPrice)) {
      problems.push({ kind: "price", slug: line.slug, name: product.name, was: line.unitPrice, now: unitPrice });
      continue;
    }

    const unitPriceCentavos = toCentavos(unitPrice);
    priced.push({
      productSlug: product.slug,
      variantId: variant.id,
      ...(product.variants.length > 1 ? { variantLabel: variant.label } : {}),
      sellerSlug: offer.sellerSlug,
      sellerName: offer.sellerName,
      name: product.name,
      unit: product.unit,
      image: productImage(product),
      categorySlug: categoryBySlug(product.categorySlug)?.slug ?? product.categorySlug,
      unitPriceCentavos,
      quantity,
      // The same sum the cart shows, so what's on screen is what's charged, to the centavo.
      lineTotalCentavos: toCentavos(lineTotal(unitPrice, quantity)),
      leadDays: offer.leadDays,
      weightKg: variant.weightKg * quantity,
      minOrder,
    });
  }

  if (problems.length) return { ok: false, problems };

  const subtotalCentavos = priced.reduce((sum, l) => sum + l.lineTotalCentavos, 0);
  const deliveryFeeCentavos = toCentavos(deliveryFee(area, toPesos(subtotalCentavos)));
  return {
    ok: true,
    lines: priced,
    subtotalCentavos,
    deliveryFeeCentavos,
    totalCentavos: subtotalCentavos + deliveryFeeCentavos,
    weightKg: priced.reduce((sum, l) => sum + l.weightKg, 0),
  };
}
