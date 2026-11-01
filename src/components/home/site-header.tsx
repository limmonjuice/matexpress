"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { quickCategories } from "@/lib/catalog/data/categories";
import { plural } from "@/lib/format";
import { cartCount, useCartStore } from "@/stores/cart-store";
import { usePreferences } from "@/stores/preferences-store";
import { CartDrawer } from "./cart-drawer";
import { CategoryMenu } from "./category-menu";
import { DeliverTo } from "./deliver-to";
import { HeartIcon, MenuIcon, TruckIcon, UserIcon, CartIcon } from "./icons";
import { MobileMenu } from "./mobile-menu";
import { SearchBox } from "./search-box";

export function SiteHeader() {
  const badge = useRef<HTMLSpanElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const lines = useCartStore((s) => s.lines);
  const lastAddedAt = useCartStore((s) => s.lastAddedAt);
  const openCart = useCartStore((s) => s.open);
  const savedCount = usePreferences((s) => s.saved.length);
  const count = cartCount(lines);

  useEffect(() => {
    if (!lastAddedAt || !badge.current) return;
    const count = badge.current;
    // Fetched when it's needed: the header is on every page, and this pop is all it uses GSAP for.
    import("gsap").then(
      ({ default: gsap }) => gsap.fromTo(count, { scale: 1.7 }, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.45)" }),
      () => {},
    );
  }, [lastAddedAt]);

  return (
    <>
      <header className="hm-header">
        <div className="hm-frame hm-header-row">
          <button type="button" className="hm-round hm-menu-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <MenuIcon />
          </button>
          <Link href="/" className="hm-wordmark">
            MatExpress
          </Link>
          <DeliverTo className="hm-deliver--header" />
          <SearchBox />
          <nav className="hm-actions" aria-label="Your account">
            <Link href="/track" className="hm-action hm-action--track">
              <TruckIcon />
              Track order
            </Link>
            {/* In every page's header, so what they prefetch every visitor pays for: the saved list only once there's a list, and the account page never, as it has nothing to show before it reads the session. */}
            <Link href="/saved" prefetch={savedCount > 0 ? "auto" : false} className="hm-action hm-action--icon" aria-label={`Saved items, ${savedCount}`}>
              <HeartIcon />
              {savedCount > 0 && <span className="hm-action-count">{savedCount}</span>}
            </Link>
            <Link href="/account" prefetch={false} className="hm-action hm-action--icon hm-action--account" aria-label="Account">
              <UserIcon />
            </Link>
            <button type="button" className="hm-cart-btn" onClick={openCart} aria-label={`Cart, ${plural(count, "item")}`}>
              <CartIcon />
              <span className="hm-cart-word">Cart</span>{" "}
              <span ref={badge} className="hm-cart-count">
                {count}
              </span>
            </button>
          </nav>
        </div>
      </header>

      <div className="hm-catbar">
        <div className="hm-frame hm-catbar-row">
          <DeliverTo className="hm-deliver--bar" />
          <Link href="/track" className="hm-catbar-track">
            <TruckIcon />
            Track order
          </Link>
          <CategoryMenu />
          <nav className="hm-catbar-links" aria-label="Popular categories">
            {quickCategories.map((category) => (
              <Link key={category.slug} href={`/categories/${category.slug}`}>
                {category.name}
              </Link>
            ))}
            <Link href="/deals" className="hm-catbar-deals">
              Deals
            </Link>
          </nav>
          <nav className="hm-catbar-side" aria-label="About MatExpress">
            <Link href="/how-it-works" prefetch={false}>
              How it works
            </Link>
            <Link href="/sell">Sell on MatExpress</Link>
          </nav>
        </div>
      </div>

      <MobileMenu open={menuOpen} onClose={closeMenu} />
      <CartDrawer />
    </>
  );
}
