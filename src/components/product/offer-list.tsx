"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { useArrival } from "@/components/home/arrival";
import { StarIcon, StoreIcon, VerifiedIcon } from "@/components/home/icons";
import { sellerBySlug } from "@/lib/catalog/data/sellers";
import { formatPeso } from "@/lib/format";
import type { RankedOffer } from "@/lib/pricing";
import { SellerMark } from "./seller-mark";

type Props = {
  ranked: RankedOffer[];
  selected?: string;
  unit: string;
  quantity: number;
  onSelect: (sellerSlug: string) => void;
  name: string;
};

/**
 * The canvass, on the page: every seller of this size, ranked for the quantity
 * being bought. Prices drop at different quantities, so typing a bigger number can
 * move a seller to the top, and the rows slide to show it.
 */
export function OfferList({ ranked, selected, unit, quantity, onSelect, name }: Props) {
  const rows = useRef(new Map<string, HTMLElement>());
  const positions = useRef(new Map<string, number>());

  const order = ranked.map((r) => r.offer.sellerSlug).join();
  useLayoutEffect(() => {
    rows.current.forEach((row, key) => {
      const top = row.offsetTop;
      const previous = positions.current.get(key);
      if (previous !== undefined && previous !== top) {
        row.animate?.([{ transform: `translateY(${previous - top}px)` }, { transform: "none" }], { duration: 480, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" });
      }
      positions.current.set(key, top);
    });
  }, [order]);

  const best = ranked.find((r) => r.canFill);
  const soonest = ranked.filter((r) => r.canFill).reduce<RankedOffer | undefined>((s, r) => (!s || r.offer.leadDays < s.offer.leadDays ? r : s), undefined);

  return (
    <fieldset className="hm-offerlist">
      <legend>
        {ranked.length === 1 ? "Sold by one seller" : `Compare ${ranked.length} sellers`}
        <small>
          at {quantity.toLocaleString("en-PH")} {unit}
        </small>
      </legend>
      <div className="hm-offer-rows">
        {ranked.map((row) => {
          const slug = row.offer.sellerSlug;
          return (
            <div
              key={slug}
              ref={(el) => {
                if (el) rows.current.set(slug, el);
                else rows.current.delete(slug);
              }}
              className="hm-offer"
              data-selected={selected === slug}
              data-disabled={!row.canFill}
            >
              <input
                type="radio"
                id={`hm-offer-${slug}`}
                name={`seller-${name}`}
                checked={selected === slug}
                disabled={!row.canFill}
                onChange={() => onSelect(slug)}
              />
              <label htmlFor={`hm-offer-${slug}`}>
                <SellerMark slug={slug} name={sellerBySlug(slug)?.name ?? slug} />
                <OfferDetails row={row} best={best} soonest={soonest} quantity={quantity} />
              </label>
              <Link href={`/sellers/${slug}`} className="hm-offer-store" aria-label={`Visit ${sellerBySlug(slug)?.name}'s store`}>
                <StoreIcon />
              </Link>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

function OfferDetails({ row, best, soonest, quantity }: { row: RankedOffer; best?: RankedOffer; soonest?: RankedOffer; quantity: number }) {
  const seller = sellerBySlug(row.offer.sellerSlug);
  const arrival = useArrival(row.offer.leadDays);
  const isBest = best === row;
  const extra = best && row.canFill ? row.total - best.total : 0;

  return (
    <>
      <span className="hm-offer-who">
        <b>
          {seller?.name} <VerifiedIcon />
        </b>
        <small>
          <StarIcon /> {seller?.rating.toFixed(1)}
          {row.canFill ? (
            <> · Arrives {arrival ?? "soon"}</>
          ) : (
            <em> · {row.offer.stock > 0 ? `Only ${row.offer.stock.toLocaleString("en-PH")} left` : "Out of stock"}</em>
          )}
        </small>
      </span>
      <span className="hm-offer-price">
        <b>{formatPeso(row.total)}</b>
        {quantity > 1 && <small>{formatPeso(row.unitPrice)} each</small>}
        {isBest ? <i className="hm-offer-tag">Lowest total</i> : extra > 0 ? <i className="hm-offer-more">+{formatPeso(extra)}</i> : null}
        {soonest === row && !isBest && best && row.offer.leadDays < best.offer.leadDays && <i className="hm-offer-tag hm-offer-tag--soon">Soonest</i>}
      </span>
    </>
  );
}
