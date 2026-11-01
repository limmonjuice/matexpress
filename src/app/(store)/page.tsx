import { CategoryGrid } from "@/components/home/category-grid";
import { Hero } from "@/components/home/hero";
import { HomeMotion } from "@/components/home/home-motion";
import { ProductSections } from "@/components/home/product-sections";
import { PromoPanels } from "@/components/home/promo-panels";
import { ServiceStrip } from "@/components/home/service-strip";
import { TrustStrip } from "@/components/home/trust-strip";
import { listProducts } from "@/lib/catalog";
import { homeLists } from "@/lib/catalog/home-lists";

export default async function HomePage() {
  const { heroProducts, newArrivals, bestSellers } = homeLists(await listProducts());

  return (
    <>
      <Hero products={heroProducts} />
      <ServiceStrip />
      <CategoryGrid />
      <ProductSections newArrivals={newArrivals} bestSellers={bestSellers} />
      <PromoPanels />
      <TrustStrip />
      <HomeMotion />
    </>
  );
}
