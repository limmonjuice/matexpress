import { categories, categoryBySlug } from "./data/categories";
import { jobBySlug, jobs } from "./data/jobs";
import { products } from "./data/products";
import { reviewsFor } from "./data/reviews";
import { sellerBySlug, sellers } from "./data/sellers";
import { buildSearchIndex } from "./search";
import type { Product, SearchEntry } from "./types";

// The one way pages read the catalog. It is sample data today; moving it to the
// database means changing these functions, not the pages that call them.

const bySlug = new Map(products.map((p) => [p.slug, p]));

export async function listProducts(): Promise<Product[]> {
  return products;
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  return bySlug.get(slug);
}

export async function listCategories() {
  return categories;
}

export async function getCategory(slug: string) {
  return categoryBySlug(slug);
}

export async function listSellers() {
  return sellers;
}

export async function getSeller(slug: string) {
  return sellerBySlug(slug);
}

export async function listJobs() {
  return jobs;
}

export async function getJob(slug: string) {
  return jobBySlug(slug);
}

export async function getReviews(slug: string) {
  return reviewsFor(slug);
}

const searchIndex = buildSearchIndex(products);

/** The slim list the search page and, through /api/search-index, the header's search box run on. */
export async function getSearchIndex(): Promise<SearchEntry[]> {
  return searchIndex;
}
