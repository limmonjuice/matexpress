import { Suspense } from "react";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/listing/breadcrumbs";
import { ImportSharedList, SavedGrid } from "@/components/listing/saved-grid";
import "@/components/listing/listing.css";
import { listProducts } from "@/lib/catalog";
import { toCard } from "@/lib/catalog/card";

export const metadata: Metadata = {
  title: "Saved items | MatExpress",
  robots: { index: false },
};

type RawParams = Record<string, string | string[] | undefined>;

async function SharedList({ searchParams }: { searchParams: Promise<RawParams> }) {
  const { items } = await searchParams;
  if (typeof items !== "string") return null;
  const known = new Set((await listProducts()).map((p) => p.slug));
  return <ImportSharedList slugs={items.split(",").filter((slug) => known.has(slug))} />;
}

export default async function SavedPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const cards = (await listProducts()).map((product) => toCard(product));

  return (
    <>
      <section className="hm-frame hm-hub-head">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Saved items" }]} />
        <h1>Saved items</h1>
        <p>Your shortlist for the site. Send the link to whoever signs off on the order.</p>
      </section>
      <div className="hm-frame">
        <Suspense fallback={null}>
          <SharedList searchParams={searchParams} />
        </Suspense>
        <SavedGrid cards={cards} />
      </div>
    </>
  );
}
