// Which truck a load needs. The names are what contractors here already call them.

export type Truck = { id: "multicab" | "elf" | "six" | "ten"; name: string; capacityKg: number };

export const TRUCKS: Truck[] = [
  { id: "multicab", name: "Multicab", capacityKg: 500 },
  { id: "elf", name: "Elf truck", capacityKg: 3000 },
  { id: "six", name: "6-wheeler", capacityKg: 8000 },
  { id: "ten", name: "10-wheeler", capacityKg: 15000 },
];

export type Load = {
  truck: Truck;
  trips: number;
  /** How full the truck looks, from 0 to 1. Never quite empty, so a small load still shows. */
  fill: number;
  /** The site must be able to take this truck. */
  needsAccess: boolean;
};

export function loadFor(weightKg: number): Load {
  const biggest = TRUCKS[TRUCKS.length - 1];
  const truck = TRUCKS.find((t) => weightKg <= t.capacityKg) ?? biggest;
  const trips = Math.max(1, Math.ceil(weightKg / biggest.capacityKg));
  const lastTrip = weightKg - (trips - 1) * biggest.capacityKg;
  const fill = trips > 1 ? lastTrip / biggest.capacityKg : weightKg / truck.capacityKg;
  return {
    truck,
    trips,
    fill: weightKg <= 0 ? 0 : Math.min(1, Math.max(0.08, fill)),
    needsAccess: truck.id === "six" || truck.id === "ten",
  };
}

export const formatWeight = (kg: number) => {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1).replace(/\.0$/, "")} t`;
  return `${kg < 10 ? Number(kg.toFixed(1)) : Math.round(kg)} kg`;
};
