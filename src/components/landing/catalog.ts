import type { MaterialIconName } from "./material-icons";

// Static landing-page catalog. Sample items and prices: confirm before launch.

export type CatalogGroup = "Structural" | "Finishing" | "Tools & safety";

export type CatalogItem = {
  id: string;
  name: string;
  spec: string;
  unit: string;
  price: number;
  bulk?: { price: number; minQty: number };
  stock: number;
  delivery: "Ships today" | "Next-day delivery";
  group: CatalogGroup;
  icon: MaterialIconName;
};

export const CATALOG: CatalogItem[] = [
  {
    id: "cement-opc-40",
    name: "Portland Cement Type I",
    spec: "40 kg bag · ASTM C150",
    unit: "bag",
    price: 265,
    bulk: { price: 252, minQty: 100 },
    stock: 1200,
    delivery: "Ships today",
    group: "Structural",
    icon: "cement",
  },
  {
    id: "rebar-12-g40",
    name: "Deformed Rebar 12 mm",
    spec: "Grade 40 · 6 m length",
    unit: "length",
    price: 245,
    bulk: { price: 232, minQty: 200 },
    stock: 2500,
    delivery: "Ships today",
    group: "Structural",
    icon: "rebar",
  },
  {
    id: "chb-4",
    name: "Concrete Hollow Block 4\"",
    spec: "Load-bearing · 40 × 20 cm",
    unit: "piece",
    price: 16.5,
    bulk: { price: 15, minQty: 1000 },
    stock: 15000,
    delivery: "Ships today",
    group: "Structural",
    icon: "chb",
  },
  {
    id: "sand-washed",
    name: "Washed Sand",
    spec: "Screened for concrete and plaster",
    unit: "m³",
    price: 1450,
    stock: 300,
    delivery: "Ships today",
    group: "Structural",
    icon: "rocks",
  },
  {
    id: "gravel-34",
    name: "Crushed Gravel 3/4\"",
    spec: "Angular, washed",
    unit: "m³",
    price: 1750,
    stock: 250,
    delivery: "Ships today",
    group: "Structural",
    icon: "wheelbarrow",
  },
  {
    id: "tie-wire-16",
    name: "Tie Wire #16",
    spec: "Annealed, 25 kg roll available",
    unit: "kg",
    price: 95,
    stock: 600,
    delivery: "Ships today",
    group: "Structural",
    icon: "coil",
  },
  {
    id: "plywood-marine-12",
    name: "Marine Plywood 1/2\"",
    spec: "4 × 8 ft · formwork grade",
    unit: "sheet",
    price: 1150,
    bulk: { price: 1090, minQty: 50 },
    stock: 420,
    delivery: "Next-day delivery",
    group: "Finishing",
    icon: "plank",
  },
  {
    id: "roof-gi-26",
    name: "GI Corrugated Roofing",
    spec: "Gauge 26 · 8 ft sheet",
    unit: "sheet",
    price: 420,
    stock: 700,
    delivery: "Next-day delivery",
    group: "Finishing",
    icon: "roof",
  },
  {
    id: "pipe-upvc-4",
    name: "uPVC Sanitary Pipe 4\"",
    spec: "3 m length · Series 1000",
    unit: "length",
    price: 680,
    stock: 38,
    delivery: "Next-day delivery",
    group: "Finishing",
    icon: "pipe",
  },
  {
    id: "paint-elasto-4l",
    name: "Elastomeric Wall Paint",
    spec: "4 L · exterior, white",
    unit: "can",
    price: 1280,
    stock: 160,
    delivery: "Next-day delivery",
    group: "Finishing",
    icon: "bucket",
  },
  {
    id: "drill-20v",
    name: "Cordless Hammer Drill",
    spec: "20 V · 2 batteries, charger",
    unit: "set",
    price: 6950,
    stock: 24,
    delivery: "Ships today",
    group: "Tools & safety",
    icon: "drill",
  },
  {
    id: "hammer-claw-16",
    name: "Claw Hammer 16 oz",
    spec: "Forged steel · fibreglass handle",
    unit: "piece",
    price: 545,
    stock: 120,
    delivery: "Ships today",
    group: "Tools & safety",
    icon: "hammer",
  },
  {
    id: "hardhat-ansi",
    name: "Safety Hard Hat",
    spec: "ANSI Z89.1 · ratchet fit",
    unit: "piece",
    price: 390,
    bulk: { price: 350, minQty: 20 },
    stock: 340,
    delivery: "Ships today",
    group: "Tools & safety",
    icon: "hardhat",
  },
];

export const catalogById = Object.fromEntries(CATALOG.map((item) => [item.id, item])) as Record<
  string,
  CatalogItem
>;

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

export function formatPeso(value: number) {
  return peso.format(value);
}
