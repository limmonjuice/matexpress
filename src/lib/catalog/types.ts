export type FilterDef = { key: string; label: string };

export type Category = {
  slug: string;
  name: string;
  /** One line under the category's title. */
  blurb: string;
  subcategories: string[];
  image: string;
  /** Shown as a tile on the home page. */
  featured?: boolean;
  /** Filters specific to this kind of material, read from each size's attributes. */
  filters: FilterDef[];
  /** The colour of the category's own band: its material, as a field. */
  field: string;
  /** Text on that field. */
  fieldInk: "dark" | "light";
  /** The colour this material takes when it is loaded on the truck. */
  cargo: string;
};

export type Seller = {
  slug: string;
  name: string;
  city: string;
  since: number;
  rating: number;
  reviewCount: number;
  blurb: string;
  /** Pale tint behind the seller's initials. Identity, not data. */
  tint: string;
  /** The awning colour on the seller's page. */
  awning: string;
};

/** What the browser needs to know about a seller to show their mark, rating and town. */
export type SellerBrief = Pick<Seller, "name" | "city" | "rating" | "tint">;

/** Those details by seller slug, handed to the screens that show them. */
export type SellerDirectory = Record<string, SellerBrief>;

/** A lower price per unit from a quantity upward. */
export type PriceTier = { from: number; price: number };

/** One seller's price for one size of a product. */
export type Offer = {
  sellerSlug: string;
  sellerName: string;
  price: number;
  listPrice?: number;
  stock: number;
  /** Days until the seller has it ready for our truck, from an order before the cut-off. */
  leadDays: number;
  tiers?: PriceTier[];
};

/** What the unit price is per: 3250 for a 150 m box is ₱21.67/m. */
export type Measure = { per: "kg" | "m" | "L" | "m²"; amount: number };

export type Drawing =
  | { kind: "bar"; lengthMm: number; diameterMm: number; section?: "round" | "rect" | "angle" | "c"; sectionMm?: [number, number] }
  | { kind: "pipe"; lengthMm: number; diameterMm: number }
  | { kind: "sheet"; widthMm: number; heightMm: number; thicknessMm: number }
  | { kind: "roof"; lengthMm: number; widthMm: number; gaugeNote: string }
  | { kind: "block"; widthMm: number; heightMm: number; depthMm: number; holes: number }
  | { kind: "bag"; kg: number }
  | { kind: "can"; litres: number; diameterMm: number; heightMm: number; scaleFigure?: boolean }
  | { kind: "pile"; note: string }
  | { kind: "coil"; lengthM: number; note: string }
  | { kind: "tile"; sideMm: number; thicknessMm: number; note: string };

/** One size of a product. A product with one size still has one of these. */
export type Variant = {
  id: string;
  label: string;
  spec: string;
  attributes: Record<string, string>;
  measure?: Measure;
  weightKg: number;
  minQty?: number;
  step?: number;
  /** Quantities people usually buy, offered as one-tap picks. */
  quickQty?: number[];
  drawing?: Drawing;
  offers: Offer[];
};

export type ProductImage = { src: string; kind: "cutout" | "in-use"; alt: string };

export type Badge = "New" | "Deal" | "Bestseller";

export type Product = {
  slug: string;
  name: string;
  brand: string;
  categorySlug: string;
  subcategory: string;
  unit: string;
  /** What the size buttons are called on this product. */
  sizeLabel?: string;
  /** Which size a card and a product page open on. Middle sizes sell most, so it isn't always the first. */
  defaultVariantId?: string;
  badge?: Badge;
  description: string;
  highlights: string[];
  images: ProductImage[];
  rating?: number;
  reviewCount?: number;
  /** Share of reviews at 5, 4, 3, 2 and 1 stars, in percent. */
  ratingBars?: [number, number, number, number, number];
  /** 1 sells most. */
  salesRank: number;
  addedAt: string;
  /** Other materials the same job usually needs. */
  related?: string[];
  variants: Variant[];
};

/** The fields a cart line keeps, so the cart still works if the catalog can't be read. */
export type LineData = {
  id: string;
  slug: string;
  variantId: string;
  variantLabel?: string;
  sellerSlug: string;
  seller: string;
  name: string;
  unit: string;
  categorySlug: string;
  price: number;
  tiers?: PriceTier[];
  minQty?: number;
  step?: number;
  stock: number;
  leadDays: number;
  weightKg: number;
  image: string;
};

/** What a card shows: one product, at one size, from one seller. */
export type CardData = {
  slug: string;
  href: string;
  name: string;
  spec: string;
  unit: string;
  image: string;
  price: number;
  listPrice?: number;
  unitPrice?: string;
  sizeCount: number;
  sellerCount: number;
  seller: { slug: string; name: string };
  rating?: number;
  reviewCount?: number;
  badge?: Badge;
  categorySlug: string;
  leadDays: number;
  inStock: boolean;
  minQty: number;
  /** The cheapest offers for this size, cheapest first. */
  offers: { sellerSlug: string; seller: string; price: number; leadDays: number }[];
  line: LineData;
};

export type SearchEntry = {
  slug: string;
  name: string;
  spec: string;
  image: string;
  price: number;
  unit: string;
  categorySlug: string;
  /** Search words from the name, which count for more. */
  nameWords: string[];
  /** Search words from the sizes, specs, subcategory, category and brand. */
  words: string[];
  /** Each size's id and its lowercased label, so "rebar 16mm" can open on 16 mm. */
  sizes: { id: string; words: string[] }[];
};

export type Job = {
  slug: string;
  name: string;
  blurb: string;
  drawing: "slab" | "wall" | "roof" | "wiring" | "plumbing" | "finishing";
  products: string[];
};

export type Review = {
  author: string;
  role: string;
  rating: number;
  date: string;
  title: string;
  body: string;
  seller?: string;
  /** The seller's or MatExpress's answer, shown under low ratings. */
  reply?: { from: string; body: string };
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
