import type { Category, FlashDeal, Perk, Product } from "./types";

// Static sample content for the store. Sellers, prices, ratings and dates are
// placeholders: replace them with real data before launch.

export const announcements = [
  "Free delivery on orders over ₱25,000",
  "Same-day dispatch before 2 PM",
  "Verified suppliers only",
];

/** The free-delivery threshold shown in the bar above and in the cart. */
export const FREE_DELIVERY_OVER = 25000;

export const deliveryAreas = ["Metro Manila", "Rizal", "Cavite", "Laguna", "Bulacan"];

export const categories: Category[] = [
  {
    slug: "cement-concrete",
    name: "Cement & Concrete",
    subcategories: ["Portland cement", "Ready-mix concrete", "Mortar and grout", "Concrete additives", "Waterproofing"],
    image: "/home/categories/cement-concrete.webp",
  },
  {
    slug: "steel-rebar",
    name: "Steel & Rebar",
    subcategories: ["Deformed rebar", "Tie wire", "Angle bars", "Steel pipes", "Wire mesh"],
    image: "/home/categories/steel-rebar.webp",
  },
  {
    slug: "sand-gravel",
    name: "Sand & Gravel",
    subcategories: ["Washed sand", "Crushed gravel", "Filling materials", "Boulders"],
    image: "/home/categories/sand-gravel.webp",
  },
  {
    slug: "lumber-plywood",
    name: "Lumber & Plywood",
    subcategories: ["Marine plywood", "Coco lumber", "Phenolic board", "Ceiling board"],
    image: "/home/categories/lumber-plywood.webp",
  },
  {
    slug: "roofing",
    name: "Roofing",
    subcategories: ["GI corrugated sheets", "Long-span roofing", "Gutters", "Insulation", "Roof fasteners"],
    image: "/home/categories/roofing.webp",
  },
  {
    slug: "plumbing",
    name: "Plumbing",
    subcategories: ["uPVC pipes", "Fittings", "Water tanks", "Faucets", "Sanitary ware"],
    image: "/home/categories/plumbing.webp",
  },
  {
    slug: "electrical",
    name: "Electrical",
    subcategories: ["THHN wire", "Breakers and panels", "Conduit", "Switches and outlets", "Lighting"],
    image: "/home/categories/electrical.webp",
  },
  {
    slug: "tools-safety",
    name: "Tools & Safety",
    subcategories: ["Power tools", "Hand tools", "Hard hats", "Gloves and boots", "Scaffolding"],
    image: "/home/categories/tools-safety.webp",
  },
  {
    slug: "masonry",
    name: "Masonry",
    subcategories: ["Hollow blocks", "Bricks", "Pavers", "Adhesives"],
  },
  {
    slug: "paint",
    name: "Paint",
    subcategories: ["Wall paint", "Primers", "Waterproofing paint", "Brushes and rollers"],
  },
  {
    slug: "tiles",
    name: "Tiles",
    subcategories: ["Floor tiles", "Wall tiles", "Tile adhesive", "Grout"],
  },
  {
    slug: "hardware",
    name: "Hardware",
    subcategories: ["Nails and screws", "Bolts and anchors", "Locks and hinges", "Chains and rope"],
  },
];

export const featuredCategories = categories.filter((c) => c.image);

/** The short list of categories in the bar under the header. */
export const quickCategories = categories.slice(0, 7);

