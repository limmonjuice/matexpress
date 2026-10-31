"use client";

import { useNow } from "@/hooks/use-now";
import { arrivalText } from "@/lib/delivery";
import { usePreferences } from "@/stores/preferences-store";

/** "today", "tomorrow" or "Wed, Nov 4" for the buyer's area. Null until the browser knows the time. */
export function useArrival(leadDays: number) {
  const now = useNow();
  const area = usePreferences((s) => s.area);
  return now ? arrivalText(now, leadDays, area) : null;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Dates, not speeds. The prerendered page says something true until the browser can work out which day. */
export function Arrival({ leadDays, prefix = "Arrives", bare }: { leadDays: number; prefix?: string; bare?: boolean }) {
  const text = useArrival(leadDays);
  if (bare) return <>{capitalize(text ?? "Soon")}</>;
  return (
    <>
      {prefix} {text ?? "soon"}
    </>
  );
}
