import type { Seller } from "../types";

// Sample sellers. All fictional: replace with real, verified stores before launch.

export const sellers: Seller[] = [
  {
    slug: "dalisay-hardware",
    name: "Dalisay Hardware",
    city: "Antipolo, Rizal",
    since: 1998,
    rating: 4.8,
    reviewCount: 612,
    blurb: "A family hardware store that stocks a little of everything a site runs out of, usually ready the same day.",
    tint: "#fdecdc",
    awning: "#f48b3e",
  },
  {
    slug: "tibay-steel",
    name: "Tibay Steel",
    city: "Valenzuela, Metro Manila",
    since: 2006,
    rating: 4.7,
    reviewCount: 438,
    blurb: "Rebar, angle bars and purlins by the length or by the truckload, cut and bundled on site.",
    tint: "#dfe6ee",
    awning: "#2a3240",
  },
  {
    slug: "bato-aggregates",
    name: "Bato Aggregates",
    city: "San Mateo, Rizal",
    since: 2011,
    rating: 4.6,
    reviewCount: 287,
    blurb: "Sand, gravel, hollow blocks and cement from a yard beside the quarry road.",
    tint: "#eee7d8",
    awning: "#b08d57",
  },
  {
    slug: "liwanag-hardware",
    name: "Liwanag Hardware",
    city: "Bacoor, Cavite",
    since: 2003,
    rating: 4.7,
    reviewCount: 354,
    blurb: "Electrical, plumbing and paint, with counter staff who know what a rough-in needs.",
    tint: "#fbf0c9",
    awning: "#d9a521",
  },
  {
    slug: "bakal-supply",
    name: "Bakal Supply",
    city: "Meycauayan, Bulacan",
    since: 2014,
    rating: 4.5,
    reviewCount: 196,
    blurb: "A steel yard with deep stock and sharp prices at volume, built for orders in the hundreds.",
    tint: "#e4e6ea",
    awning: "#5b6472",
  },
  {
    slug: "kahoy-lumber",
    name: "Kahoy Lumber",
    city: "Calamba, Laguna",
    since: 2009,
    rating: 4.6,
    reviewCount: 241,
    blurb: "Plywood and lumber kept dry under cover, cut to size and stacked for the truck.",
    tint: "#ecdcc8",
    awning: "#8a5a2b",
  },
];

const bySlug = new Map(sellers.map((s) => [s.slug, s]));

export const sellerBySlug = (slug: string) => bySlug.get(slug);

/** Two letters for a seller's mark: "Dalisay Hardware" is DH. */
export const sellerInitials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
