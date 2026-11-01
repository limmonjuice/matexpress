import Image from "next/image";
import Link from "next/link";
import { ArrowIcon } from "@/components/home/icons";
import { ProductCard } from "@/components/home/product-card";
import { categories } from "@/lib/catalog/data/categories";
import type { CardData, SearchEntry } from "@/lib/catalog/types";
import { formatPeso } from "@/lib/format";
import { Breadcrumbs } from "./breadcrumbs";
import "./listing.css";

type Props = {
  query: string;
  alternatives: { query: string; items: SearchEntry[] }[];
  sizeBySlug: Record<string, string>;
  bestSellers: CardData[];
};

/** A failed search shouldn't be the end of the visit: other searches, the categories, the best sellers and a person. */
export function NoResults({ query, alternatives, bestSellers }: Props) {
  const searchHref = (q: string) => `/search?q=${encodeURIComponent(q)}`;

  return (
    <>
      <section className="hm-frame hm-hub-head">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Search" }]} />
        {query ? <h1>No match for “{query}”</h1> : <h1>What do you need for the site?</h1>}
        <p>{query ? "Sellers may stock it under another name. Try one of these." : "Search above, or start from a category."}</p>
      </section>

      {alternatives.length > 0 && (
        <section className="hm-frame hm-alts" aria-label="Other searches">
          {alternatives.map((alternative) => (
            <div key={alternative.query} className="hm-alt">
              <h2>
                <Link href={searchHref(alternative.query)}>
                  Search “{alternative.query}” instead <ArrowIcon />
                </Link>
              </h2>
              <ul>
                {alternative.items.map((item) => (
                  <li key={item.slug}>
                    <Link href={`/products/${item.slug}`}>
                      <span className="hm-search-thumb">
                        <Image src={item.image} alt="" width={56} height={56} />
                      </span>
                      <span className="hm-search-name">
                        <b>{item.name}</b>
                        <small>
                          {formatPeso(item.price)} / {item.unit}
                        </small>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      <section className="hm-frame hm-section" aria-labelledby="hm-browse-title">
        <h2 id="hm-browse-title" className="hm-title">
          Browse by category
        </h2>
        <ul className="hm-chiplist">
          {categories.map((category) => (
            <li key={category.slug}>
              <Link href={`/categories/${category.slug}`}>{category.name}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="hm-frame hm-section" aria-labelledby="hm-popular-title">
        <h2 id="hm-popular-title" className="hm-title">
          What people are buying
        </h2>
        <ul className="hm-products hm-products--wide">
          {bestSellers.map((product) => (
            <li key={product.slug}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </section>

      <section className="hm-frame hm-section hm-askus">
        <h2>Still can&apos;t find it?</h2>
        <p>Tell us what you need and we&apos;ll ask the sellers. We&apos;re here from 6 AM to 6 PM, every day.</p>
        <Link href="/help/contact" className="hm-btn hm-btn--ink">
          Ask us <ArrowIcon />
        </Link>
      </section>
    </>
  );
}
