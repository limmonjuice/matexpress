"use client";

import { useEffect, useState } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import Link from "next/link";
import { HeartIcon, ArrowIcon, CheckIcon } from "@/components/home/icons";
import { ProductCard } from "@/components/home/product-card";
import type { CardData } from "@/lib/catalog/types";
import { plural } from "@/lib/format";
import { useCartStore } from "@/stores/cart-store";
import { usePreferences } from "@/stores/preferences-store";

/** Saved items live in the browser, so no one needs an account just to keep a list. */
export function SavedGrid({ cards }: { cards: CardData[] }) {
  const saved = usePreferences((s) => s.saved);
  const add = useCartStore((s) => s.add);
  const openCart = useCartStore((s) => s.open);
  const hydrated = useHydrated(usePreferences);
  const [copied, setCopied] = useState(false);

  const items = cards.filter((card) => saved.includes(card.slug));

  const addAll = () => {
    items.filter((card) => card.inStock).forEach((card) => add(card.line));
    openCart();
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/saved?items=${items.map((c) => c.slug).join(",")}`;
    await navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (hydrated && items.length === 0) {
    return (
      <div className="hm-saved-none hm-arrive">
        <HeartIcon />
        <h2>Nothing saved yet</h2>
        <p>Tap the heart on any material to keep it here. No account needed.</p>
        <Link href="/categories" className="hm-btn hm-btn--accent">
          Explore materials <ArrowIcon />
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="hm-tools">
        <p className="hm-count-line" role="status">
          {plural(items.length, "saved item")}
        </p>
        <button type="button" className="hm-btn hm-btn--ghost hm-btn--small" onClick={copyLink}>
          {copied ? <CheckIcon /> : null}
          {copied ? "Link copied" : "Copy link to this list"}
        </button>
        <button type="button" className="hm-btn hm-btn--accent hm-btn--small" onClick={addAll}>
          Add all to cart
        </button>
      </div>
      <ul className="hm-products hm-products--saved">
        {items.map((card, i) => (
          <li key={card.slug} style={{ "--hm-i": i % 12 } as React.CSSProperties}>
            <ProductCard product={card} />
          </li>
        ))}
      </ul>
    </>
  );
}

/** Opening a shared list saves its items, so a foreman's link lands on a list they can buy from. */
export function ImportSharedList({ slugs }: { slugs: string[] }) {
  const toggleSaved = usePreferences((s) => s.toggleSaved);

  useEffect(() => {
    const merge = () => {
      const { saved } = usePreferences.getState();
      slugs.filter((slug) => !saved.includes(slug)).forEach(toggleSaved);
    };
    const { persist } = usePreferences;
    if (!persist || persist.hasHydrated()) merge();
    return persist?.onFinishHydration(merge);
  }, [slugs, toggleSaved]);

  return null;
}
