"use client";

import { categoryBySlug } from "@/lib/catalog/data/categories";
import { FREE_DELIVERY_OVER } from "@/lib/delivery";
import { formatWeight, loadFor, type Truck } from "@/lib/load";
import { cartWeight, type CartLine } from "@/stores/cart-store";

const BED: Record<Truck["id"], number> = { multicab: 54, elf: 72, six: 88, ten: 108 };
const BED_MAX = 108;
const CAB = 34;
const BED_TOP = 12;
const BED_FLOOR = 44;

/**
 * The cart, as what it really is: one truck, loaded from every seller in the
 * order. Each line is a block in its material's colour, as wide as its share of
 * the weight. The truck gets longer as the load needs a bigger one.
 */
export function LoadTruck({ lines, className }: { lines: CartLine[]; className?: string }) {
  const weight = cartWeight(lines);
  const load = loadFor(weight);
  const bed = BED[load.truck.id];
  const left = BED_MAX - bed + 2;
  const cab = left + bed + 3;

  const inner = bed - 4;
  const height = (BED_FLOOR - BED_TOP - 2) * load.fill;
  const shares = lines.map((line) => Math.max(0.05, (line.weightKg * line.quantity) / (weight || 1)));
  const sum = shares.reduce((a, b) => a + b, 0);
  const widths = shares.map((share) => (share / sum) * inner);

  return (
    <svg
      className={className ?? "hm-truck"}
      viewBox={`0 0 ${BED_MAX + CAB + 10} 58`}
      role="img"
      aria-label={lines.length ? `${load.truck.name} carrying ${formatWeight(weight)}` : "An empty truck"}
    >
      <g className="hm-truck-cargo">
        {lines.map((line, i) => (
          <rect
            key={line.id}
            x={left + 2 + widths.slice(0, i).reduce((a, b) => a + b, 0)}
            y={BED_FLOOR - height}
            width={Math.max(0, widths[i] - 0.7)}
            height={height}
            rx="0.8"
            fill={categoryBySlug(line.categorySlug)?.cargo ?? "#a9a198"}
          />
        ))}
      </g>

      {/* The dropside bed, in front of its load. */}
      <path className="hm-truck-bed" d={`M${left} ${BED_TOP}V${BED_FLOOR}H${left + bed}V${BED_TOP}`} />
      <rect className="hm-truck-chassis" x={left - 1} y={BED_FLOOR} width={bed + CAB + 5} height="4" rx="1" />

      <g style={{ transform: `translateX(${cab}px)` }} className="hm-truck-cab-group">
        <path className="hm-truck-cab" d={`M0 ${BED_FLOOR}V16Q0 14 2 14H16L${CAB - 2} 28V${BED_FLOOR}Z`} />
        <path className="hm-truck-glass" d="M4 18H15L23 28H4Z" />
      </g>

      <Wheel x={left + bed * 0.28} />
      {load.truck.id === "ten" && <Wheel x={left + bed * 0.28 + 15} />}
      <Wheel x={cab + 20} />
    </svg>
  );
}

function Wheel({ x }: { x: number }) {
  return (
    <g className="hm-truck-wheel" style={{ transform: `translateX(${x}px)` }}>
      <circle cy="50" r="7" />
      <circle cy="50" r="2.6" />
    </g>
  );
}

/**
 * The free-delivery meter as a road: the truck drives toward the flag as the
 * order grows, carrying what's been added so far.
 */
export function TruckRoad({ lines, total }: { lines: CartLine[]; total: number }) {
  const progress = Math.min(1, total / FREE_DELIVERY_OVER);
  return (
    <div className="hm-road" data-free={progress >= 1} style={{ "--hm-progress": progress } as React.CSSProperties}>
      <div className="hm-road-truck">
        <LoadTruck lines={lines} />
      </div>
      <svg className="hm-road-flag" viewBox="0 0 24 40" aria-hidden="true">
        <path d="M4 40V3" />
        <path d="M5 3h15l-4 6 4 6H5z" />
      </svg>
    </div>
  );
}
