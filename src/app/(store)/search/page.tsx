import { Suspense } from "react";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/listing/breadcrumbs";
import { Listing } from "@/components/listing/listing";
import { ListingSkeleton } from "@/components/listing/listing-skeleton";
import { NoResults } from "@/components/listing/no-results";
import "@/components/listing/listing.css";
import { getSearchIndex, listProducts } from "@/lib/catalog";
import { homeLists } from "@/lib/catalog/home-lists";
import { alternativeQueries, searchProducts } from "@/lib/catalog/search";

export const metadata: Metadata = {
  title: "Search | MatExpress",
  robots: { index: false },
};

type RawParams = Record<string, string | string[] | undefined>;

export default function SearchPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  return (
    <Suspense
      fallback={
        <>
          <section className="hm-frame hm-hub-head">
            <h1>Search</h1>
          </section>
          <ListingSkeleton />
        </>
      }
    >
      <SearchResults searchParams={searchParams} />
    </Suspense>
  );
}

async function SearchResults({ searchParams }: { searchParams: Promise<RawParams> }) {
  // Before the address, as in Listing: these get built into the page, so a search costs no database trip.
  const [index, products] = await Promise.all([getSearchIndex(), listProducts()]);
  const raw = await searchParams;
  const q = typeof raw.q === "string" ? raw.q.trim() : "";
  const result = searchProducts(index, q, index.length);

  if (result.items.length === 0) {
    return <NoResults query={q} alternatives={alternativeQueries(index, q)} sizeBySlug={result.sizeBySlug} bestSellers={homeLists(products).bestSellers} />;
  }

  return (
    <>
      <section className="hm-frame hm-hub-head hm-hub-head--search">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Search" }]} />
        <h1>Results for “{q}”</h1>
        {result.meaning && (
          <p>
            Showing {result.meaning.shown}, which is what most sellers call {result.meaning.typed}.
          </p>
        )}
        {result.fuzzy && <p>No exact matches, so these are the closest.</p>}
      </section>
      <Listing
        pathname="/search"
        scope={{ slugs: result.items.map((item) => item.slug), preferSizes: result.sizeBySlug }}
        rawParams={raw}
        defaultSort="relevance"
        extraSorts={["relevance"]}
      />
    </>
  );
}
