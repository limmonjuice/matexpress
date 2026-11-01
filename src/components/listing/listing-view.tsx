"use client";

import { useEffect, useLayoutEffect, useOptimistic, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNow } from "@/hooks/use-now";
import { ChevronDownIcon, CloseIcon, FilterIcon, StarIcon } from "@/components/home/icons";
import { applyListingChange, BATCH, listingHref, paramsHref, SORT_LABELS, type Facet, type ListingChange, type ListingParams, type ListingResult, type SortKey } from "@/lib/catalog/listing";
import { arrivalDate, formatDay } from "@/lib/delivery";
import { plural } from "@/lib/format";
import { usePreferences } from "@/stores/preferences-store";

type Props = {
  pathname: string;
  params: ListingParams;
  result: Omit<ListingResult, "items">;
  shown: number;
  sorts: SortKey[];
  children: React.ReactNode;
};

/** A long list of options starts short, so one filter never pushes the rest out of reach. */
const SHORT_LIST = 6;

export function ListingView({ pathname, params: loaded, result, shown, sorts, children }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // Ahead of the server on a slow connection: a tick shows at once, and the next click builds on it instead of losing it.
  const [params, setParams] = useOptimistic(loaded);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useRef<HTMLButtonElement>(null);
  const tools = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [toolsVisible, setToolsVisible] = useState(true);
  const [listVisible, setListVisible] = useState(true);

  const go = (change: ListingChange) => {
    startTransition(() => {
      const next = applyListingChange(params, change);
      setParams(next);
      router.replace(paramsHref(pathname, next), { scroll: false });
    });
  };

  const appliedCount = result.applied.length;
  const showFloat = !toolsVisible && listVisible && result.total > 0;

  // Once the top row has scrolled away, the phone's Filter button floats under the thumb, until the list ends.
  useEffect(() => {
    const toolsEl = tools.current;
    const listEl = list.current;
    if (!toolsEl || !listEl || typeof IntersectionObserver === "undefined") return;
    const watchTools = new IntersectionObserver(([entry]) => setToolsVisible(entry.isIntersecting));
    const watchList = new IntersectionObserver(([entry]) => setListVisible(entry.isIntersecting));
    watchTools.observe(toolsEl);
    watchList.observe(listEl);
    return () => {
      watchTools.disconnect();
      watchList.disconnect();
    };
  }, []);

  // The route stays alive when hidden. Coming back to an open drawer would surprise anyone.
  useLayoutEffect(() => () => setDrawerOpen(false), []);

  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    closeDrawer.current?.focus();
    document.documentElement.classList.add("hm-lock");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("hm-lock");
      previous?.focus();
    };
  }, [drawerOpen]);

  return (
    <div className="hm-listing" data-pending={pending}>
      {result.subs.length > 0 && (
        <nav className="hm-subs" aria-label="Narrow by type">
          <Link href={listingHref(pathname, params, { sub: null })} scroll={false} replace aria-current={!params.sub ? "true" : undefined}>
            All
          </Link>
          {result.subs.map((sub) => (
            <Link
              key={sub.name}
              href={listingHref(pathname, params, { sub: sub.name })}
              scroll={false}
              replace
              aria-current={params.sub === sub.name ? "true" : undefined}
              data-empty={sub.count === 0}
            >
              {sub.name}
              <small>{sub.count}</small>
            </Link>
          ))}
        </nav>
      )}

      <div className="hm-listing-grid">
        <aside className="hm-filters" aria-label="Filters" data-lenis-prevent>
          <FilterGroups facets={result.facets} ticked={params.filters} onToggle={(key, value) => go({ toggle: { key, value } })} />
        </aside>

        <div className="hm-results" ref={list}>
          <div className="hm-tools" ref={tools}>
            <p className="hm-count-line" role="status">
              {plural(result.total, "product")}
            </p>
            <button type="button" className="hm-filter-btn" onClick={() => setDrawerOpen(true)}>
              <FilterIcon />
              Filter
              {appliedCount > 0 && <span>{appliedCount}</span>}
            </button>
            <label className="hm-sort">
              <span>Sort by</span>
              <span className="hm-sort-box">
                <select aria-label="Sort by" value={params.sort} onChange={(e) => go({ sort: e.target.value as SortKey })}>
                  {sorts.map((sort) => (
                    <option key={sort} value={sort}>
                      {SORT_LABELS[sort]}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon />
              </span>
            </label>
          </div>

          {appliedCount > 0 && (
            <div className="hm-applied">
              {result.applied.map((filter) => (
                <button
                  type="button"
                  key={`${filter.key}:${filter.value}`}
                  aria-label={`Remove filter: ${filter.group} ${filter.label}`}
                  onClick={() => go({ toggle: { key: filter.key, value: filter.value } })}
                >
                  <small>{filter.group}</small> {filter.label}
                  <CloseIcon />
                </button>
              ))}
              <button type="button" className="hm-applied-clear" onClick={() => go({ clear: true })}>
                Clear all
              </button>
            </div>
          )}

          {result.total > 0 ? (
            <ul className="hm-products">{children}</ul>
          ) : (
            <div className="hm-noresult">
              <h2>Nothing matches all of those</h2>
              <p>Take one filter off and the list comes back.</p>
              <button type="button" className="hm-btn hm-btn--ink hm-btn--small" onClick={() => go({ clear: true })}>
                Clear all filters
              </button>
            </div>
          )}

          {result.total > 0 && (
            <div className="hm-more">
              <div className="hm-tape" aria-hidden="true">
                <i style={{ transform: `scaleX(${result.total ? shown / result.total : 1})` }} />
              </div>
              <p>
                Showing {shown} of {result.total}
              </p>
              {result.hasMore && (
                <Link href={listingHref(pathname, params, { show: params.show + BATCH })} className="hm-btn hm-btn--ink hm-btn--small" scroll={false} replace>
                  Show more
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="hm-drawer hm-drawer--left" data-open={drawerOpen} aria-hidden={!drawerOpen} inert={!drawerOpen} data-lenis-prevent>
        <div className="hm-drawer-scrim" onClick={() => setDrawerOpen(false)} />
        <div className="hm-drawer-panel" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="hm-drawer-head">
            <h2>Filters</h2>
            <button type="button" ref={closeDrawer} className="hm-round" onClick={() => setDrawerOpen(false)} aria-label="Close filters">
              <CloseIcon />
            </button>
          </div>
          <div className="hm-drawer-scroll hm-filters-drawer">
            <FilterGroups facets={result.facets} ticked={params.filters} idPrefix="d-" onToggle={(key, value) => go({ toggle: { key, value } })} />
          </div>
          <div className="hm-filters-foot">
            {appliedCount > 0 && (
              <button type="button" className="hm-btn hm-btn--ghost" onClick={() => go({ clear: true })}>
                Clear all
              </button>
            )}
            <button type="button" className="hm-btn hm-btn--accent" onClick={() => setDrawerOpen(false)}>
              Show {plural(result.total, "product")}
            </button>
          </div>
        </div>
      </div>

      <button type="button" className="hm-filter-float" data-show={showFloat} tabIndex={showFloat ? 0 : -1} onClick={() => setDrawerOpen(true)}>
        <FilterIcon />
        Filter
        {appliedCount > 0 && <span>{appliedCount}</span>}
      </button>
    </div>
  );
}

type GroupProps = { ticked: Record<string, string[]>; onToggle: (key: string, value: string) => void };

function FilterGroups({ facets, ticked, onToggle, idPrefix = "" }: GroupProps & { facets: Facet[]; idPrefix?: string }) {
  return (
    <>
      {facets.map((facet) => (
        <FilterGroup key={facet.key} facet={facet} ticked={ticked} onToggle={onToggle} idPrefix={idPrefix} />
      ))}
    </>
  );
}

function FilterGroup({ facet, ticked, onToggle, idPrefix }: GroupProps & { facet: Facet; idPrefix: string }) {
  const [expanded, setExpanded] = useState(false);
  const now = useNow();
  const area = usePreferences((s) => s.area);
  const long = facet.values.length > SHORT_LIST + 1;
  const isTicked = (value: string) => (ticked[facet.key] ?? []).includes(value);
  const values = long && !expanded ? facet.values.filter((v, i) => i < SHORT_LIST || isTicked(v.value)) : facet.values;

  // Dates, not speeds, as soon as the browser knows the day.
  const label = (value: Facet["values"][number]) => {
    if (facet.key !== "delivery" || !now) return value.label;
    return `By ${formatDay(arrivalDate(now, value.value === "soon" ? 1 : 3, area))}`;
  };

  return (
    <fieldset className="hm-filter">
      <legend>{facet.label}</legend>
      {values.map((value) => (
        <label key={value.value} data-empty={value.count === 0 && !isTicked(value.value)}>
          <input
            type="checkbox"
            id={`${idPrefix}${facet.key}-${value.value}`}
            checked={isTicked(value.value)}
            disabled={value.count === 0 && !isTicked(value.value)}
            onChange={() => onToggle(facet.key, value.value)}
          />
          <span className="hm-filter-box" aria-hidden="true" />
          <span className="hm-filter-name">
            {facet.key === "rating" && <StarIcon />}
            {label(value)}
          </span>
          <small>{value.count}</small>
        </label>
      ))}
      {long && (
        <button type="button" className="hm-filter-more" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
          {expanded ? "Show fewer" : `Show all ${facet.values.length}`}
        </button>
      )}
    </fieldset>
  );
}
