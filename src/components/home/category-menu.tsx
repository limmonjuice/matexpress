"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { categories, subcategoryHref } from "@/lib/catalog/data/categories";
import { ArrowIcon, ChevronDownIcon, MenuIcon } from "./icons";

/** Long enough that a pointer passing over the button doesn't flash the menu open. */
export const HOVER_DELAY = 300;

export function CategoryMenu() {
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [open, setOpen] = useState(false);

  const after = (next: boolean) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(next), HOVER_DELAY);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    };
    const onPress = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPress);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPress);
    };
  }, [open]);

  return (
    <div ref={root} className="hm-mega" onMouseEnter={() => after(true)} onMouseLeave={() => after(false)}>
      <button
        ref={trigger}
        type="button"
        className="hm-mega-trigger"
        aria-expanded={open}
        onClick={() => {
          clearTimeout(timer.current);
          setOpen((o) => !o);
        }}
      >
        <MenuIcon />
        All categories
        <ChevronDownIcon className="hm-mega-chevron" />
      </button>

      <div className="hm-mega-panel" data-open={open} inert={!open} data-testid="category-panel" data-lenis-prevent>
        <div className="hm-mega-grid">
          {categories.map((category) => (
            <div key={category.slug}>
              <Link href={`/categories/${category.slug}`} className="hm-mega-head" onClick={() => setOpen(false)}>
                {category.name}
              </Link>
              <ul>
                {category.subcategories.map((name) => (
                  <li key={name}>
                    <Link href={subcategoryHref(category.slug, name)} onClick={() => setOpen(false)}>
                      {name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Link href="/categories" className="hm-link" onClick={() => setOpen(false)}>
          View all categories <ArrowIcon />
        </Link>
      </div>
    </div>
  );
}
