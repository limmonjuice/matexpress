import type { Product } from "./types";

/** Product data for search engines: the price range across every seller and size. */
export function productSchema(product: Product) {
  const offers = product.variants.flatMap((v) => v.offers);
  const prices = offers.map((o) => o.price);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((i) => i.src),
    brand: { "@type": "Brand", name: product.brand },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "PHP",
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: offers.length,
      availability: offers.some((o) => o.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(product.rating !== undefined
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount } }
      : {}),
  };
}
