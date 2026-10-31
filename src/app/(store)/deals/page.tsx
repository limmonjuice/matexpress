import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { Countdown } from "@/components/home/countdown";
import { Breadcrumbs } from "@/components/listing/breadcrumbs";
import { Listing } from "@/components/listing/listing";
import { ListingSkeleton } from "@/components/listing/listing-skeleton";
import "@/components/listing/listing.css";
import { flashDeal } from "@/lib/catalog/home-content";

export const metadata: Metadata = {
  title: "Deals | MatExpress",
  description: "Materials on sale from verified sellers, with a fixed end date on every deal.",
};

export default function DealsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <>
      <section className="hm-frame hm-band-wrap">
        <div className="hm-promo hm-promo--deal hm-deals-hero">
          <Image className="hm-promo-cut" src={flashDeal.image} alt="" width={900} height={900} sizes="(max-width: 699px) 60vw, 420px" preload />
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Deals" }]} />
          <h1 className="hm-promo-title">{flashDeal.title}</h1>
          <p>{flashDeal.blurb} Everything on sale right now is below.</p>
          <Countdown endsAt={flashDeal.endsAt} />
        </div>
      </section>
      <Suspense fallback={<ListingSkeleton />}>
        <Listing pathname="/deals" scope={{ dealsOnly: true }} rawParams={searchParams} defaultSort="discount" extraSorts={["discount"]} />
      </Suspense>
    </>
  );
}
