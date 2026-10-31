"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { categories, subcategoryHref } from "@/lib/catalog/data/categories";
import { ChevronDownIcon, CloseIcon } from "./icons";

const LINKS = [
  { label: "Track an order", href: "/track" },
  { label: "Saved items", href: "/saved" },
  { label: "Account", href: "/account" },
  { label: "How it works", href: "/how-it-works" },
  { label: "Sell on MatExpress", href: "/sell" },
];

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    document.documentElement.classList.add("hm-lock");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("hm-lock");
      previous?.focus();
    };
  }, [open, onClose]);

  return (
    <div className="hm-drawer hm-drawer--left" data-open={open} aria-hidden={!open} inert={!open} data-lenis-prevent>
      <div className="hm-drawer-scrim" onClick={onClose} />
      <div ref={panel} className="hm-drawer-panel" role="dialog" aria-modal="true" aria-label="Menu" tabIndex={-1}>
        <div className="hm-drawer-head">
          <Link href="/" className="hm-wordmark" onClick={onClose}>
            MatExpress
          </Link>
          <button type="button" className="hm-round" onClick={onClose} aria-label="Close menu">
            <CloseIcon />
          </button>
        </div>
        <nav className="hm-drawer-scroll" aria-label="Categories">
          {categories.map((category) => (
            <details key={category.slug} className="hm-accordion">
              <summary>
                {category.name}
                <ChevronDownIcon />
              </summary>
              <ul>
                <li>
                  <Link href={`/categories/${category.slug}`} onClick={onClose}>
                    All {category.name}
                  </Link>
                </li>
                {category.subcategories.map((name) => (
                  <li key={name}>
                    <Link href={subcategoryHref(category.slug, name)} onClick={onClose}>
                      {name}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          ))}
          <div className="hm-drawer-links">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={onClose}>
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
