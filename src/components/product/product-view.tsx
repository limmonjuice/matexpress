"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LoadTruck } from "@/components/cart/load-truck";
import { QuantityInput } from "@/components/cart/quantity-input";
import { useArrival } from "@/components/home/arrival";
import { ArrowIcon, HeartIcon } from "@/components/home/icons";
import { Rating } from "@/components/home/rating";
import { defaultVariant, toLine } from "@/lib/catalog/card";
import { sellerBySlug } from "@/lib/catalog/data/sellers";
import type { Product, Variant } from "@/lib/catalog/types";
import { deliveryAreas, deliveryFee, FREE_DELIVERY_OVER } from "@/lib/delivery";
import { discountPercent, formatPeso, plural } from "@/lib/format";
import { formatWeight, loadFor } from "@/lib/load";
import { rankOffers, splitOrder, unitPriceLabel } from "@/lib/pricing";
import { useCartStore, type CartLine } from "@/stores/cart-store";
import { usePreferences } from "@/stores/preferences-store";
import { Gallery } from "./gallery";
import { OfferList } from "./offer-list";

const startQuantity = (variant: Variant) => variant.minQty ?? variant.step ?? 1;

/** Reads ?size= apart from the rest, so the whole buy box can still be prerendered. */
function SizeFromUrl({ onSize }: { onSize: (id: string) => void }) {
  const size = useSearchParams().get("size");
  useEffect(() => {
    if (size) onSize(size);
  }, [size, onSize]);
  return null;
}

