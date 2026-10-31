import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/catalog/types";
import { formatPeso, plural } from "@/lib/format";
import { AddToCartButton } from "./add-to-cart-button";
import { Rating } from "./rating";

/** Shows what makes a marketplace different: the same product from several sellers, cheapest marked. */
export function BestSellerCard({ product }: { product: Product }) {
  const offers = [...(product.offers ?? [])].sort((a, b) => a.price - b.price).slice(0, 3);
  const best = offers[0];
  const more = product.sellerCount - offers.length;

  return (
    <article className="hm-best">
      <div className="hm-best-media">
        <Image src={product.image} alt="" fill sizes="(max-width: 1179px) 150px, 170px" />
      </div>
      <div className="hm-best-body">
        <h3 className="hm-card-name">
          <Link href={`/products/${product.slug}`}>{product.name}</Link>
        </h3>
        <p className="hm-best-spec">{product.spec}</p>
        {product.rating !== undefined && <Rating value={product.rating} count={product.reviewCount} />}

        <ul className="hm-offers" aria-label={`Sellers of ${product.name}`}>
          {offers.map((offer) => (
            <li key={offer.seller} data-best={offer === best}>
              <span>
                <b>{offer.seller}</b>
                <small>{offer === best ? `Best price · ${offer.arrives}` : offer.arrives}</small>
              </span>
              <strong>{formatPeso(offer.price)}</strong>
            </li>
          ))}
        </ul>
        {more > 0 && <p className="hm-offers-more">+{plural(more, "more seller")}</p>}

        {best && (
          <AddToCartButton
            label="Quick Add"
            line={{
              id: `${product.slug}:${best.seller}`,
              name: product.name,
              unit: product.unit,
              price: best.price,
              image: product.image,
              seller: best.seller,
            }}
          />
        )}
      </div>
    </article>
  );
}
