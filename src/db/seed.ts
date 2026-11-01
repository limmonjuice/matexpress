import { isDeepStrictEqual } from "node:util";
import { config } from "dotenv";
import { toProductRows, toReview, toReviewRow } from "../lib/catalog/rows";
import { products as sampleProducts } from "./sample/products";
import { sampleReviews } from "./sample/reviews";
import { sellers as sampleSellers } from "./sample/sellers";

config({ path: [".env.local", ".env"], quiet: true });

/**
 * Loads the sample catalog, then reads it back and refuses to call it done unless it's identical.
 * `npm run db:seed` only fills an empty catalog. `npm run db:seed -- --reset` replaces whatever is
 * there, prices and stock included, so it must never run once real sellers are on the site.
 */
async function main() {
  // Import after env is loaded: the db module reads DATABASE_URL at import time.
  const { db } = await import("./index");
  const { offers, products, reviews, sellers, variants } = await import("./schema");
  const { readProducts, readSellers } = await import("../lib/catalog/read");
  const { asc, count } = await import("drizzle-orm");

  const [{ existing }] = await db.select({ existing: count() }).from(products);
  if (existing > 0 && !process.argv.includes("--reset")) {
    console.log(`The catalog already has ${existing} products, so nothing changed. To replace them with the sample: npm run db:seed -- --reset`);
    return;
  }

  const rows = sampleProducts.map(toProductRows);
  const productRows = rows.map((row) => row.product);
  const variantRows = rows.flatMap((row) => row.variants);
  const offerRows = rows.flatMap((row) => row.offers);
  const reviewRows = Object.entries(sampleReviews).flatMap(([slug, list]) => list.map((review, i) => toReviewRow(slug, review, i)));

  // One batch is one transaction: the catalog is replaced whole, or not at all.
  await db.batch([
    db.delete(reviews),
    db.delete(offers),
    db.delete(variants),
    db.delete(products),
    db.delete(sellers),
    db.insert(sellers).values(sampleSellers),
    db.insert(products).values(productRows),
    db.insert(variants).values(variantRows),
    db.insert(offers).values(offerRows),
    db.insert(reviews).values(reviewRows),
  ]);
  console.log(`Loaded ${productRows.length} products, ${variantRows.length} sizes, ${offerRows.length} offers, ${sampleSellers.length} sellers and ${reviewRows.length} reviews.`);

  const backProducts = await readProducts();
  const different = sampleProducts.filter((product, i) => !isDeepStrictEqual(backProducts[i], product));
  if (different.length || backProducts.length !== sampleProducts.length) throw new Error(`Read back different from the sample: ${different.map((p) => p.slug).join(", ") || "the count"}`);

  const bySlug = (a: { slug: string }, b: { slug: string }) => a.slug.localeCompare(b.slug);
  if (!isDeepStrictEqual((await readSellers()).sort(bySlug), [...sampleSellers].sort(bySlug))) throw new Error("Sellers read back different from the sample.");

  const backReviews = await db.select().from(reviews).orderBy(asc(reviews.position));
  for (const [slug, list] of Object.entries(sampleReviews)) {
    const back = backReviews.filter((row) => row.productSlug === slug).map(toReview);
    if (!isDeepStrictEqual(back, list)) throw new Error(`Reviews for ${slug} read back different from the sample.`);
  }
  console.log("Read it all back: identical to the sample.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
