import Image from "next/image";
import Link from "next/link";
import type { CardData } from "@/lib/catalog/types";
import { formatPeso, plural } from "@/lib/format";
import { AddToCartButton } from "./add-to-cart-button";
import { Arrival } from "./arrival";
import { Rating } from "./rating";

/** Shows what makes a marketplace different: the same product from several sellers, cheapest marked. */
export function BestSellerCard({ product }: { product: CardData }) {
  const best = product.offers[0];
  const more = product.sellerCount - product.offers.length;

  return (
    <article className="hm-best">
      <div className="hm-best-media">
        <Image src={product.image} alt="" fill sizes="(max-width: 1179px) 150px, 170px" />
      </div>
      <div className="hm-best-body">
        <h3 className="hm-card-name">
          <Link href={product.href}>{product.name}</Link>
        </h3>
        <p className="hm-best-spec">{product.spec}</p>
        {product.rating !== undefined && <Rating value={product.rating} count={product.reviewCount} />}

        <ul className="hm-offers" aria-label={`Sellers of ${product.name}`}>
          {product.offers.map((offer) => (
            <li key={offer.sellerSlug} data-best={offer === best}>
              <span>
                <b>{offer.seller}</b>
                <small>
                  {offer === best && "Best price · "}
                  <Arrival bare leadDays={offer.leadDays} />
                </small>
              </span>
              <strong>{formatPeso(offer.price)}</strong>
            </li>
          ))}
        </ul>
        {more > 0 && <p className="hm-offers-more">+{plural(more, "more seller")}</p>}

        <AddToCartButton label="Quick Add" line={product.line} disabled={!product.inStock} />
      </div>
    </article>
  );
}
