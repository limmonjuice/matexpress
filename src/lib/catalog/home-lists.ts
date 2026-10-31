import { toCard } from "./card";
import { productBySlug } from "./data/products";

// The products the home page features. Server only: this pulls in the whole catalog.

const pick = (slugs: string[]) => slugs.flatMap((slug) => {
  const product = productBySlug(slug);
  return product ? [toCard(product)] : [];
});

export const heroProducts = pick(["portland-cement", "deformed-rebar", "safety-hard-hat"]);

export const newArrivals = pick(["cordless-hammer-drill", "thhn-wire", "elastomeric-wall-paint", "safety-hard-hat", "upvc-pipe", "marine-plywood"]);

export const bestSellers = pick(["portland-cement", "deformed-rebar", "hollow-block"]);
