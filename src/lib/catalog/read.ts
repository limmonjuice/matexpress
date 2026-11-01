import { asc, eq, getTableColumns, inArray } from "drizzle-orm";
import { db } from "@/db";
import { offers, products, reviews, sellers, variants } from "@/db/schema";
import { toProducts, toReview } from "./rows";
import type { Product, Review, Seller } from "./types";

// The catalog straight from the database, with nothing cached. Pages read it through index.ts.

/** Every product, or only these. One trip, however many it reads. */
export async function readProducts(slugs?: string[]): Promise<Product[]> {
  const [productRows, variantRows, offerRows] = await db.batch([
    db.select().from(products).where(slugs && inArray(products.slug, slugs)),
    db.select().from(variants).where(slugs && inArray(variants.productSlug, slugs)),
    db
      .select({ ...getTableColumns(offers), sellerName: sellers.name })
      .from(offers)
      .innerJoin(sellers, eq(sellers.slug, offers.sellerSlug))
      .where(slugs && inArray(offers.productSlug, slugs)),
  ]);
  return toProducts({ products: productRows, variants: variantRows, offers: offerRows });
}

export async function readSellers(): Promise<Seller[]> {
  return db.select().from(sellers).orderBy(asc(sellers.name));
}

export async function readReviews(productSlug: string): Promise<Review[]> {
  const rows = await db.select().from(reviews).where(eq(reviews.productSlug, productSlug)).orderBy(asc(reviews.position));
  return rows.map(toReview);
}
