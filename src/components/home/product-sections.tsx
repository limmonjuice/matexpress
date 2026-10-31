import { bestSellers, newArrivals } from "@/lib/catalog/home-lists";
import { BestSellerCard } from "./best-seller-card";
import { ProductCard } from "./product-card";
import { ProductRow } from "./product-row";
import { SectionHeading } from "./section-heading";

export function ProductSections() {
  return (
    <>
      <section className="hm-frame hm-section">
        <ProductRow title="New arrivals" viewAllHref="/products?sort=new">
          {newArrivals.map((product) => (
            <li key={product.slug}>
              {/* "New" on every card in a section already called New arrivals says nothing. */}
              <ProductCard product={product} hideBadge="New" />
            </li>
          ))}
        </ProductRow>
      </section>

      <section className="hm-frame hm-section">
        <SectionHeading title="Best sellers" viewAllHref="/products" />
        <p className="hm-section-note">The same material from several sellers, so you can see who has it cheapest and soonest.</p>
        <div className="hm-best-grid" data-reveal>
          {bestSellers.map((product) => (
            <BestSellerCard key={product.slug} product={product} />
          ))}
        </div>
      </section>
    </>
  );
}