export function ProductView({ product, specsFor, children }: { product: Product; specsFor: Record<string, string>[]; children?: React.ReactNode }) {
  const [variantId, setVariantId] = useState(defaultVariant(product).id);
  const variant = product.variants.find((v) => v.id === variantId) ?? defaultVariant(product);

  const [quantity, setQuantity] = useState(startQuantity(variant));
  const [typing, setTyping] = useState<number | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [note, setNote] = useState<string | undefined>();

  const add = useCartStore((s) => s.add);
  const openCart = useCartStore((s) => s.open);
  const area = usePreferences((s) => s.area);
  const setArea = usePreferences((s) => s.setArea);
  const saved = usePreferences((s) => s.saved.includes(product.slug));
  const toggleSaved = usePreferences((s) => s.toggleSaved);

  const live = typing ?? quantity;
  const ranked = rankOffers(variant.offers, live);
  const pickedRow = ranked.find((r) => r.offer.sellerSlug === picked && r.canFill);
  const chosen = pickedRow ?? ranked.find((r) => r.canFill);
  const cheapest = ranked.find((r) => r.canFill);
  const split = chosen ? undefined : splitOrder(variant.offers, live);
  const allOut = variant.offers.every((o) => o.stock <= 0);

  const items = chosen?.total ?? 0;
  const fee = deliveryFee(area, items);
  const toFree = FREE_DELIVERY_OVER - items;
  const arrival = useArrival(chosen?.offer.leadDays ?? 0);

  const line = chosen ? toLine(product, variant, chosen.offer) : undefined;
  const preview: CartLine[] = line ? [{ ...line, quantity: live }] : [];
  const load = loadFor(variant.weightKg * live);
  const off = chosen?.offer.listPrice ? discountPercent(chosen.offer.listPrice, chosen.unitPrice) : 0;

  const selectSize = (id: string, updateUrl = true) => {
    const next = product.variants.find((v) => v.id === id);
    if (!next) return;
    setVariantId(id);
    setPicked(null);
    setNote(undefined);
    setTyping(null);
    setQuantity((q) => Math.max(startQuantity(next), q));
    if (updateUrl) {
      const url = new URL(window.location.href);
      if (id === defaultVariant(product).id) url.searchParams.delete("size");
      else url.searchParams.set("size", id);
      window.history.replaceState(null, "", url);
    }
  };
  const fromUrl = useRef((id: string) => selectSize(id, false));
  useEffect(() => {
    fromUrl.current = (id: string) => selectSize(id, false);
  });

  const addToCart = () => {
    if (!line) return;
    add(line, live);
    openCart();
  };

  const addSplit = () => {
    if (!split) return;
    for (const part of split) add(toLine(product, variant, part.offer), part.quantity);
    openCart();
  };

  // Past the main button, a phone keeps a way to buy under the thumb.
  const buyButton = useRef<HTMLDivElement>(null);
  const [buyVisible, setBuyVisible] = useState(true);
  useEffect(() => {
    const el = buyButton.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setBuyVisible(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const unitPrice = chosen ? unitPriceLabel(chosen.unitPrice, variant.measure) : undefined;

  return (
    <>
      <Suspense fallback={null}>
        <SizeFromUrl onSize={(id) => fromUrl.current(id)} />
      </Suspense>

      {/* Its own grid: the sticky gallery stops where the buy box does, not over what's below. */}
      <div className="hm-pv">
        {/* First in the page, so a phone reads what this is before the picture. */}
        <header className="hm-buy-head">
          <h1 className="hm-buy-title">{product.name}</h1>
          <p className="hm-buy-sub">
            {variant.spec}
            <span>by {product.brand}</span>
          </p>
          <p className="hm-buy-meta">
            {product.rating !== undefined && (
              <a href="#reviews" className="hm-buy-rating">
                <Rating value={product.rating} count={product.reviewCount} />
              </a>
            )}
            <span>{plural(variant.offers.length, "seller")}</span>
          </p>
        </header>

        <Gallery images={product.images} drawing={variant.drawing} name={product.name} size={variant.label} />

        <div className="hm-buy">
          <div className="hm-buy-price" aria-live="polite">
            {chosen ? (
              <>
                <strong>{formatPeso(chosen.unitPrice)}</strong>
                <span>/ {product.unit}</span>
                {unitPrice && <small>{unitPrice}</small>}
                {off > 0 && (
                  <em>
                    <s>{formatPeso(chosen.offer.listPrice!)}</s> {off}% off
                  </em>
                )}
              </>
            ) : (
              <strong className="hm-buy-none">{allOut ? "Out of stock" : "More than one seller holds"}</strong>
            )}
          </div>

          {product.variants.length > 1 && (
            <fieldset className="hm-sizes">
              <legend>{product.sizeLabel ?? "Size"}</legend>
              <div>
                {product.variants.map((v) => (
                  <label key={v.id} data-selected={v.id === variant.id} data-out={v.offers.every((o) => o.stock <= 0)}>
                    <input type="radio" name={`size-${product.slug}`} checked={v.id === variant.id} onChange={() => selectSize(v.id)} />
                    {v.label}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div className="hm-buy-qty">
            <div className="hm-buy-qty-label" id="hm-qty-label">
              Quantity
              {variant.minQty ? <small>Minimum {variant.minQty.toLocaleString("en-PH")}</small> : null}
            </div>
            <div className="hm-buy-qty-row">
              <QuantityInput
                value={quantity}
                rules={{ minQty: variant.minQty, step: variant.step }}
                name={product.name}
                onTyping={setTyping}
                onChange={(q, n) => {
                  setTyping(null);
                  setQuantity(q);
                  setNote(n);
                }}
              />
              {variant.quickQty && (
                <div className="hm-quick" role="group" aria-label="Common quantities">
                  {variant.quickQty.map((q) => (
                    <button
                      type="button"
                      key={q}
                      aria-pressed={live === q}
                      onClick={() => {
                        setTyping(null);
                        setQuantity(q);
                        setNote(undefined);
                      }}
                    >
                      {q.toLocaleString("en-PH")}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {note && <p className="hm-qty-note">{note}</p>}
          </div>

          <OfferList ranked={ranked} selected={chosen?.offer.sellerSlug} unit={product.unit} quantity={live} onSelect={setPicked} name={product.slug} />

          {picked && cheapest && chosen && cheapest !== chosen && chosen.total > cheapest.total && (
            <p className="hm-nudge">
              {sellerBySlug(cheapest.offer.sellerSlug)?.name} would save you {formatPeso(chosen.total - cheapest.total)} at this quantity.{" "}
              <button type="button" onClick={() => setPicked(cheapest.offer.sellerSlug)}>
                Switch
              </button>
            </p>
          )}

          {split && (
            <div className="hm-split">
              <p>
                <b>No single seller holds {live.toLocaleString("en-PH")}.</b> Together they do, and one truck collects from both.
              </p>
              <ul>
                {split.map((part) => (
                  <li key={part.offer.sellerSlug}>
                    {part.quantity.toLocaleString("en-PH")} from {sellerBySlug(part.offer.sellerSlug)?.name}
                  </li>
                ))}
              </ul>
              <button type="button" className="hm-btn hm-btn--accent hm-btn--block" onClick={addSplit}>
                Add both to cart <ArrowIcon />
              </button>
            </div>
          )}

          {chosen && (
            <div className="hm-cost">
              <div className="hm-cost-truck">
                <LoadTruck lines={preview} />
                <p>
                  <b>{formatWeight(variant.weightKg * live)}</b>
                  <span>
                    {load.trips > 1 ? `${load.trips} trips by ${load.truck.name}` : `Fits a${/^[aeiou6]/i.test(load.truck.name) ? "n" : ""} ${load.truck.name}`}
                  </span>
                </p>
              </div>
              <dl className="hm-cost-lines">
                <div>
                  <dt>
                    {live.toLocaleString("en-PH")} × {formatPeso(chosen.unitPrice)}
                  </dt>
                  <dd>{formatPeso(items)}</dd>
                </div>
                <div>
                  <dt>
                    <label className="hm-cost-area">
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
                <div className="hm-cost-total">
                  <dt>Total</dt>
                  <dd>{formatPeso(items + fee)}</dd>
                </div>
              </dl>
              <p className="hm-cost-note">
                <b>Arrives {arrival ?? "soon"}</b>
                {toFree > 0 ? <span>{formatPeso(toFree)} more and delivery is free</span> : <span>Free delivery on this order</span>}
              </p>
            </div>
          )}

          <div className="hm-buy-actions" ref={buyButton}>
            <button type="button" className="hm-btn hm-btn--accent hm-buy-add" disabled={!chosen} onClick={addToCart}>
              {chosen ? "Add to cart" : allOut ? "Out of stock" : "Choose a smaller quantity"}
              {chosen && <ArrowIcon />}
            </button>
            <button type="button" className="hm-buy-save" aria-pressed={saved} aria-label={`Save ${product.name}`} onClick={() => toggleSaved(product.slug)}>
              <HeartIcon />
            </button>
          </div>

          <ul className="hm-buy-promises">
            <li>Sold by verified hardware stores and delivered by MatExpress trucks.</li>
            <li>
              Damaged on arrival? We replace it free. <Link href="/help/returns">See returns</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="hm-buybar" data-show={!buyVisible && Boolean(chosen)}>
        <p>
          <b>{chosen ? formatPeso(items) : ""}</b>
          <small>
            {live.toLocaleString("en-PH")} {product.unit}
          </small>
        </p>
        <button type="button" className="hm-btn hm-btn--accent" tabIndex={buyVisible ? -1 : 0} onClick={addToCart}>
          Add to cart
        </button>
      </div>

      <div className="hm-details" data-reveal>
        <section className="hm-specs" aria-labelledby="hm-specs-title">
          <h2 id="hm-specs-title" className="hm-pd-title">
            Specifications
          </h2>
          <table>
            <tbody>
              {Object.entries(specsFor[product.variants.indexOf(variant)]).map(([label, value]) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  <td>{value}</td>
                </tr>
              ))}
              <tr>
                <th scope="row">Weight</th>
                <td>
                  {formatWeight(variant.weightKg)} per {product.unit}
                </td>
              </tr>
            </tbody>
          </table>
        </section>
        {children}
      </div>
    </>
  );
}
