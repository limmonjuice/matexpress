import { Suspense } from "react";
import type { Metadata } from "next";
import { CategoryBand } from "@/components/listing/category-band";
import { Listing } from "@/components/listing/listing";
import { ListingSkeleton } from "@/components/listing/listing-skeleton";
import { listProducts } from "@/lib/catalog";
import { listFacts } from "@/lib/catalog/listing";

export const metadata: Metadata = {
  title: "All products | MatExpress",
  description: "Every construction material on MatExpress, from every verified seller, with prices and delivery dates.",
};

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const facts = listFacts(await listProducts(), {});

  return (
    <>
      <CategoryBand
        title="All products"
        blurb="Everything from every seller, with the price and delivery date on each."
        image="/home/categories/cement-concrete.webp"
        field="#ece5dc"
        fieldInk="dark"
        crumbs={[{ label: "Home", href: "/" }, { label: "All products" }]}
        facts={facts}
      />
      <Suspense fallback={<ListingSkeleton />}>
        <Listing pathname="/products" scope={{}} rawParams={searchParams} />
      </Suspense>
    </>
  );
}
