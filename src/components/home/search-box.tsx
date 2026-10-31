"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPeso } from "@/lib/format";
import { popularSearches } from "@/lib/catalog/home-content";
import { searchProducts } from "@/lib/catalog/search";
import type { SearchEntry } from "@/lib/catalog/types";
import { ArrowIcon, SearchIcon } from "./icons";

const searchHref = (query: string) => `/search?q=${encodeURIComponent(query)}`;
const productLink = (slug: string, size?: string) => `/products/${slug}${size ? `?size=${size}` : ""}`;

export function SearchBox({ index }: { index: SearchEntry[] }) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const trimmed = query.trim();
  const { items: results, sizeBySlug } = useMemo(() => searchProducts(index, trimmed), [index, trimmed]);

  // Close when a press lands anywhere outside the search.
  useEffect(() => {
    if (!open) return;
    const onPress = (e: PointerEvent) => {
      if (!form.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPress);
    return () => document.removeEventListener("pointerdown", onPress);
  }, [open]);

  return (
    <form
      ref={form}
      className="hm-search"
      role="search"
      data-open={open}
      onSubmit={(e) => {
        e.preventDefault();
        if (!trimmed) return;
        setOpen(false);
        router.push(searchHref(trimmed));
      }}
      onKeyDown={(e) => {
        if (e.key !== "Escape") return;
        // Browsers clear a search field on Escape, and that change would reopen the panel.
        e.preventDefault();
        setOpen(false);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <SearchIcon className="hm-search-icon" />
      <input
        ref={input}
        type="search"
        value={query}
        placeholder="Search cement, rebar, plywood…"
        aria-label="Search materials"
        autoComplete="off"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      <button type="submit" className="hm-search-go">
        Search
      </button>

      {/* Pressing inside the panel keeps focus in the field. Safari doesn't focus what's pressed, so a blur would close the panel before the click lands. */}
      <div className="hm-search-panel" hidden={!open} data-lenis-prevent onMouseDown={(e) => e.preventDefault()}>
        {!trimmed && (
          <>
            <p className="hm-search-title">Popular searches</p>
            <div className="hm-search-chips">
              {popularSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    setQuery(term);
                    input.current?.focus();
                  }}
                >
                  {term}
                </button>
              ))}
            </div>
          </>
        )}

        {trimmed && results.length > 0 && (
          <ul className="hm-search-results">
            {results.map((product) => (
              <li key={product.slug}>
                <Link href={productLink(product.slug, sizeBySlug[product.slug])} onClick={() => setOpen(false)}>
                  <span className="hm-search-thumb">
                    <Image src={product.image} alt="" width={56} height={56} />
                  </span>
                  <span className="hm-search-name">
                    <b>{product.name}</b>
                    <small>{product.spec}</small>
                  </span>
                  <span className="hm-search-price">
                    {formatPeso(product.price)}
                    <small>/ {product.unit}</small>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {trimmed && results.length === 0 && <p className="hm-search-empty">No quick matches for “{trimmed}”.</p>}

        {trimmed && (
          <Link href={searchHref(trimmed)} className="hm-search-all" onClick={() => setOpen(false)}>
            Search all materials for “{trimmed}” <ArrowIcon />
          </Link>
        )}
      </div>
    </form>
  );
}
