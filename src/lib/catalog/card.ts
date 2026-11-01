import { unitPriceLabel } from "@/lib/pricing";
import type { CardData, LineData, Offer, Product, Seller, SellerDirectory, Variant } from "./types";

export function defaultVariant(product: Product): Variant {
  return product.variants.find((v) => v.id === product.defaultVariantId) ?? product.variants[0];
}

/** Sellers as a screen in the browser needs them: only what it shows, by slug. */
export function sellerDirectory(sellers: Seller[]): SellerDirectory {
  return Object.fromEntries(sellers.map(({ slug, name, city, rating, tint }) => [slug, { name, city, rating, tint }]));
}

/** The offer a card leads with: the cheapest in stock, sooner breaking a tie. Falls back to the cheapest of all. */
export function bestOffer(offers: Offer[]): Offer {
  const rank = (a: Offer, b: Offer) => a.price - b.price || a.leadDays - b.leadDays;
  const inStock = offers.filter((o) => o.stock > 0);
  return [...(inStock.length ? inStock : offers)].sort(rank)[0];
}

export function productImage(product: Product) {
  return product.images.find((i) => i.kind === "cutout")?.src ?? product.images[0].src;
}

export function productHref(product: Product, variant?: Variant) {
  if (!variant || variant.id === defaultVariant(product).id) return `/products/${product.slug}`;
  return `/products/${product.slug}?size=${variant.id}`;
}

export function toLine(product: Product, variant: Variant, offer: Offer): LineData {
  return {
    id: `${product.slug}:${variant.id}:${offer.sellerSlug}`,
    slug: product.slug,
    variantId: variant.id,
    // A product with one size has nothing to tell apart.
    ...(product.variants.length > 1 ? { variantLabel: variant.label } : {}),
    sellerSlug: offer.sellerSlug,
    seller: offer.sellerName,
    name: product.name,
    unit: product.unit,
    categorySlug: product.categorySlug,
    price: offer.price,
    ...(offer.tiers ? { tiers: offer.tiers } : {}),
    ...(variant.minQty ? { minQty: variant.minQty } : {}),
    ...(variant.step ? { step: variant.step } : {}),
    stock: offer.stock,
    leadDays: offer.leadDays,
    weightKg: variant.weightKg,
    image: productImage(product),
  };
}

/** One product at one size from one seller, as a card shows it. By default its usual size and best offer. */
export function toCard(product: Product, options: { variantId?: string; sellerSlug?: string } = {}): CardData {
  const variant = product.variants.find((v) => v.id === options.variantId) ?? defaultVariant(product);
  const offer = variant.offers.find((o) => o.sellerSlug === options.sellerSlug) ?? bestOffer(variant.offers);
  const offers = [...variant.offers].sort((a, b) => a.price - b.price).slice(0, 3);

  return {
    slug: product.slug,
    href: productHref(product, variant),
    name: product.name,
    spec: variant.spec,
    unit: product.unit,
    image: productImage(product),
    price: offer.price,
    ...(offer.listPrice ? { listPrice: offer.listPrice } : {}),
    ...(variant.measure ? { unitPrice: unitPriceLabel(offer.price, variant.measure) } : {}),
    sizeCount: product.variants.length,
    sellerCount: variant.offers.length,
    seller: { slug: offer.sellerSlug, name: offer.sellerName },
    ...(product.rating !== undefined ? { rating: product.rating, reviewCount: product.reviewCount } : {}),
    ...(product.badge ? { badge: product.badge } : {}),
    categorySlug: product.categorySlug,
    leadDays: offer.leadDays,
    inStock: offer.stock > 0,
    minQty: variant.minQty ?? variant.step ?? 1,
    offers: offers.map((o) => ({ sellerSlug: o.sellerSlug, seller: o.sellerName, price: o.price, leadDays: o.leadDays })),
    line: toLine(product, variant, offer),
  };
}