export const products: Product[] = [
  {
    slug: "portland-cement",
    name: "Portland Cement Type I",
    spec: "40 kg bag, ASTM C150",
    unit: "bag",
    priceFrom: 252,
    listPrice: 265,
    sellerCount: 5,
    topSeller: "Dalisay Hardware",
    rating: 4.8,
    reviewCount: 214,
    badge: "Bestseller",
    categorySlug: "cement-concrete",
    image: "/home/products/portland-cement.webp",
    offers: [
      { seller: "Dalisay Hardware", price: 252, arrives: "Today" },
      { seller: "Bato Aggregates", price: 256, arrives: "Tomorrow" },
      { seller: "Liwanag Hardware", price: 261, arrives: "Tomorrow" },
    ],
  },
  {
    slug: "deformed-rebar-12mm",
    name: "Deformed Rebar 12 mm",
    spec: "Grade 40, 6 m length",
    unit: "length",
    priceFrom: 232,
    listPrice: 245,
    sellerCount: 4,
    topSeller: "Tibay Steel",
    rating: 4.7,
    reviewCount: 168,
    badge: "Bestseller",
    categorySlug: "steel-rebar",
    image: "/home/products/deformed-rebar-12mm.webp",
    offers: [
      { seller: "Tibay Steel", price: 232, arrives: "Today" },
      { seller: "Bakal Supply", price: 236, arrives: "Tomorrow" },
      { seller: "Dalisay Hardware", price: 241, arrives: "Tomorrow" },
    ],
  },
  {
    slug: "hollow-block-4in",
    name: 'Concrete Hollow Block 4"',
    spec: "Load-bearing, 40 × 20 cm",
    unit: "piece",
    priceFrom: 15,
    listPrice: 16.5,
    sellerCount: 6,
    topSeller: "Bato Aggregates",
    rating: 4.6,
    reviewCount: 132,
    badge: "Bestseller",
    categorySlug: "masonry",
    image: "/home/products/hollow-block-4in.webp",
    offers: [
      { seller: "Bato Aggregates", price: 15, arrives: "Today" },
      { seller: "Dalisay Hardware", price: 15.5, arrives: "Tomorrow" },
      { seller: "Tibay Steel", price: 16, arrives: "In 2 days" },
    ],
  },
  {
    slug: "washed-sand",
    name: "Washed Sand",
    spec: "Screened for concrete and plaster",
    unit: "m³",
    priceFrom: 1450,
    sellerCount: 3,
    topSeller: "Bato Aggregates",
    rating: 4.5,
    reviewCount: 76,
    categorySlug: "sand-gravel",
    image: "/home/products/washed-sand.webp",
  },
  {
    slug: "crushed-gravel",
    name: 'Crushed Gravel 3/4"',
    spec: "Angular, washed",
    unit: "m³",
    priceFrom: 1750,
    sellerCount: 3,
    topSeller: "Bato Aggregates",
    rating: 4.6,
    reviewCount: 64,
    categorySlug: "sand-gravel",
    image: "/home/products/crushed-gravel.webp",
  },
  {
    slug: "marine-plywood",
    name: 'Marine Plywood 1/2"',
    spec: "4 × 8 ft, formwork grade",
    unit: "sheet",
    priceFrom: 1090,
    listPrice: 1150,
    sellerCount: 4,
    topSeller: "Kahoy Lumber",
    rating: 4.7,
    reviewCount: 91,
    badge: "Deal",
    categorySlug: "lumber-plywood",
    image: "/home/products/marine-plywood.webp",
  },
  {
    slug: "gi-roofing-sheet",
    name: "GI Corrugated Roofing",
    spec: "Gauge 26, 8 ft sheet",
    unit: "sheet",
    priceFrom: 420,
    sellerCount: 4,
    topSeller: "Tibay Steel",
    rating: 4.5,
    reviewCount: 58,
    categorySlug: "roofing",
    image: "/home/products/gi-roofing-sheet.webp",
  },
  {
    slug: "upvc-pipe-4in",
    name: 'uPVC Sanitary Pipe 4"',
    spec: "3 m length, Series 1000",
    unit: "length",
    priceFrom: 680,
    sellerCount: 3,
    topSeller: "Dalisay Hardware",
    rating: 4.6,
    reviewCount: 47,
    badge: "New",
    categorySlug: "plumbing",
    image: "/home/products/upvc-pipe-4in.webp",
  },
  {
    slug: "thhn-wire",
    name: "THHN Wire 3.5 mm²",
    spec: "150 m box, stranded copper",
    unit: "box",
    priceFrom: 3250,
    listPrice: 3480,
    sellerCount: 2,
    topSeller: "Liwanag Hardware",
    rating: 4.8,
    reviewCount: 39,
    badge: "Deal",
    categorySlug: "electrical",
    image: "/home/products/thhn-wire.webp",
  },
  {
    slug: "elastomeric-wall-paint",
    name: "Elastomeric Wall Paint",
    spec: "4 L, exterior, white",
    unit: "can",
    priceFrom: 1280,
    sellerCount: 3,
    topSeller: "Liwanag Hardware",
    rating: 4.4,
    reviewCount: 52,
    badge: "New",
    categorySlug: "paint",
    image: "/home/products/elastomeric-wall-paint.webp",
  },
  {
    slug: "cordless-hammer-drill",
    name: "Cordless Hammer Drill",
    spec: "20 V, 2 batteries and charger",
    unit: "set",
    priceFrom: 6950,
    sellerCount: 1,
    topSeller: "Dalisay Hardware",
    rating: 4.9,
    reviewCount: 83,
    badge: "New",
    categorySlug: "tools-safety",
    image: "/home/products/cordless-hammer-drill.webp",
  },
  {
    slug: "safety-hard-hat",
    name: "Safety Hard Hat",
    spec: "ANSI Z89.1, ratchet fit",
    unit: "piece",
    priceFrom: 350,
    sellerCount: 5,
    topSeller: "Bakal Supply",
    rating: 4.7,
    reviewCount: 121,
    badge: "New",
    categorySlug: "tools-safety",
    image: "/home/products/safety-hard-hat.webp",
  },
];

