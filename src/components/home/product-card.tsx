import Image from "next/image";
import Link from "next/link";
import type { CardData } from "@/lib/catalog/types";
import { discountPercent, formatPeso, plural } from "@/lib/format";
import { AddToCartButton } from "./add-to-cart-button";
import { Arrival } from "./arrival";
import { TruckIcon, VerifiedIcon } from "./icons";
import { Rating } from "./rating";
import { SaveButton } from "./save-button";

/** `eager`: on the first screen, so the browser fetches its photo right away instead of waiting to see it's in view. */
export function ProductCard({ product, hideBadge, eager }: { product: CardData; hideBadge?: CardData["badge"]; eager?: boolean }) {
  const off = product.listPrice ? discountPercent(product.listPrice, product.price) : 0;
  const badge = product.badge === hideBadge ? undefined : product.badge;

  return (
    <article className="hm-card">
      <div className="hm-card-media">
        <Image src={product.image} alt="" fill sizes="(max-width: 699px) 112px, (max-width: 1179px) 30vw, 280px" loading={eager ? "eager" : undefined} />
        {badge && <span className={`hm-badge hm-badge--${badge.toLowerCase()}`}>{badge}</span>}
        <SaveButton slug={product.slug} name={product.name} />
      </div>

      <div className="hm-card-body">
        <p className="hm-card-seller">
          <VerifiedIcon />
          {product.seller.name}
        </p>
        {/* The link stretches over the whole card, so the photo opens the product too. */}
        <h3 className="hm-card-name">
          <Link href={product.href}>{product.name}</Link>
        </h3>
        <p className="hm-card-spec">{product.spec}</p>
        <p className="hm-card-meta">
          {product.rating !== undefined && <Rating value={product.rating} count={product.reviewCount} />}
          <span>{plural(product.sellerCount, "seller")}</span>
          {product.sizeCount > 1 && <span>{product.sizeCount} sizes</span>}
        </p>
        <div className="hm-card-foot">
          <p className="hm-price">
            <span className="hm-price-now">
              <strong>{formatPeso(product.price)}</strong> / {product.unit}
            </span>
            {off > 0 ? (
              <span className="hm-price-was">
                <s>{formatPeso(product.listPrice!)}</s> <em>{off}% off</em>
              </span>
            ) : (
              product.unitPrice && <span className="hm-price-unit">{product.unitPrice}</span>
            )}
          </p>
          <AddToCartButton line={product.line} disabled={!product.inStock} />
        </div>
        <p className="hm-card-arrive" data-out={!product.inStock}>
          {product.inStock ? (
            <>
              <TruckIcon />
              <span>
                <Arrival leadDays={product.leadDays} />
              </span>
            </>
          ) : (
            "Out of stock"
          )}
        </p>
      </div>
    </article>
  );
}
