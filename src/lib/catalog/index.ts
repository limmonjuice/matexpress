import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { categories, categoryBySlug } from "./data/categories";
import { jobBySlug, jobs } from "./data/jobs";
import { readProducts, readReviews, readSellers } from "./read";
import { buildSearchIndex } from "./search";
import type { Product, SearchEntry, Seller } from "./types";

// The one way pages read the catalog. Products, sellers and reviews come from the database and are cached,
// so a visitor gets a page that's already built rather than a query. docs/rendering-and-data.md has the reasoning.
// Categories and job guides are still in code: they're the site's navigation, and they don't change while it runs.

/** Marks everything read from the database here as out of date. */
export const CATALOG_TAG = "catalog";

export async function listProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  return readProducts();
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  return (await listProducts()).find((product) => product.slug === slug);
}

/** The real prices and stock of these products, never cached. For checkout, where an old number would cost money. */
export async function liveProducts(slugs: string[]): Promise<Product[]> {
  return readProducts([...new Set(slugs)]);
}

export async function listCategories() {
  return categories;
}

export async function getCategory(slug: string) {
  return categoryBySlug(slug);
}

export async function listSellers(): Promise<Seller[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  return readSellers();
}

export async function getSeller(slug: string): Promise<Seller | undefined> {
  return (await listSellers()).find((seller) => seller.slug === slug);
}

export async function listJobs() {
  return jobs;
}

export async function getJob(slug: string) {
  return jobBySlug(slug);
}

export async function getReviews(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  return readReviews(slug);
}

/** The slim list the search page and, through /api/search-index, the header's search box run on. */
export async function getSearchIndex(): Promise<SearchEntry[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  return buildSearchIndex(await listProducts());
}
