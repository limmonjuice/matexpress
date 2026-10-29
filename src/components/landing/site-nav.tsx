"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { cartCount, cartTotal, useCartStore } from "@/stores/cart-store";
import { formatPeso } from "./catalog";
import { MaterialIcon } from "./material-icons";

const LINKS = [
  ["Materials", "#materials"],
  ["Estimator", "#estimator"],
  ["Tracking", "#tracking"],
  ["Trade", "#trade"],
  ["FAQ", "#faq"],
] as const;

export function SiteNav() {
  const nav = useRef<HTMLElement>(null);
  const badge = useRef<HTMLSpanElement>(null);
  const [theme, setTheme] = useState("light");
  const lines = useCartStore((s) => s.lines);
  const lastAddedAt = useCartStore((s) => s.lastAddedAt);
  const openCart = useCartStore((s) => s.open);
  const count = cartCount(lines);

  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);

  // Match the nav to whatever section is underneath it.
  useEffect(() => {
    let frame = 0;
    const check = () => {
      frame = 0;
      const y = (nav.current?.offsetHeight ?? 64) / 2;
      const under = document
        .elementsFromPoint(window.innerWidth / 2, y)
        .find((el) => !nav.current?.contains(el))
        ?.closest<HTMLElement>("[data-theme]");
      setTheme(under?.dataset.theme ?? "light");
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mx-theme", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mx-theme", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!lastAddedAt || !badge.current) return;
    gsap.fromTo(badge.current, { scale: 1.8 }, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.4)" });
  }, [lastAddedAt]);

  return (
    <>
      <header ref={nav} className="nav" data-nav-theme={theme}>
        <div className="frame nav-inner">
          <a href="#top" className="wordmark" aria-label="MatExpress home">
            <MaterialIcon name="hardhat" className="wordmark-mark" />
            MatExpress
          </a>
          <nav className="nav-links" aria-label="Primary">
            {LINKS.map(([label, href]) => (
              <a key={href} href={href}>
                {label}
              </a>
            ))}
          </nav>
          <div className="nav-actions">
            <a href="#trade" className="nav-signin">
              Sign in
            </a>
            <button id="cart-button" type="button" className="cart-button" onClick={openCart} aria-label={`Cart, ${count} items`}>
              <MaterialIcon name="wheelbarrow" className="cart-icon" />
              <span ref={badge} className="cart-badge">
                {count}
              </span>
            </button>
            <a href="#materials" className="btn btn-nav">
              Start an order
            </a>
          </div>
        </div>
      </header>
      <CartDrawer />
    </>
  );
}

function CartDrawer() {
  const panel = useRef<HTMLDivElement>(null);
  const { lines, isOpen, close, setQuantity, remove } = useCartStore();
  const total = cartTotal(lines);
  const freeDelivery = 25000;

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [isOpen, close]);

  return (
    <div className={isOpen ? "drawer is-open" : "drawer"} aria-hidden={!isOpen} inert={!isOpen} data-lenis-prevent>
      <div className="drawer-scrim" onClick={close} />
      <div ref={panel} className="drawer-panel" role="dialog" aria-modal="true" aria-labelledby="cart-title" tabIndex={-1}>
        <div className="drawer-head">
          <h2 id="cart-title">Your cart</h2>
          <button type="button" className="drawer-close" onClick={close} aria-label="Close cart">
            ×
          </button>
        </div>
        {lines.length === 0 ? (
          <div className="drawer-empty">
            <MaterialIcon name="wheelbarrow" className="drawer-empty-icon" />
            <p>Nothing in the barrow yet.</p>
            <a href="#materials" className="link-arrow" onClick={close}>
              Browse materials <span aria-hidden="true">→</span>
            </a>
          </div>
        ) : (
          <>
            <ul className="drawer-lines">
              {lines.map((line) => (
                <li key={line.id}>
                  <span className="drawer-name">
                    {line.name}
                    <small>
                      {formatPeso(line.price)} / {line.unit}
                    </small>
                  </span>
                  <div className="stepper stepper-sm">
                    <button type="button" aria-label={`Fewer ${line.name}`} onClick={() => setQuantity(line.id, line.quantity - 1)}>
                      −
                    </button>
                    <span>{line.quantity}</span>
                    <button type="button" aria-label={`More ${line.name}`} onClick={() => setQuantity(line.id, line.quantity + 1)}>
                      +
                    </button>
                  </div>
                  <b>{formatPeso(line.price * line.quantity)}</b>
                  <button type="button" className="drawer-remove" onClick={() => remove(line.id)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <div className="drawer-foot">
              <p className="drawer-delivery">
                {total >= freeDelivery
                  ? "Free delivery unlocked."
                  : `Add ${formatPeso(freeDelivery - total)} more for free delivery.`}
              </p>
              <div className="drawer-meter">
                <i style={{ width: `${Math.min(100, (total / freeDelivery) * 100)}%` }} />
              </div>
              <div className="drawer-total">
                <span>Subtotal</span>
                <strong>{formatPeso(total)}</strong>
              </div>
              <a href="#checkout" className="btn btn-yellow btn-block">
                Checkout
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
