import { defaultVariant, productImage, bestOffer } from "./card";
import { categoryBySlug } from "./data/categories";
import type { Product, SearchEntry } from "./types";

// What people on site actually type. Each word maps to words the catalog uses.
const LOCAL_WORDS: Record<string, string[]> = {
  semento: ["cement"],
  simento: ["cement"],
  chb: ["hollow"],
  hallow: ["hollow"],
  yero: ["corrugated", "roofing"],
  bakal: ["steel"],
  buhangin: ["sand"],
  graba: ["gravel"],
  kahoy: ["lumber", "plywood"],
  pako: ["nails"],
  pintura: ["paint"],
  tubo: ["pipe"],
  alambre: ["tie"],
  kawad: ["wire"],
  gripo: ["faucet"],
  inidoro: ["toilet"],
  bumbilya: ["bulb"],
  tiles: ["tile"],
};

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/²/g, "2")
    .replace(/³/g, "3")
    .replace(/"/g, " in ")
    .replace(/[^a-z0-9.\s/-]/g, " ");

const stem = (word: string) => (word.length > 3 && word.endsWith("s") ? word.slice(0, -1) : word);

/** Words from a label, plus number-and-unit pairs joined, so "16 mm" also matches "16mm". */
function tokens(text: string) {
  const words = normalize(text).split(/[\s,/-]+/).filter(Boolean);
  const joined = words.flatMap((word, i) => (/^\d/.test(word) && words[i + 1] && /^[a-z]/.test(words[i + 1]) ? [word + words[i + 1]] : []));
  return [...new Set([...words, ...joined].map(stem))];
}

export function buildSearchIndex(products: Product[]): SearchEntry[] {
  return products.map((product) => {
    const variant = defaultVariant(product);
    const offer = bestOffer(variant.offers);
    return {
      slug: product.slug,
      name: product.name,
      spec: variant.spec,
      image: productImage(product),
      price: offer.price,
      unit: product.unit,
      categorySlug: product.categorySlug,
      nameWords: tokens(product.name),
      words: tokens(
        [
          product.brand,
          product.subcategory,
          categoryBySlug(product.categorySlug)?.name ?? "",
          ...product.variants.flatMap((v) => [v.label, v.spec]),
        ].join(" "),
      ),
      sizes: product.variants.map((v) => ({ id: v.id, words: tokens(v.label) })),
    };
  });
}

function editDistance(a: string, b: string, limit: number) {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) {
      next[j] = Math.min(next[j - 1] + 1, row[j] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    row = next;
  }
  return row[b.length];
}

const strictMatch = (word: string, token: string) => {
  if (/^\d/.test(word) || word.length < 3) return token === word;
  return token.includes(word);
};

const fuzzyMatch = (word: string, token: string) => {
  if (word.length < 4 || /^\d/.test(word)) return false;
  return editDistance(word, token, word.length >= 8 ? 2 : 1) <= (word.length >= 8 ? 2 : 1);
};

export type SearchResult = {
  items: SearchEntry[];
  /** Nothing matched exactly, so these are close matches. */
  fuzzy: boolean;
  /** For "rebar 16mm": open the product on that size. */
  sizeBySlug: Record<string, string>;
  /** The catalog's word when a local one was used: "semento" searched as "cement". */
  meaning?: { typed: string; shown: string };
};

const EMPTY: SearchResult = { items: [], fuzzy: false, sizeBySlug: {} };

function run(index: SearchEntry[], words: string[][], test: (word: string, token: string) => boolean) {
  return index
    .map((entry) => {
      let score = 0;
      for (const alternatives of words) {
        const inName = alternatives.some((word) => entry.nameWords.some((token) => test(word, token)));
        const inRest = alternatives.some((word) => entry.words.some((token) => test(word, token)));
        if (!inName && !inRest) return undefined;
        score += inName ? 3 : 1;
      }
      return { entry, score };
    })
    .filter((hit) => hit !== undefined)
    .sort((a, b) => b.score - a.score)
    .map((hit) => hit.entry);
}

export function searchProducts(index: SearchEntry[], query: string, limit = 6): SearchResult {
  const typed = tokens(query);
  if (typed.length === 0) return EMPTY;

  const local = typed.find((word) => LOCAL_WORDS[word] && word !== stem(LOCAL_WORDS[word][0]));
  const words = typed.map((word) => LOCAL_WORDS[word]?.map(stem) ?? [word]);

  let hits = run(index, words, strictMatch);
  let fuzzy = false;
  if (hits.length === 0) {
    hits = run(index, words, fuzzyMatch);
    fuzzy = hits.length > 0;
  }

  const sizeBySlug: Record<string, string> = {};
  for (const entry of hits) {
    const size = entry.sizes.find((s) => typed.some((word) => /^\d/.test(word) && s.words.includes(word)));
    if (size && entry.sizes.length > 1) sizeBySlug[entry.slug] = size.id;
  }

  return {
    items: hits.slice(0, limit),
    fuzzy,
    sizeBySlug,
    ...(local && hits.length ? { meaning: { typed: local, shown: LOCAL_WORDS[local][0] } } : {}),
  };
}

/** When a long search finds nothing: the same search, one word at a time, with what each would find. */
export function alternativeQueries(index: SearchEntry[], query: string) {
  const typed = normalize(query).split(/\s+/).filter(Boolean);
  if (typed.length < 2) return [];
  return typed
    .map((word) => ({ query: word, items: searchProducts(index, word, 3).items }))
    .filter((alternative) => alternative.items.length > 0);
}
