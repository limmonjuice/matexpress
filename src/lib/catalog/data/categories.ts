import type { Category } from "../types";

// Sample content. No product data here: client components import this file.

export const categories: Category[] = [
  {
    slug: "cement-concrete",
    name: "Cement & Concrete",
    blurb: "Bagged cement, premixed mortar and the additives that keep a pour on schedule.",
    subcategories: ["Portland cement", "Mortar and grout", "Concrete additives", "Waterproofing"],
    image: "/home/categories/cement-concrete.webp",
    featured: true,
    filters: [
      { key: "type", label: "Type" },
      { key: "pack", label: "Pack size" },
    ],
    field: "#dcd7cd",
    fieldInk: "dark",
    cargo: "#b6b1a7",
  },
  {
    slug: "steel-rebar",
    name: "Steel & Rebar",
    blurb: "Deformed bars, tie wire, angle bars, pipes and mesh, cut to standard lengths.",
    subcategories: ["Deformed rebar", "Tie wire", "Angle bars", "Steel pipes", "Wire mesh", "Purlins"],
    image: "/home/categories/steel-rebar.webp",
    featured: true,
    filters: [
      { key: "size", label: "Size" },
      { key: "grade", label: "Grade" },
      { key: "length", label: "Length" },
    ],
    field: "#131925",
    fieldInk: "light",
    cargo: "#3f4958",
  },
  {
    slug: "sand-gravel",
    name: "Sand & Gravel",
    blurb: "Sold by the cubic metre and delivered by the truckload, straight to your site.",
    subcategories: ["Washed sand", "Crushed gravel", "Filling materials"],
    image: "/home/categories/sand-gravel.webp",
    featured: true,
    filters: [
      { key: "grading", label: "Grading" },
      { key: "use", label: "Best for" },
    ],
    field: "#ecdcc0",
    fieldInk: "dark",
    cargo: "#d9bd8c",
  },
  {
    slug: "lumber-plywood",
    name: "Lumber & Plywood",
    blurb: "Formwork ply, coco lumber and ceiling board, from the yards closest to your site.",
    subcategories: ["Marine plywood", "Coco lumber", "Phenolic board", "Ceiling board"],
    image: "/home/categories/lumber-plywood.webp",
    featured: true,
    filters: [
      { key: "thickness", label: "Thickness" },
      { key: "material", label: "Material" },
    ],
    field: "#e5c9a4",
    fieldInk: "dark",
    cargo: "#c0935f",
  },
  {
    slug: "roofing",
    name: "Roofing",
    blurb: "Corrugated and long-span sheets, gutters and the fasteners that hold them down.",
    subcategories: ["GI corrugated sheets", "Long-span roofing", "Gutters", "Roof fasteners"],
    image: "/home/categories/roofing.webp",
    featured: true,
    filters: [
      { key: "gauge", label: "Gauge" },
      { key: "length", label: "Length" },
    ],
    field: "#d5dbe2",
    fieldInk: "dark",
    cargo: "#94a1b0",
  },
  {
    slug: "plumbing",
    name: "Plumbing",
    blurb: "Sanitary pipe, fittings, water tanks and fixtures, from rough-in to the last faucet.",
    subcategories: ["uPVC pipes", "Fittings", "Water tanks", "Faucets", "Sanitary ware"],
    image: "/home/categories/plumbing.webp",
    featured: true,
    filters: [
      { key: "size", label: "Size" },
      { key: "material", label: "Material" },
    ],
    field: "#d7e3e6",
    fieldInk: "dark",
    cargo: "#dfe6e8",
  },
  {
    slug: "electrical",
    name: "Electrical",
    blurb: "Wire by the box, breakers, conduit and the fixtures that finish the job.",
    subcategories: ["THHN wire", "Breakers and panels", "Conduit", "Switches and outlets", "Lighting"],
    image: "/home/categories/electrical.webp",
    featured: true,
    filters: [
      { key: "size", label: "Size" },
      { key: "type", label: "Type" },
    ],
    field: "#faa363",
    fieldInk: "dark",
    cargo: "#f48b3e",
  },
  {
    slug: "tools-safety",
    name: "Tools & Safety",
    blurb: "Power tools, scaffolding and the gear your crew should never start without.",
    subcategories: ["Power tools", "Hard hats", "Gloves and boots", "Scaffolding"],
    image: "/home/categories/tools-safety.webp",
    featured: true,
    filters: [
      { key: "type", label: "Type" },
      { key: "power", label: "Power" },
    ],
    field: "#2a3240",
    fieldInk: "light",
    cargo: "#20262f",
  },
  {
    slug: "masonry",
    name: "Masonry",
    blurb: "Hollow blocks, bricks and pavers, priced lower the more you lay.",
    subcategories: ["Hollow blocks", "Bricks", "Pavers"],
    image: "/home/categories/masonry.webp",
    filters: [
      { key: "size", label: "Size" },
      { key: "type", label: "Type" },
    ],
    field: "#d9cfc3",
    fieldInk: "dark",
    cargo: "#a9a198",
  },
  {
    slug: "paint",
    name: "Paint",
    blurb: "Exterior and interior coats, primers and the rollers to put them on.",
    subcategories: ["Wall paint", "Primers", "Brushes and rollers"],
    image: "/home/categories/paint.webp",
    filters: [
      { key: "finish", label: "Finish" },
      { key: "size", label: "Can size" },
    ],
    field: "#f5cba9",
    fieldInk: "dark",
    cargo: "#faa363",
  },
  {
    slug: "tiles",
    name: "Tiles",
    blurb: "Floor and wall tile by the box, with the adhesive to set them.",
    subcategories: ["Floor tiles", "Tile adhesive"],
    image: "/home/categories/tiles.webp",
    filters: [
      { key: "size", label: "Size" },
      { key: "room", label: "Best for" },
    ],
    field: "#ebe4d8",
    fieldInk: "dark",
    cargo: "#cfc5b6",
  },
  {
    slug: "hardware",
    name: "Hardware",
    blurb: "Nails, bolts and anchors, by the kilo or by the box.",
    subcategories: ["Nails and screws", "Bolts and anchors"],
    image: "/home/categories/hardware.webp",
    filters: [
      { key: "size", label: "Size" },
      { key: "material", label: "Material" },
    ],
    field: "#c9c4bb",
    fieldInk: "dark",
    cargo: "#5b6472",
  },
];

const bySlug = new Map(categories.map((c) => [c.slug, c]));

export const categoryBySlug = (slug: string) => bySlug.get(slug);

export const featuredCategories = categories.filter((c) => c.featured);

/** The short list of categories in the bar under the header. */
export const quickCategories = categories.slice(0, 7);

/** A subcategory's listing: the category's page, narrowed to that subcategory. */
export const subcategoryHref = (categorySlug: string, name: string) =>
  `/categories/${categorySlug}?sub=${encodeURIComponent(name).replace(/%20/g, "+")}`;
