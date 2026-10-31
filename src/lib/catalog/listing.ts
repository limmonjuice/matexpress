import { bestOffer, defaultVariant, toCard } from "./card";
import { categories, categoryBySlug } from "./data/categories";
import { sellerBySlug, sellers } from "./data/sellers";
import type { CardData, Offer, Product, Variant } from "./types";

// Filtering, sorting and paging for every product list. Pure, so it runs the same over sample data or database rows.

export type SortKey = "relevance" | "best" | "price-asc" | "price-desc" | "rating" | "new" | "discount";

export const SORT_LABELS: Record<SortKey, string> = {
  relevance: "Best match",
  best: "Best selling",
  "price-asc": "Price, low to high",
  "price-desc": "Price, high to low",
  rating: "Top rated",
  new: "Newest",
  discount: "Biggest discount",
};

export const BATCH = 12;

const RESERVED = new Set(["sort", "show", "sub", "q"]);

export type ListingScope = {
  categorySlug?: string;
  sellerSlug?: string;
  dealsOnly?: boolean;
  /** Restricts the list to these products, in this order: a search result or a job's materials. */
  slugs?: string[];
  /** Cards open on these sizes: "rebar 16mm" should show the 16 mm. */
  preferSizes?: Record<string, string>;
};

export type ListingParams = {
  sub?: string;
  sort: SortKey;
  defaultSort: SortKey;
  show: number;
  filters: Record<string, string[]>;
  /** Carried through every link unchanged, like the search query. */
  extra: Record<string, string>;
};

export type FacetValue = { value: string; label: string; count: number; selected: boolean };
export type Facet = { key: string; label: string; values: FacetValue[] };
export type AppliedFilter = { key: string; value: string; label: string; group: string };

export type ListingResult = {
  items: CardData[];
  total: number;
  /** Products in scope before any filter, for telling "nothing here" from "filtered to nothing". */
  scopeTotal: number;
  hasMore: boolean;
  facets: Facet[];
  applied: AppliedFilter[];
  subs: { name: string; count: number }[];
};

type RawParams = Record<string, string | string[] | undefined>;

const asList = (value: string | string[] | undefined) => (value === undefined ? [] : Array.isArray(value) ? value : [value]);

export function parseListingParams(raw: RawParams, { defaultSort = "best" }: { defaultSort?: SortKey } = {}): ListingParams {
  const sort = asList(raw.sort)[0];
  const show = Number(asList(raw.show)[0]);
  const filters: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (RESERVED.has(key) || key === "__proto__") continue;
    const values = asList(value).filter(Boolean);
    if (values.length) filters[key] = values;
  }
  const q = asList(raw.q)[0];
  return {
    sub: asList(raw.sub)[0] || undefined,
    sort: sort && Object.hasOwn(SORT_LABELS, sort) ? (sort as SortKey) : defaultSort,
    defaultSort,
    show: Number.isInteger(show) && show >= BATCH ? show : BATCH,
    filters,
    extra: q ? { q } : {},
  };
}

// ------------------------------------------------------------------ definitions

const PRICE_BUCKETS = [
  { value: "under-250", label: "Under ₱250", min: 0, max: 250 },
  { value: "250-500", label: "₱250 to ₱500", min: 250, max: 500 },
  { value: "500-1000", label: "₱500 to ₱1,000", min: 500, max: 1000 },
  { value: "1000-5000", label: "₱1,000 to ₱5,000", min: 1000, max: 5000 },
  { value: "over-5000", label: "Over ₱5,000", min: 5000, max: Infinity },
];

const DELIVERY = [
  { value: "soon", label: "Same or next day", maxLead: 1 },
  { value: "week", label: "Within 3 days", maxLead: 3 },
];

const RATINGS = [
  { value: "4.5", label: "4.5 and up" },
  { value: "4", label: "4 and up" },
];

type FacetDef = { key: string; label: string; attribute?: boolean };

