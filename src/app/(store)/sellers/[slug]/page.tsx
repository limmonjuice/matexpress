import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StarIcon, VerifiedIcon } from "@/components/home/icons";
import { Breadcrumbs } from "@/components/listing/breadcrumbs";
import { Listing } from "@/components/listing/listing";
import { BandSkeleton, ListingSkeleton } from "@/components/listing/listing-skeleton";
import "@/components/listing/listing.css";
import { SellerMark } from "@/components/product/seller-mark";
import "@/components/product/product.css";
import { getSeller, listProducts, listSellers } from "@/lib/catalog";
import { sellerFacts } from "@/lib/catalog/listing";
import { plural } from "@/lib/format";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateStaticParams() {
  return (await listSellers()).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const seller = await getSeller((await params).slug);
  if (!seller) return { title: "Not found | MatExpress" };
  return { title: `${seller.name} | MatExpress`, description: seller.blurb };
}

/** The awning over every neighbourhood hardware store, in the seller's own colour. */
function Awning({ colour }: { colour: string }) {
  return (
    <svg className="hm-awning" viewBox="0 0 1320 56" preserveAspectRatio="none" aria-hidden="true">
      {Array.from({ length: 22 }, (_, i) => (
        <path key={i} d={`M${i * 60} 0h60v36a30 20 0 0 1-60 0z`} fill={i % 2 ? "#fff" : colour} />
      ))}
    </svg>
  );
}

export default function SellerPage(props: Props) {
  return (
    <Suspense fallback={<BandSkeleton />}>
      <SellerContent {...props} />
    </Suspense>
  );
}

async function SellerContent({ params, searchParams }: Props) {
  const { slug } = await params;
  const seller = await getSeller(slug);
  if (!seller) notFound();

  const facts = sellerFacts(await listProducts(), slug);

  return (
    <>
      <section className="hm-frame hm-band-wrap">
        <div className="hm-storefront">
          <Awning colour={seller.awning} />
          <div className="hm-storefront-body">
            <SellerMark name={seller.name} tint={seller.tint} large />
            <div className="hm-storefront-copy">
              <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Sellers" }, { label: seller.name }]} />
              <h1>{seller.name}</h1>
              <p>{seller.blurb}</p>
              <ul className="hm-storefront-facts">
                <li>
                  <VerifiedIcon /> Verified by MatExpress
                </li>
                <li>{seller.city}</li>
                <li>Since {seller.since}</li>
                <li>
                  <StarIcon /> {seller.rating.toFixed(1)} ({seller.reviewCount})
                </li>
              </ul>
            </div>
            <dl className="hm-storefront-stats">
              <div>
                <dt>Materials listed</dt>
                <dd>{facts.productCount}</dd>
              </div>
              <div>
                <dt>Lowest price on</dt>
                <dd>{plural(facts.cheapestCount, "item")}</dd>
              </div>
              <div>
                <dt>Ready the same day</dt>
                <dd>{facts.sameDayShare}%</dd>
              </div>
            </dl>
          </div>
          <p className="hm-storefront-note">
            Our trucks collect from {seller.name} and everyone else in your order, so you still pay once. <Link href="/how-it-works" prefetch={false}>How it works</Link>
          </p>
        </div>
      </section>
      <Suspense fallback={<ListingSkeleton />}>
        <Listing pathname={`/sellers/${slug}`} scope={{ sellerSlug: slug }} rawParams={searchParams} />
      </Suspense>
    </>
  );
}
