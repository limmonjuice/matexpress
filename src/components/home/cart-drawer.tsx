"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LoadTruck, TruckRoad } from "@/components/cart/load-truck";
import { QuantityInput } from "@/components/cart/quantity-input";
import { FREE_DELIVERY_OVER } from "@/lib/delivery";
import { formatPeso, plural } from "@/lib/format";
import { formatWeight, loadFor } from "@/lib/load";
import { cartTotal, cartWeight, lineCost, useCartStore } from "@/stores/cart-store";
import { ArrowIcon, CloseIcon } from "./icons";

export function CartDrawer() {
  const panel = useRef<HTMLDivElement>(null);
  const lines = useCartStore((s) => s.lines);
  const isOpen = useCartStore((s) => s.isOpen);
  const close = useCartStore((s) => s.close);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);
  const [notes, setNotes] = useState<Record<string, string | undefined>>({});

  const total = cartTotal(lines);
  const toFree = FREE_DELIVERY_OVER - total;
  const weight = cartWeight(lines);
  const sellers = new Set(lines.map((l) => l.sellerSlug)).size;

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    document.documentElement.classList.add("hm-lock");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("hm-lock");
      previous?.focus();
    };
  }, [isOpen, close]);

  return (
    <div className="hm-drawer" data-open={isOpen} aria-hidden={!isOpen} inert={!isOpen} data-lenis-prevent>
      <div className="hm-drawer-scrim" onClick={close} />
      <div ref={panel} className="hm-drawer-panel" role="dialog" aria-modal="true" aria-labelledby="hm-cart-title" tabIndex={-1}>
        <div className="hm-drawer-head">
          <h2 id="hm-cart-title">Your cart</h2>
          <button type="button" className="hm-round" onClick={close} aria-label="Close cart">
            <CloseIcon />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="hm-cart-empty">
            <LoadTruck lines={[]} className="hm-truck hm-truck--empty" />
            <p>Your truck is empty. Load it from any seller, and check out once.</p>
            <Link href="/categories" className="hm-link" onClick={close}>
              Explore materials <ArrowIcon />
            </Link>
          </div>
        ) : (
          <>
            <ul className="hm-drawer-scroll hm-cart-lines">
              {lines.map((line) => (
                <li key={line.id}>
                  <Link href={`/products/${line.slug}?size=${line.variantId}`} className="hm-cart-thumb" onClick={close} aria-label={line.name}>
                    <Image src={line.image} alt="" width={72} height={72} />
                  </Link>
                  <div className="hm-cart-info">
                    <b>
                      {line.name}
                      {line.variantLabel ? `, ${line.variantLabel}` : ""}
                    </b>
                    <small>
                      {formatPeso(lineCost(line) / line.quantity)} / {line.unit} · {line.seller}
                    </small>
                    <div className="hm-cart-controls">
                      <QuantityInput
                        value={line.quantity}
                        rules={line}
                        name={line.name}
                        onChange={(quantity, note) => {
                          setQuantity(line.id, quantity);
                          setNotes((all) => ({ ...all, [line.id]: note }));
                        }}
                      />
                      <button type="button" className="hm-cart-remove" onClick={() => remove(line.id)}>
                        Remove
                      </button>
                      <strong>{formatPeso(lineCost(line))}</strong>
                    </div>
                    {notes[line.id] && <p className="hm-qty-note">{notes[line.id]}</p>}
                  </div>
                </li>
              ))}
            </ul>

            <div className="hm-cart-foot">
              <TruckRoad lines={lines} total={total} />
              <p className="hm-cart-delivery">
                <b>{toFree > 0 ? `${formatPeso(toFree)} more for free delivery` : "Free delivery unlocked"}</b>
                <span>
                  {formatWeight(weight)} on a{/^[aeiou6]/i.test(loadFor(weight).truck.name) ? "n" : ""} {loadFor(weight).truck.name}
                </span>
              </p>
              <div className="hm-cart-total">
                <span>
                  Subtotal
                  {sellers > 1 && <small> · {plural(sellers, "seller")}, one delivery</small>}
                </span>
                <strong>{formatPeso(total)}</strong>
              </div>
              <div className="hm-cart-actions">
                <Link href="/cart" className="hm-btn hm-btn--ghost" onClick={close}>
                  View cart
                </Link>
                <Link href="/checkout" className="hm-btn hm-btn--accent" onClick={close}>
                  Check out <ArrowIcon />
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
