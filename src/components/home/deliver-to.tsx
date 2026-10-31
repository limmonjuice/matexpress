"use client";

import { deliveryAreas } from "@/lib/delivery";
import { usePreferences } from "@/stores/preferences-store";
import { ChevronDownIcon, PinIcon } from "./icons";

/** Where the buyer's project is. A native select, so phones get their own picker. */
export function DeliverTo({ className }: { className?: string }) {
  const area = usePreferences((s) => s.area);
  const setArea = usePreferences((s) => s.setArea);

  return (
    <label className={`hm-deliver ${className ?? ""}`}>
      <PinIcon />
      <span className="hm-deliver-text">
        <small>Deliver to</small>
        <b>{area}</b>
      </span>
      <ChevronDownIcon className="hm-deliver-chevron" />
      <select aria-label="Delivery area" value={area} onChange={(e) => setArea(e.target.value)}>
        {deliveryAreas.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}