function facetDefs(scope: ListingScope): FacetDef[] {
  const category = scope.categorySlug ? categoryBySlug(scope.categorySlug) : undefined;
  return [
    ...(category ? category.filters.map((f) => ({ ...f, attribute: true })) : [{ key: "category", label: "Category" }]),
    { key: "price", label: "Price" },
    { key: "delivery", label: "Delivery" },
    ...(scope.sellerSlug ? [] : [{ key: "seller", label: "Seller" }]),
    { key: "brand", label: "Brand" },
    { key: "rating", label: "Rating" },
    { key: "stock", label: "Availability" },
  ];
}

const offersOf = (product: Product) => product.variants.flatMap((v) => v.offers);

function inScope(product: Product, scope: ListingScope, slugSet?: Set<string>) {
  if (scope.categorySlug && product.categorySlug !== scope.categorySlug) return false;
  if (scope.sellerSlug && !offersOf(product).some((o) => o.sellerSlug === scope.sellerSlug)) return false;
  if (scope.dealsOnly && !offersOf(product).some((o) => o.listPrice && o.listPrice > o.price)) return false;
  if (slugSet && !slugSet.has(product.slug)) return false;
  return true;
}

// --------------------------------------------------------------------- matching

type Match = { variant: Variant; offer: Offer };

function matchProduct(product: Product, scope: ListingScope, defs: FacetDef[], filters: Record<string, string[]>, sub?: string): Match | undefined {
  if (sub && product.subcategory !== sub) return undefined;
  if (filters.category && !filters.category.includes(product.categorySlug)) return undefined;
  if (filters.brand && !filters.brand.includes(product.brand)) return undefined;
  if (filters.rating) {
    const lowest = Math.min(...filters.rating.map(Number));
    if ((product.rating ?? 0) < lowest) return undefined;
  }

  const attributeKeys = defs.filter((d) => d.attribute && filters[d.key]).map((d) => d.key);
  const maxLead = filters.delivery ? Math.max(...filters.delivery.map((v) => DELIVERY.find((d) => d.value === v)?.maxLead ?? 0)) : undefined;
  const buckets = filters.price?.map((v) => PRICE_BUCKETS.find((b) => b.value === v)).filter((b) => b !== undefined);

  const matches: Match[] = [];
  for (const variant of product.variants) {
    if (!attributeKeys.every((key) => filters[key].includes(variant.attributes[key]))) continue;
    const offers = variant.offers.filter(
      (o) =>
        (!scope.sellerSlug || o.sellerSlug === scope.sellerSlug) &&
        (!filters.seller || filters.seller.includes(o.sellerSlug)) &&
        (maxLead === undefined || o.leadDays <= maxLead) &&
        (!filters.stock || o.stock > 0) &&
        (!scope.dealsOnly || (o.listPrice !== undefined && o.listPrice > o.price)),
    );
    if (!offers.length) continue;
    const offer = bestOffer(offers);
    if (buckets && !buckets.some((b) => offer.price >= b.min && offer.price < b.max)) continue;
    matches.push({ variant, offer });
  }
  if (!matches.length) return undefined;

  // The size people usually buy, unless the filters ask for another.
  const usual = scope.preferSizes?.[product.slug] ?? defaultVariant(product).id;
  return matches.find((m) => m.variant.id === usual) ?? [...matches].sort((a, b) => a.offer.price - b.offer.price)[0];
}

// ----------------------------------------------------------------------- facets

