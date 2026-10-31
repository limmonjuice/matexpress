"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { FREE_DELIVERY_OVER } from "@/lib/catalog/home-content";
import { formatPeso } from "@/lib/format";
import { cartTotal, useCartStore } from "@/stores/cart-store";
import { ArrowIcon, CartIcon, CloseIcon, MinusIcon, PlusIcon } from "./icons";

export function CartDrawer() {
  const panel = useRef<HTMLDivElement>(null);
  const lines = useCartStore((s) => s.lines);
  const isOpen = useCartStore((s) => s.isOpen);
  const close = useCartStore((s) => s.close);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);

  const total = cartTotal(lines);
  const toFree = FREE_DELIVERY_OVER - total;
  const sellers = new Set(lines.map((l) => l.seller).filter(Boolean)).size;

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
            <CartIcon className="hm-cart-empty-icon" />
            <p>Your cart is empty. Add materials from any seller and check out once.</p>
            <Link href="/categories" className="hm-link" onClick={close}>
              Explore materials <ArrowIcon />
            </Link>
          </div>
        ) : (
          <>
            <ul className="hm-drawer-scroll hm-cart-lines">
              {lines.map((line) => (
                <li key={line.id}>
                  <span className="hm-cart-thumb">
                    {line.image && <Image src={line.image} alt="" width={72} height={72} />}
                  </span>
                  <div className="hm-cart-info">
                    <b>{line.name}</b>
                    <small>
                      {formatPeso(line.price)} / {line.unit}
                      {line.seller ? ` · ${line.seller}` : ""}
                    </small>
                    <div className="hm-cart-controls">
                      <div className="hm-stepper">
                        <button
                          type="button"
                          aria-label={`Fewer ${line.name}`}
                          onClick={() => setQuantity(line.id, line.quantity - 1)}
                        >
                          <MinusIcon />
                        </button>
                        <span>{line.quantity}</span>
                        <button
                          type="button"
                          aria-label={`More ${line.name}`}
                          onClick={() => setQuantity(line.id, line.quantity + 1)}
                        >
                          <PlusIcon />
                        </button>
                      </div>
                      <button type="button" className="hm-cart-remove" onClick={() => remove(line.id)}>
                        Remove
                      </button>
                      <strong>{formatPeso(line.price * line.quantity)}</strong>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="hm-cart-foot">
              <p className="hm-cart-delivery">
                {toFree > 0 ? `Add ${formatPeso(toFree)} more for free delivery` : "Free delivery unlocked"}
              </p>
              <div className="hm-cart-meter">
                <i style={{ transform: `scaleX(${Math.min(1, total / FREE_DELIVERY_OVER)})` }} />
              </div>
              <div className="hm-cart-total">
                <span>
                  Subtotal
                  {sellers > 1 && <small> · {sellers} sellers, one delivery</small>}
                </span>
                <strong>{formatPeso(total)}</strong>
              </div>
              <Link href="/checkout" className="hm-btn hm-btn--accent hm-btn--block" onClick={close}>
                Check out <ArrowIcon />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
