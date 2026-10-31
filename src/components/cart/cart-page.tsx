"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowIcon, AlertIcon, PinIcon } from "@/components/home/icons";
import { Arrival } from "@/components/home/arrival";
import { SellerMark } from "@/components/product/seller-mark";
import { useHydrated } from "@/hooks/use-hydrated";
import { useNow } from "@/hooks/use-now";
import { toLine } from "@/lib/catalog/card";
import { sellerBySlug } from "@/lib/catalog/data/sellers";
import { cheaperOffer, reconcileCart, type CartNotice } from "@/lib/catalog/reconcile";
import type { Product } from "@/lib/catalog/types";
import { deliveryAreas, deliveryFee, formatDay, FREE_DELIVERY_OVER, orderArrival } from "@/lib/delivery";
import { formatPeso, plural } from "@/lib/format";
import { formatWeight, loadFor } from "@/lib/load";
import { cartTotal, cartWeight, groupBySeller, lineCost, useCartStore, type CartLine } from "@/stores/cart-store";
import { usePreferences } from "@/stores/preferences-store";
import { LoadTruck, TruckRoad } from "./load-truck";
import { QuantityInput } from "./quantity-input";
import "./cart.css";

const article = (word: string) => (/^[aeiou6]/i.test(word) ? "an" : "a");

export function CartPage({ products }: { products: Product[] }) {
  const lines = useCartStore((s) => s.lines);
  const setLines = useCartStore((s) => s.setLines);
  const area = usePreferences((s) => s.area);
  const setArea = usePreferences((s) => s.setArea);
  const now = useNow();
  const [notices, setNotices] = useState<CartNotice[]>([]);
  const hydrated = useHydrated(useCartStore);

  // A saved cart can be weeks old. Check it against today's catalog as soon as it has loaded.
  useEffect(() => {
    const check = () => {
      const current = useCartStore.getState().lines;
      const result = reconcileCart(current, products);
      // Added to, not replaced: a second check finds nothing new, and what the first one changed must still be said.
      setNotices((seen) => [...seen, ...result.notices.filter((n) => !seen.some((s) => s.lineId === n.lineId && s.kind === n.kind))]);
      if (result.notices.length) setLines(result.lines);
    };
    if (useCartStore.persist.hasHydrated()) check();
    return useCartStore.persist.onFinishHydration(check);
  }, [products, setLines]);

  if (hydrated && lines.length === 0) return <EmptyCart />;

  const total = cartTotal(lines);
  const fee = deliveryFee(area, total);
  const weight = cartWeight(lines);
  const load = loadFor(weight);
  const groups = groupBySeller(lines);
  const arrival = now ? orderArrival(lines, now, area) : undefined;
  const blocked = lines.some((l) => l.stock <= 0);
  const toFree = FREE_DELIVERY_OVER - total;
  const shownNotices = notices.filter((n) => lines.some((l) => l.id === n.lineId));

  return (
    <div className="hm-cartpage">
      <section className="hm-frame">
        <h1 className="hm-cart-title">Your cart</h1>
        <div className="hm-load">
          <div className="hm-load-truck">
            <LoadTruck lines={lines} />
          </div>
          <div className="hm-load-copy">
            <p className="hm-load-weight">
              {formatWeight(weight)}
              <span>
                {load.trips > 1 ? `${load.trips} trips by ${load.truck.name}` : `on ${article(load.truck.name)} ${load.truck.name}`}
              </span>
            </p>
            <ol className="hm-route" aria-label="The route for this order">
              {groups.map((group) => (
                <li key={group.sellerSlug}>
                  <SellerMark slug={group.sellerSlug} name={group.seller} />
                  <span>{group.seller}</span>
                </li>
              ))}
              <li className="hm-route-end">
                <span className="hm-route-pin">
                  <PinIcon />
                </span>
                <span>Your site, {area}</span>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className="hm-frame hm-cart-grid">
        <div className="hm-cart-main">
          {shownNotices.length > 0 && (
            <ul className="hm-notices" aria-label="Changes to your cart">
              {shownNotices.map((notice) => (
                <li key={`${notice.lineId}:${notice.kind}`}>
                  <AlertIcon />
                  <NoticeText notice={notice} />
                </li>
              ))}
            </ul>
          )}

          {groups.map((group) => (
            <article key={group.sellerSlug} className="hm-sellerbox">
              <header>
                <SellerMark slug={group.sellerSlug} name={group.seller} />
                <h2>
                  <Link href={`/sellers/${group.sellerSlug}`}>{group.seller}</Link>
                </h2>
                <small>{sellerBySlug(group.sellerSlug)?.city}</small>
              </header>
              <ul>
                {group.lines.map((line) => (
                  <CartRow key={line.id} line={line} products={products} />
                ))}
              </ul>
            </article>
          ))}
        </div>

        <aside className="hm-summary" aria-label="Order summary">
          <h2>Order summary</h2>
          <dl>
            <div>
              <dt>Items</dt>
              <dd>{formatPeso(total)}</dd>
            </div>
            <div>
              <dt>
                <label className="hm-summary-area">
                  Delivery to
                  <select value={area} onChange={(e) => setArea(e.target.value)} aria-label="Delivery area">
                    {deliveryAreas.map((name) => (
                      <option key={name}>{name}</option>
                    ))}
                  </select>
                </label>
              </dt>
              <dd>{fee === 0 ? "Free" : formatPeso(fee)}</dd>
            </div>
            <div className="hm-summary-total">
              <dt>Total</dt>
              <dd>{formatPeso(total + fee)}</dd>
            </div>
          </dl>

          <TruckRoad lines={lines} total={total} />
          <p className="hm-summary-free">{toFree > 0 ? `${formatPeso(toFree)} more and delivery is free` : "You've reached free delivery"}</p>

          {arrival && (
            <p className="hm-summary-arrival">
              <b>Arrives together {formatDay(arrival.date)}</b>
              {arrival.setBy && <span>{arrival.setBy} is the last one ready. Pick a faster seller to bring this forward.</span>}
            </p>
          )}

          {blocked ? (
            <>
              <p className="hm-summary-blocked">Remove what&apos;s no longer available to check out.</p>
              <button type="button" className="hm-btn hm-btn--block" disabled>
                Check out
              </button>
            </>
          ) : (
            <Link href="/checkout" className="hm-btn hm-btn--accent hm-btn--block">
              Check out <ArrowIcon />
            </Link>
          )}
          <p className="hm-summary-pay">One payment, however many sellers. GCash, Maya, card or online banking.</p>
        </aside>
      </section>

      <div className="hm-cart-stickybar">
        <p>
          <b>{formatPeso(total + fee)}</b>
          <small>{plural(lines.length, "item")}</small>
        </p>
        {blocked ? (
          <button type="button" className="hm-btn" disabled>
            Check out
          </button>
        ) : (
          <Link href="/checkout" className="hm-btn hm-btn--accent">
            Check out <ArrowIcon />
          </Link>
        )}
      </div>
    </div>
  );
}

