import type { offers, products, reviews, variants } from "@/db/schema";
import { toCentavos, toPesos } from "@/lib/format";
import type { Offer, Product, Review, Variant } from "./types";

// The catalog as the database holds it, and back again. Pure, so the round trip can be tested on every sample product.

export type ProductRow = typeof products.$inferSelect;
export type VariantRow = typeof variants.$inferSelect;
export type OfferRow = typeof offers.$inferSelect;
export type ReviewRow = Omit<typeof reviews.$inferSelect, "id">;

/** An offer as it's read: joined to its seller, because almost everything that shows a price shows who's selling. */
export type OfferReadRow = OfferRow & { sellerName: string };

/** The catalog's types leave a missing value out, where the database holds a null. */
const ifSet = <K extends string, V>(key: K, value: V | null) => (value === null ? {} : { [key]: value }) as { [P in K]?: V };

export function toProductRows(product: Product, position: number): { product: ProductRow; variants: VariantRow[]; offers: OfferRow[] } {
  return {
    product: {
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      categorySlug: product.categorySlug,
      subcategory: product.subcategory,
      unit: product.unit,
      sizeLabel: product.sizeLabel ?? null,
      badge: product.badge ?? null,
      defaultVariantId: product.defaultVariantId ?? null,
      description: product.description,
      highlights: product.highlights,
      images: product.images,
      rating: product.rating ?? null,
      reviewCount: product.reviewCount ?? null,
      ratingBars: product.ratingBars ?? null,
      salesRank: product.salesRank,
      addedAt: product.addedAt,
      related: product.related ?? null,
      position,
    },
    variants: product.variants.map((variant, i) => ({
      productSlug: product.slug,
      id: variant.id,
      label: variant.label,
      spec: variant.spec,
      attributes: variant.attributes,
      measure: variant.measure ?? null,
      weightKg: variant.weightKg,
      minQty: variant.minQty ?? null,
      step: variant.step ?? null,
      quickQty: variant.quickQty ?? null,
      drawing: variant.drawing ?? null,
      position: i,
    })),
    offers: product.variants.flatMap((variant) =>
      variant.offers.map((offer, i) => ({
        productSlug: product.slug,
        variantId: variant.id,
        sellerSlug: offer.sellerSlug,
        priceCentavos: toCentavos(offer.price),
        listPriceCentavos: offer.listPrice === undefined ? null : toCentavos(offer.listPrice),
        stock: offer.stock,
        leadDays: offer.leadDays,
        tiers: offer.tiers?.map((tier) => ({ from: tier.from, priceCentavos: toCentavos(tier.price) })) ?? null,
        position: i,
      })),
    ),
  };
}

const toOffer = (row: OfferReadRow): Offer => ({
  sellerSlug: row.sellerSlug,
  sellerName: row.sellerName,
  price: toPesos(row.priceCentavos),
  ...ifSet("listPrice", row.listPriceCentavos === null ? null : toPesos(row.listPriceCentavos)),
  stock: row.stock,
  leadDays: row.leadDays,
  ...ifSet("tiers", row.tiers && row.tiers.map((tier) => ({ from: tier.from, price: toPesos(tier.priceCentavos) }))),
});

function groupBy<T>(rows: T[], key: (row: T) => string) {
  const groups = new Map<string, T[]>();
  for (const row of rows) groups.set(key(row), [...(groups.get(key(row)) ?? []), row]);
  return groups;
}

const byPosition = (a: { position: number }, b: { position: number }) => a.position - b.position;

export function toProducts(rows: { products: ProductRow[]; variants: VariantRow[]; offers: OfferReadRow[] }): Product[] {
  const offersOf = groupBy(rows.offers, (row) => `${row.productSlug}:${row.variantId}`);
  const variantsOf = groupBy(rows.variants, (row) => row.productSlug);

  return [...rows.products].sort(byPosition).map((row) => ({
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    categorySlug: row.categorySlug,
    subcategory: row.subcategory,
    unit: row.unit,
    ...ifSet("sizeLabel", row.sizeLabel),
    ...ifSet("defaultVariantId", row.defaultVariantId),
    ...ifSet("badge", row.badge),
    description: row.description,
    highlights: row.highlights,
    images: row.images,
    ...ifSet("rating", row.rating),
    ...ifSet("reviewCount", row.reviewCount),
    ...ifSet("ratingBars", row.ratingBars),
    salesRank: row.salesRank,
    addedAt: row.addedAt,
    ...ifSet("related", row.related),
    variants: (variantsOf.get(row.slug) ?? []).sort(byPosition).map(
      (variant): Variant => ({
        id: variant.id,
        label: variant.label,
        spec: variant.spec,
        attributes: variant.attributes,
        ...ifSet("measure", variant.measure),
        weightKg: variant.weightKg,
        ...ifSet("minQty", variant.minQty),
        ...ifSet("step", variant.step),
        ...ifSet("quickQty", variant.quickQty),
        ...ifSet("drawing", variant.drawing),
        offers: (offersOf.get(`${row.slug}:${variant.id}`) ?? []).sort(byPosition).map(toOffer),
      }),
    ),
  }));
}

export const toReviewRow = (productSlug: string, review: Review, position: number): ReviewRow => ({
  productSlug,
  author: review.author,
  role: review.role,
  rating: review.rating,
  dateLabel: review.date,
  title: review.title,
  body: review.body,
  sellerName: review.seller ?? null,
  replyFrom: review.reply?.from ?? null,
  replyBody: review.reply?.body ?? null,
  position,
});

export const toReview = (row: ReviewRow): Review => ({
  author: row.author,
  role: row.role,
  rating: row.rating,
  date: row.dateLabel,
  title: row.title,
  body: row.body,
  ...ifSet("seller", row.sellerName),
  ...(row.replyFrom !== null && row.replyBody !== null ? { reply: { from: row.replyFrom, body: row.replyBody } } : {}),
});