const bySlug = new Map(products.map((p) => [p.slug, p]));

export function getProduct(slug: string) {
  return bySlug.get(slug);
}

const pick = (slugs: string[]) => slugs.map((slug) => bySlug.get(slug)).filter((p): p is Product => Boolean(p));

export const heroProducts = pick(["portland-cement", "deformed-rebar-12mm", "safety-hard-hat"]);

export const newArrivals = pick([
  "cordless-hammer-drill",
  "thhn-wire",
  "elastomeric-wall-paint",
  "safety-hard-hat",
  "upvc-pipe-4in",
  "marine-plywood",
]);

export const bestSellers = pick(["portland-cement", "deformed-rebar-12mm", "hollow-block-4in"]);

export const popularSearches = ["Cement", "Rebar", "Plywood", "Hollow block", "Roofing"];

export const services: Perk[] = [
  { icon: "compare", title: "Compare suppliers", text: "Prices and stock, side by side" },
  { icon: "cart", title: "One checkout", text: "One payment, many sellers" },
  { icon: "truck", title: "Delivered to site", text: "Pick your delivery window" },
  { icon: "route", title: "Live tracking", text: "Follow every truck to your gate" },
];

export const trustPoints: Perk[] = [
  { icon: "shield", title: "Verified sellers", text: "Every store is checked before it lists" },
  { icon: "lock", title: "Secure payment", text: "Card, bank transfer and GCash" },
  { icon: "camera", title: "Proof of delivery", text: "A signed photo with every drop" },
  { icon: "headset", title: "Real support", text: "6 AM to 6 PM, every day" },
];

export const flashDeal: FlashDeal = {
  title: "Steel month",
  blurb: "Up to 15% off rebar and tie wire from verified sellers.",
  endsAt: "2026-11-30T23:59:59+08:00",
  href: "/categories/steel-rebar",
  image: "/home/products/deformed-rebar-12mm.webp",
};

export const footerColumns = [
  {
    title: "Shop",
    links: [
      { label: "All categories", href: "/categories" },
      { label: "Deals", href: "/deals" },
      { label: "Saved items", href: "/saved" },
      { label: "Track an order", href: "/track" },
    ],
  },
  {
    title: "Sell",
    links: [
      { label: "Sell on MatExpress", href: "/sell" },
      { label: "How selling works", href: "/sell/how-it-works" },
      { label: "Seller support", href: "/sell/support" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "How it works", href: "/how-it-works" },
      { label: "Delivery areas", href: "/help/delivery" },
      { label: "Returns and damage", href: "/help/returns" },
      { label: "Contact us", href: "/help/contact" },
    ],
  },
];
