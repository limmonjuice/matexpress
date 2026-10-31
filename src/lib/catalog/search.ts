import { categories, products } from "./home-content";
import type { Product } from "./types";

const categoryName = new Map(categories.map((c) => [c.slug, c.name.toLowerCase()]));

/** Products matching every word of the query, by name first, then spec and category. */
export function searchProducts(query: string, limit = 6): Product[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  return products
    .map((product) => {
      const name = product.name.toLowerCase();
      const haystack = `${name} ${product.spec.toLowerCase()} ${categoryName.get(product.categorySlug) ?? ""}`;
      const matches = words.every((word) => haystack.includes(word));
      const inName = words.every((word) => name.includes(word));
      return { product, matches, inName };
    })
    .filter((r) => r.matches)
    .sort((a, b) => Number(b.inName) - Number(a.inName))
    .slice(0, limit)
    .map((r) => r.product);
}
