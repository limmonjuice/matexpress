import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/catalog/types";
import { discountPercent, formatPeso, plural } from "@/lib/format";
import { AddToCartButton } from "./add-to-cart-button";
import { VerifiedIcon } from "./icons";
import { Rating } from "./rating";
import { SaveButton } from "./save-button";

export function ProductCard({ product, hideBadge }: { product: Product; hideBadge?: Product["badge"] }) {
  const off = product.listPrice ? discountPercent(product.listPrice, product.priceFrom) : 0;
  const badge = product.badge === hideBadge ? undefined : product.badge;

  return (
    <article className="hm-card">
      <div className="hm-card-media">
        <Image src={product.image} alt="" fill sizes="(max-width: 699px) 62vw, (max-width: 1179px) 30vw, 250px" />
        {badge && <span className={`hm-badge hm-badge--${badge.toLowerCase()}`}>{badge}</span>}
        <SaveButton slug={product.slug} name={product.name} />
      </div>

      <div className="hm-card-body">
        <p className="hm-card-seller">
          <VerifiedIcon />
          {product.topSeller}
        </p>
        {/* The link stretches over the whole card, so the photo opens the product too. */}
        <h3 className="hm-card-name">
          <Link href={`/products/${product.slug}`}>{product.name}</Link>
        </h3>
        <p className="hm-card-meta">
          {product.rating !== undefined && <Rating value={product.rating} count={product.reviewCount} />}
          <span>{plural(product.sellerCount, "seller")}</span>
        </p>
        <div className="hm-card-foot">
          <p className="hm-price">
            <span className="hm-price-now">
              <strong>{formatPeso(product.priceFrom)}</strong> / {product.unit}
            </span>
            {off > 0 && (
              <span className="hm-price-was">
                <s>{formatPeso(product.listPrice!)}</s> <em>{off}% off</em>
              </span>
            )}
          </p>
          <AddToCartButton
            line={{
              id: `${product.slug}:${product.topSeller}`,
              name: product.name,
              unit: product.unit,
              price: product.priceFrom,
              image: product.image,
              seller: product.topSeller,
            }}
          />
        </div>
      </div>
    </article>
  );
}
