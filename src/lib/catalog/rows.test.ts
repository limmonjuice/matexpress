import { describe, expect, test } from "vitest";
import { products } from "@/db/sample/products";
import { sampleReviews } from "@/db/sample/reviews";
import { sellerBySlug } from "@/db/sample/sellers";
import { toProductRows, toProducts, toReview, toReviewRow, type OfferRow, type ProductRow, type VariantRow } from "./rows";

const rowsFor = (list = products) => {
  const flat = list.map(toProductRows);
  return {
    products: flat.map((rows) => rows.product),
    variants: flat.flatMap((rows) => rows.variants),
    offers: flat.flatMap((rows) => rows.offers).map((offer) => ({ ...offer, sellerName: sellerBySlug(offer.sellerSlug)!.name })),
  };
};

const reversed = <T>(rows: T[]) => [...rows].reverse();

describe("the catalog's rows", () => {
  test("a product read back from rows equals the sample product", () => {
    expect(toProducts(rowsFor())).toStrictEqual(products);
  });

  test("products, sizes and offers keep their order, whatever order the database returns them in", () => {
    const rows = rowsFor();
    expect(toProducts({ products: reversed(rows.products), variants: reversed(rows.variants), offers: reversed(rows.offers) })).toStrictEqual(products);
  });

  test("money is stored as whole centavos", () => {
    const { offers } = toProductRows(products.find((p) => p.slug === "hollow-block")!, 0);
    const money = offers.flatMap((offer) => [offer.priceCentavos, offer.listPriceCentavos ?? 0, ...(offer.tiers ?? []).map((tier) => tier.priceCentavos)]);
    expect(money.every(Number.isInteger)).toBe(true);
  });

  test("a price with centavos comes back exact", () => {
    const [product] = products;
    const [variant] = product.variants;
    const priced = { ...product, variants: [{ ...variant, offers: [{ ...variant.offers[0], price: 18.35, listPrice: 19.1, tiers: [{ from: 10, price: 16.55 }] }] }] };
    const [back] = toProducts(rowsFor([priced]));
    expect(back.variants[0].offers[0]).toMatchObject({ price: 18.35, listPrice: 19.1, tiers: [{ from: 10, price: 16.55 }] });
  });

  test("half units of stock survive", () => {
    const [product] = products;
    const [variant] = product.variants;
    const halves = { ...product, variants: [{ ...variant, offers: [{ ...variant.offers[0], stock: 12.5 }] }] };
    expect(toProducts(rowsFor([halves]))[0].variants[0].offers[0].stock).toBe(12.5);
  });

  test("what a product doesn't have comes back missing, not null", () => {
    const row: ProductRow = { ...toProductRows(products[0], 0).product, badge: null, rating: null, reviewCount: null, ratingBars: null, related: null, sizeLabel: null, defaultVariantId: null };
    const variant: VariantRow = { ...toProductRows(products[0], 0).variants[0], measure: null, minQty: null, step: null, quickQty: null, drawing: null };
    const offer: OfferRow = { ...toProductRows(products[0], 0).offers[0], listPriceCentavos: null, tiers: null };
    const [back] = toProducts({ products: [row], variants: [variant], offers: [{ ...offer, sellerName: "A seller" }] });

    for (const key of ["badge", "rating", "reviewCount", "ratingBars", "related", "sizeLabel", "defaultVariantId"]) expect(back).not.toHaveProperty(key);
    for (const key of ["measure", "minQty", "step", "quickQty", "drawing"]) expect(back.variants[0]).not.toHaveProperty(key);
    for (const key of ["listPrice", "tiers"]) expect(back.variants[0].offers[0]).not.toHaveProperty(key);
  });

  test("a size's minimum of zero isn't mistaken for no minimum", () => {
    const [product] = products;
    const [variant] = product.variants;
    const [back] = toProducts(rowsFor([{ ...product, variants: [{ ...variant, minQty: 0 }] }]));
    expect(back.variants[0].minQty).toBe(0);
  });

  test("a product whose rows are incomplete still reads, with what it has", () => {
    const rows = rowsFor([products[0]]);
    expect(toProducts({ ...rows, offers: [] })[0].variants[0].offers).toEqual([]);
    expect(toProducts({ ...rows, variants: [], offers: [] })[0].variants).toEqual([]);
  });

  test("a review and its reply come back as written", () => {
    for (const [slug, reviews] of Object.entries(sampleReviews)) {
      reviews.forEach((review, i) => expect(toReview(toReviewRow(slug, review, i))).toStrictEqual(review));
    }
    expect(Object.values(sampleReviews).flat().some((review) => review.reply)).toBe(true);
  });
});
