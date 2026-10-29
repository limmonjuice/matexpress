import { config } from "dotenv";

config({ path: [".env.local", ".env"], quiet: true });

const sampleProducts = [
  {
    sku: "CEM-OPC-40",
    name: "Portland Cement Type I",
    category: "Cement & Concrete",
    description: "General-purpose ordinary Portland cement for structural concrete and masonry.",
    unit: "40 kg bag",
    price: "265.00",
    stock: 1200,
  },
  {
    sku: "CON-RMX-3K",
    name: "Ready-Mix Concrete 3000 psi",
    category: "Cement & Concrete",
    description: "Pre-batched concrete for slabs, footings, and columns.",
    unit: "cubic meter",
    price: "4850.00",
    stock: 80,
  },
  {
    sku: "AGG-SND-WSH",
    name: "Washed Sand",
    category: "Aggregates",
    description: "Clean, screened sand for concrete mixing and plastering.",
    unit: "cubic meter",
    price: "1450.00",
    stock: 300,
  },
  {
    sku: "AGG-GRV-34",
    name: "Crushed Gravel 3/4\"",
    category: "Aggregates",
    description: "Angular crushed stone for concrete and drainage beds.",
    unit: "cubic meter",
    price: "1750.00",
    stock: 250,
  },
  {
    sku: "STL-RB-10",
    name: "Deformed Rebar 10mm",
    category: "Steel",
    description: "Grade 40 deformed reinforcing bar for slabs and walls.",
    unit: "6 m length",
    price: "185.00",
    stock: 2500,
  },
  {
    sku: "STL-RB-16",
    name: "Deformed Rebar 16mm",
    category: "Steel",
    description: "Grade 60 deformed reinforcing bar for beams and columns.",
    unit: "6 m length",
    price: "495.00",
    stock: 1400,
  },
  {
    sku: "STL-TW-16",
    name: "Tie Wire #16",
    category: "Steel",
    description: "Annealed tie wire for securing rebar intersections.",
    unit: "kg",
    price: "95.00",
    stock: 600,
  },
  {
    sku: "MSN-CHB-4",
    name: "Concrete Hollow Block 4\"",
    category: "Masonry",
    description: "Load-bearing hollow block for interior and exterior walls.",
    unit: "piece",
    price: "16.50",
    stock: 15000,
  },
  {
    sku: "LMB-PLY-12",
    name: "Marine Plywood 1/2\"",
    category: "Lumber & Formwork",
    description: "Water-resistant plywood for formwork and sheathing.",
    unit: "4x8 ft sheet",
    price: "1150.00",
    stock: 420,
  },
  {
    sku: "LMB-CL-2x4",
    name: "Coco Lumber 2x4x10",
    category: "Lumber & Formwork",
    description: "Rough-cut lumber for scaffolding and form bracing.",
    unit: "piece",
    price: "210.00",
    stock: 900,
  },
  {
    sku: "RF-GI-26",
    name: "GI Corrugated Roofing Sheet Ga. 26",
    category: "Roofing",
    description: "Galvanized iron roofing sheet with corrosion-resistant coating.",
    unit: "8 ft sheet",
    price: "420.00",
    stock: 700,
  },
  {
    sku: "HW-CN-4",
    name: "Common Wire Nails 4\"",
    category: "Hardware",
    description: "Bright common nails for framing and formwork.",
    unit: "kg",
    price: "88.00",
    stock: 800,
  },
];

async function main() {
  // Import after env is loaded: the db module reads DATABASE_URL at import time.
  const { db } = await import("./index");
  const { products } = await import("./schema");

  const inserted = await db
    .insert(products)
    .values(sampleProducts)
    .onConflictDoNothing({ target: products.sku })
    .returning({ sku: products.sku });

  console.log(
    `Seeded ${inserted.length} new product(s); ${sampleProducts.length - inserted.length} already existed.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
