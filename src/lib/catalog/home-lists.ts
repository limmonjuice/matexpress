import { toCard } from "./card";
import type { CardData, Product } from "./types";

// The products the home page features, as cards. A product that's been removed just drops out of its list.

const HERO = ["portland-cement", "deformed-rebar", "safety-hard-hat"];
const NEW_ARRIVALS = ["cordless-hammer-drill", "thhn-wire", "elastomeric-wall-paint", "safety-hard-hat", "upvc-pipe", "marine-plywood"];
const BEST_SELLERS = ["portland-cement", "deformed-rebar", "hollow-block"];

export function homeLists(products: Product[]) {
  const pick = (slugs: string[]): CardData[] =>
    slugs.flatMap((slug) => {
      const product = products.find((p) => p.slug === slug);
      return product ? [toCard(product)] : [];
    });
  return { heroProducts: pick(HERO), newArrivals: pick(NEW_ARRIVALS), bestSellers: pick(BEST_SELLERS) };
}
