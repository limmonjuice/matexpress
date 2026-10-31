"use client";

import { useNow } from "@/hooks/use-now";
import { arrivalDate, areaFee, deliveryAreas, formatDay, FREE_DELIVERY_OVER } from "@/lib/delivery";
import { formatPeso } from "@/lib/format";
import { usePreferences } from "@/stores/preferences-store";

/** The answer most people came for, worked out for their own area and the time right now. */
export function DeliveryChecker() {
  const area = usePreferences((s) => s.area);
  const setArea = usePreferences((s) => s.setArea);
  const now = useNow();

  return (
    <div className="hm-checker">
      <label>
        Deliver to
        <select value={area} onChange={(e) => setArea(e.target.value)}>
          {deliveryAreas.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      </label>
      <dl>
        <div>
          <dt>Order now, in stock today</dt>
          <dd>{now ? formatDay(arrivalDate(now, 0, area)) : "Today"}</dd>
        </div>
        <div>
          <dt>Delivery fee</dt>
          <dd>{formatPeso(areaFee(area))}</dd>
        </div>
        <div>
          <dt>Free from</dt>
          <dd>{formatPeso(FREE_DELIVERY_OVER)}</dd>
        </div>
      </dl>
    </div>
  );
}
