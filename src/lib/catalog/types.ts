export type Category = {
  slug: string;
  name: string;
  subcategories: string[];
  /** Tile picture; only the categories featured on the home page have one. */
  image?: string;
};

/** One seller's price for a product. */
export type Offer = {
  seller: string;
  price: number;
  arrives: string;
};

export type Product = {
  slug: string;
  name: string;
  spec: string;
  unit: string;
  /** The lowest price across sellers. */
  priceFrom: number;
  listPrice?: number;
  sellerCount: number;
  topSeller: string;
  rating?: number;
  reviewCount?: number;
  badge?: "New" | "Deal" | "Bestseller";
  categorySlug: string;
  image: string;
  /** The best few offers, cheapest first. */
  offers?: Offer[];
};

export type Perk = {
  icon: "compare" | "cart" | "truck" | "route" | "shield" | "lock" | "camera" | "headset";
  title: string;
  text: string;
};

export type FlashDeal = {
  title: string;
  blurb: string;
  /** A fixed end date. It is never reset, so the countdown stays honest. */
  endsAt: string;
  href: string;
  image: string;
};
