import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

// The settings the test servers run on. GitHub passes them in directly; locally they're in .env.local.
config({ path: [".env.local"], quiet: true });

export const sql = neon(process.env.DATABASE_URL!);

export const authSecret = () => process.env.BETTER_AUTH_SECRET!;

type Line = { slug: string; variantId: string; sellerSlug: string };

export async function stockOf({ slug, variantId, sellerSlug }: Line) {
  const [row] = await sql`select stock from offers where product_slug = ${slug} and variant_id = ${variantId} and seller_slug = ${sellerSlug}`;
  return Number(row.stock);
}

export async function setStock({ slug, variantId, sellerSlug }: Line, stock: number) {
  await sql`update offers set stock = ${stock} where product_slug = ${slug} and variant_id = ${variantId} and seller_slug = ${sellerSlug}`;
}
