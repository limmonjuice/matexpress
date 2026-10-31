import type { Job } from "../types";

// Sample collections: what a crew usually needs for one job on site. A list to shop from, not a calculator.

export const jobs: Job[] = [
  {
    slug: "pouring-a-slab",
    name: "Pouring a slab",
    blurb: "Cement, sand and gravel for the mix, rebar and wire for the steel, and plywood for the forms.",
    drawing: "slab",
    products: ["portland-cement", "washed-sand", "crushed-gravel", "deformed-rebar", "tie-wire", "wire-mesh", "marine-plywood", "coco-lumber", "concrete-plasticizer"],
  },
  {
    slug: "laying-a-wall",
    name: "Laying a wall",
    blurb: "Hollow blocks and vertical bars, with masonry cement and sand for the mortar and plaster.",
    drawing: "wall",
    products: ["hollow-block", "masonry-cement", "premixed-mortar", "washed-sand", "deformed-rebar", "tie-wire", "clay-brick"],
  },
  {
    slug: "roofing-a-house",
    name: "Roofing a house",
    blurb: "Purlins to carry it, sheets to cover it, and the screws and gutters to finish it.",
    drawing: "roof",
    products: ["c-purlin", "angle-bar", "gi-roofing-sheet", "long-span-roofing", "tekscrew", "roof-gutter", "fiber-cement-board"],
  },
  {
    slug: "wiring-a-house",
    name: "Wiring a house",
    blurb: "Conduit in the walls, wire by the box, breakers for the panel and fixtures for the last day.",
    drawing: "wiring",
    products: ["pvc-conduit", "thhn-wire", "circuit-breaker", "wall-switch", "led-bulb"],
  },
  {
    slug: "plumbing-rough-in",
    name: "Plumbing rough-in",
    blurb: "Sanitary pipe and elbows under the slab, a tank on the roof and fixtures to finish.",
    drawing: "plumbing",
    products: ["upvc-pipe", "pvc-elbow", "water-tank", "brass-faucet", "toilet-bowl"],
  },
  {
    slug: "finishing-walls-and-floors",
    name: "Finishing walls and floors",
    blurb: "Waterproofing first, then primer and paint for the walls, and tile and adhesive for the floors.",
    drawing: "finishing",
    products: ["waterproofing-cement", "masonry-primer", "elastomeric-wall-paint", "paint-roller", "floor-tile", "tile-adhesive"],
  },
];

const bySlug = new Map(jobs.map((j) => [j.slug, j]));

export const jobBySlug = (slug: string) => bySlug.get(slug);