function facetOptions(def: FacetDef, products: Product[], scope: ListingScope): { value: string; label: string }[] {
  const unique = (values: { value: string; label: string }[]) => [...new Map(values.map((v) => [v.value, v])).values()];
  switch (def.key) {
    case "price":
      return PRICE_BUCKETS;
    case "delivery":
      return DELIVERY;
    case "rating":
      return RATINGS;
    case "stock":
      return [{ value: "in", label: "In stock only" }];
    case "brand":
      return unique(products.map((p) => ({ value: p.brand, label: p.brand })));
    case "category":
      return categories.filter((c) => products.some((p) => p.categorySlug === c.slug)).map((c) => ({ value: c.slug, label: c.name }));
    case "seller": {
      const present = new Set(products.flatMap(offersOf).map((o) => o.sellerSlug));
      return sellers.filter((s) => present.has(s.slug)).map((s) => ({ value: s.slug, label: s.name }));
    }
    default:
      return unique(
        products.flatMap((p) =>
          p.variants
            .filter((v) => v.attributes[def.key] && (!scope.sellerSlug || v.offers.some((o) => o.sellerSlug === scope.sellerSlug)))
            .map((v) => ({ value: v.attributes[def.key], label: v.attributes[def.key] })),
        ),
      );
  }
}

// ---------------------------------------------------------------------- sorting

const discountOf = (card: CardData) => (card.listPrice ? (card.listPrice - card.price) / card.listPrice : 0);

function sorter(sort: SortKey, products: Map<string, Product>, order?: Map<string, number>) {
  const rank = (card: CardData) => products.get(card.slug)?.salesRank ?? 999;
  const compare: Record<SortKey, (a: CardData, b: CardData) => number> = {
    relevance: (a, b) => (order ? (order.get(a.slug) ?? 999) - (order.get(b.slug) ?? 999) : rank(a) - rank(b)),
    best: (a, b) => rank(a) - rank(b),
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.reviewCount ?? 0) - (a.reviewCount ?? 0),
    new: (a, b) => (products.get(b.slug)?.addedAt ?? "").localeCompare(products.get(a.slug)?.addedAt ?? ""),
    discount: (a, b) => discountOf(b) - discountOf(a),
  };
  return (a: CardData, b: CardData) => compare[sort](a, b) || rank(a) - rank(b);
}

// ------------------------------------------------------------------------ query

export function queryProducts(products: Product[], scope: ListingScope, params: ListingParams): ListingResult {
  const slugSet = scope.slugs ? new Set(scope.slugs) : undefined;
  const scoped = products.filter((p) => inScope(p, scope, slugSet));
  const defs = facetDefs(scope);

  // A value that doesn't exist in this list is ignored, so an old link never empties the page.
  const options = new Map(defs.map((def) => [def.key, facetOptions(def, scoped, scope)]));
  const filters: Record<string, string[]> = {};
  for (const def of defs) {
    const known = new Set(options.get(def.key)!.map((o) => o.value));
    const values = (params.filters[def.key] ?? []).filter((v) => known.has(v));
    if (values.length) filters[def.key] = values;
  }

  const category = scope.categorySlug ? categoryBySlug(scope.categorySlug) : undefined;
  const sub = params.sub && category?.subcategories.includes(params.sub) ? params.sub : undefined;

  const matched = scoped.flatMap((product) => {
    const match = matchProduct(product, scope, defs, filters, sub);
    return match ? [{ product, match }] : [];
  });

  const byMap = new Map(scoped.map((p) => [p.slug, p]));
  const order = scope.slugs ? new Map(scope.slugs.map((slug, i) => [slug, i])) : undefined;
  const cards = matched
    .map(({ product, match }) => toCard(product, { variantId: match.variant.id, sellerSlug: match.offer.sellerSlug }))
    .sort(sorter(params.sort, byMap, order));

  const facets: Facet[] = defs
    .map((def) => {
      const without = { ...filters };
      delete without[def.key];
      const selected = filters[def.key] ?? [];
      const values = options.get(def.key)!.map((option) => {
        const withValue = { ...without, [def.key]: [option.value] };
        const count = scoped.filter((p) => matchProduct(p, scope, defs, withValue, sub)).length;
        return { value: option.value, label: option.label, count, selected: selected.includes(option.value) };
      });
      return { key: def.key, label: def.label, values: def.key === "price" ? values.filter((v) => v.count > 0 || v.selected) : values };
    })
    // One choice is no choice, unless it's a yes-or-no like "in stock".
    .filter((facet) => facet.values.length > 1 || (facet.key === "stock" && facet.values.length === 1));

  const applied: AppliedFilter[] = defs.flatMap((def) =>
    (filters[def.key] ?? []).map((value) => ({
      key: def.key,
      value,
      group: def.label,
      label: options.get(def.key)!.find((o) => o.value === value)?.label ?? value,
    })),
  );

  const subs = category
    ? category.subcategories.map((name) => ({ name, count: scoped.filter((p) => matchProduct(p, scope, defs, filters, name)).length }))
    : [];

  return {
    items: cards.slice(0, params.show),
    total: cards.length,
    scopeTotal: scoped.length,
    hasMore: cards.length > params.show,
    facets,
    applied,
    subs,
  };
}