function NoticeText({ notice }: { notice: CartNotice }) {
  if (notice.kind === "gone") return <>{notice.name} is no longer available from this seller.</>;
  if (notice.kind === "stock") return <>Only {notice.left.toLocaleString("en-PH")} left of {notice.name}, so we lowered your quantity.</>;
  return (
    <>
      {notice.name} changed from {formatPeso(notice.was)} to {formatPeso(notice.now)}.
    </>
  );
}

function CartRow({ line, products }: { line: CartLine; products: Product[] }) {
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);
  const replace = useCartStore((s) => s.replace);
  const [note, setNote] = useState<string | undefined>();

  const gone = line.stock <= 0;
  const better = gone ? undefined : cheaperOffer(line, products);
  const betterName = better && sellerBySlug(better.offer.sellerSlug)?.name;

  const switchSeller = () => {
    if (!better) return;
    const product = products.find((p) => p.slug === line.slug);
    const variant = product?.variants.find((v) => v.id === line.variantId);
    if (product && variant) replace(line.id, toLine(product, variant, better.offer));
  };

  return (
    <li className="hm-cartrow" data-gone={gone}>
      <Link href={`/products/${line.slug}?size=${line.variantId}`} className="hm-cart-thumb" aria-label={line.name}>
        <Image src={line.image} alt="" width={84} height={84} />
      </Link>
      <div className="hm-cartrow-body">
        <h3>
          <Link href={`/products/${line.slug}?size=${line.variantId}`}>
            {line.name}
            {line.variantLabel ? `, ${line.variantLabel}` : ""}
          </Link>
        </h3>
        <p>
          {formatPeso(lineCost(line) / line.quantity)} / {line.unit}
          {!gone && (
            <>
              {" · "}
              <Arrival prefix="Ready" leadDays={line.leadDays} />
            </>
          )}
        </p>
        {gone ? (
          <p className="hm-qty-note">No longer available from this seller.</p>
        ) : (
          <div className="hm-cartrow-controls">
            <QuantityInput
              value={line.quantity}
              rules={line}
              name={line.name}
              onChange={(quantity, n) => {
                setQuantity(line.id, quantity);
                setNote(n);
              }}
            />
            <button type="button" className="hm-cart-remove" onClick={() => remove(line.id)}>
              Remove
            </button>
          </div>
        )}
        {gone && (
          <button type="button" className="hm-cart-remove" onClick={() => remove(line.id)}>
            Remove
          </button>
        )}
        {note && <p className="hm-qty-note">{note}</p>}
        {better && (
          <p className="hm-cartrow-better">
            {betterName} has this for {formatPeso(better.saves)} less.{" "}
            <button type="button" onClick={switchSeller}>
              Switch
            </button>
          </p>
        )}
      </div>
      <strong className="hm-cartrow-total">{formatPeso(lineCost(line))}</strong>
    </li>
  );
}

function EmptyCart() {
  return (
    <section className="hm-frame hm-cart-none">
      <LoadTruck lines={[]} className="hm-truck hm-truck--hero" />
      <h1>Your truck is empty</h1>
      <p>Load it from any seller. One truck collects from all of them, and you pay once.</p>
      <div>
        <Link href="/categories" className="hm-btn hm-btn--accent">
          Explore materials <ArrowIcon />
        </Link>
        <Link href="/saved" className="hm-btn hm-btn--ghost">
          Saved items
        </Link>
      </div>
    </section>
  );
}
