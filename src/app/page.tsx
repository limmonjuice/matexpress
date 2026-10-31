import { CategoryGrid } from "@/components/home/category-grid";
import { Hero } from "@/components/home/hero";
import { HomeMotion } from "@/components/home/home-motion";
import { ProductSections } from "@/components/home/product-sections";
import { PromoPanels } from "@/components/home/promo-panels";
import { ServiceStrip } from "@/components/home/service-strip";
import { StoreShell } from "@/components/home/store-shell";
import { TrustStrip } from "@/components/home/trust-strip";

export default function HomePage() {
  return (
    <StoreShell>
      <Hero />
      <ServiceStrip />
      <CategoryGrid />
      <ProductSections />
      <PromoPanels />
      <TrustStrip />
      <HomeMotion />
    </StoreShell>
  );
}