// ------------------------------------------------------------------------ links

export type ListingChange =
  | { toggle: { key: string; value: string } }
  | { clear: true }
  | { sort: SortKey }
  | { show: number }
  | { sub: string | null };

/** This list after one change. Filtering starts the list over; sorting keeps the depth. */
export function applyListingChange(params: ListingParams, change: ListingChange): ListingParams {
  let { sub, sort, show } = params;
  let filters = params.filters;

  if ("toggle" in change) {
    const { key, value } = change.toggle;
    const current = filters[key] ?? [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    filters = { ...filters, [key]: next };
    show = BATCH;
  } else if ("clear" in change) {
    filters = {};
    show = BATCH;
  } else if ("sort" in change) {
    sort = change.sort;
  } else if ("show" in change) {
    show = change.show;
  } else {
    sub = change.sub ?? undefined;
    show = BATCH;
  }

  return { ...params, sub, sort, show, filters };
}

/** The address of a list in this state. */
export function paramsHref(pathname: string, params: ListingParams) {
  const { sub, sort, show, filters } = params;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params.extra)) query.set(key, value);
  if (sub) query.set("sub", sub);
  for (const [key, values] of Object.entries(filters)) values.forEach((value) => query.append(key, value));
  if (sort !== params.defaultSort) query.set("sort", sort);
  if (show !== BATCH) query.set("show", String(show));
  const text = query.toString();
  return text ? `${pathname}?${text}` : pathname;
}

export const listingHref = (pathname: string, params: ListingParams, change: ListingChange) => paramsHref(pathname, applyListingChange(params, change));

/** Plain facts for the top of a list, worked out from the list itself. */
export function listFacts(products: Product[], scope: ListingScope) {
  const slugSet = scope.slugs ? new Set(scope.slugs) : undefined;
  const scoped = products.filter((p) => inScope(p, scope, slugSet));
  const offers = scoped.flatMap(offersOf);
  if (!offers.length) return [];
  const sellerCount = new Set(offers.map((o) => o.sellerSlug)).size;
  const count = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
  return [count(scoped.length, "product"), count(sellerCount, "seller")];
}

/** For a seller's page: facts drawn from the catalog, so nothing has to be invented. */
export function sellerFacts(products: Product[], sellerSlug: string) {
  const sold = products.filter((p) => offersOf(p).some((o) => o.sellerSlug === sellerSlug));
  const cheapest = sold.filter((p) => bestOffer(defaultVariant(p).offers).sellerSlug === sellerSlug);
  const fastest = sold.flatMap((p) => p.variants.flatMap((v) => v.offers)).filter((o) => o.sellerSlug === sellerSlug);
  const sameDay = fastest.filter((o) => o.leadDays === 0).length;
  return {
    productCount: sold.length,
    cheapestCount: cheapest.length,
    sameDayShare: fastest.length ? Math.round((sameDay / fastest.length) * 100) : 0,
    name: sellerBySlug(sellerSlug)?.name,
  };
}
