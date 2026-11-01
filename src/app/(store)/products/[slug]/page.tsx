import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomeMotion } from "@/components/home/home-motion";
import { ProductCard } from "@/components/home/product-card";
import { ProductRow } from "@/components/home/product-row";
import { Breadcrumbs } from "@/components/listing/breadcrumbs";
import { ProductView } from "@/components/product/product-view";
import { Reviews } from "@/components/product/reviews";
import "@/components/product/product.css";
import { getCategory, getProduct, getReviews, listProducts, listSellers } from "@/lib/catalog";
import { sellerDirectory, toCard } from "@/lib/catalog/card";
import { productSchema } from "@/lib/catalog/schema";
import { subcategoryHref } from "@/lib/catalog/data/categories";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await listProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return { title: "Not found | MatExpress" };
  return {
    title: `${product.name} | MatExpress`,
    description: product.description,
    openGraph: { images: [product.images[0].src] },
  };
}

function ProductSkeleton() {
  return (
    <div className="hm-frame hm-pd hm-pd-skeleton" aria-hidden="true">
      <i />
      <i />
    </div>
  );
}

export default function ProductPage(props: Props) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductContent {...props} />
    </Suspense>
  );
}

async function ProductContent({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const [category, reviews, products, sellers] = await Promise.all([getCategory(product.categorySlug), getReviews(slug), listProducts(), listSellers()]);
  const related = (product.related ?? []).flatMap((relatedSlug) => {
    const found = products.find((p) => p.slug === relatedSlug);
    return found ? [toCard(found)] : [];
  });
  const sellingThis = new Set(product.variants.flatMap((variant) => variant.offers.map((offer) => offer.sellerSlug)));

  // A spec table for each size, with labels only the server's category data knows.
  const specs = product.variants.map((variant) => ({
    Brand: product.brand,
    ...Object.fromEntries(
      (category?.filters ?? [])
        .filter((filter) => variant.attributes[filter.key])
        .map((filter) => [filter.label, variant.attributes[filter.key]]),
    ),
    Description: variant.spec,
    "Sold by": product.unit === "m³" ? "The cubic metre" : `The ${product.unit}`,
    ...(variant.minQty ? { "Minimum order": `${variant.minQty.toLocaleString("en-PH")} ${product.unit}` } : {}),
  }));

  return (
    <>
      <div className="hm-frame hm-pd">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            ...(category ? [{ label: category.name, href: `/categories/${category.slug}` }] : []),
            // "Deformed rebar / Deformed Rebar" would say nothing.
            ...(category && product.subcategory.toLowerCase() !== product.name.toLowerCase() ? [{ label: product.subcategory, href: subcategoryHref(category.slug, product.subcategory) }] : []),
            { label: product.name },
          ]}
        />
        <ProductView product={product} sellers={sellerDirectory(sellers.filter((seller) => sellingThis.has(seller.slug)))} specsFor={specs}>
          <section className="hm-about" aria-labelledby="hm-about-title">
            <h2 id="hm-about-title" className="hm-pd-title">
              About this material
            </h2>
            <p>{product.description}</p>
            <ul>
              {product.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          </section>
        </ProductView>

        <Reviews product={product} reviews={reviews} />
      </div>

      {related.length > 0 && (
        <section className="hm-frame hm-section">
          <ProductRow title="The same job usually needs">
            {related.map((card) => (
              <li key={card.slug}>
                <ProductCard product={card} />
              </li>
            ))}
          </ProductRow>
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema(product)).replace(/</g, "\\u003c") }} />
      <HomeMotion />
    </>
  );
}
