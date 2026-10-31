// What a buyer sees of an order's progress. Pure: the page passes in the order, its events and the time.

export type EventType = "placed" | "seller-confirmed" | "collecting" | "on-the-way" | "delivered";

export type TrackedEvent = { type: EventType; sellerSlug?: string | null; at: Date };

export const STAGES = ["Placed", "Sellers confirming", "Collecting", "On the way", "Delivered"] as const;

export type TrackingView = {
  /** Index into STAGES of the stage the order is at. */
  stage: number;
  confirmed: number;
  sellerCount: number;
  history: { at: Date; text: string }[];
  delivered: boolean;
};

export function trackingView(events: TrackedEvent[], sellers: { slug: string; name: string }[]): TrackingView {
  const sorted = [...events].sort((a, b) => a.at.getTime() - b.at.getTime());
  const nameOf = (slug?: string | null) => sellers.find((s) => s.slug === slug)?.name ?? "A seller";
  const has = (type: EventType) => sorted.some((e) => e.type === type);
  const confirmed = new Set(sorted.filter((e) => e.type === "seller-confirmed").map((e) => e.sellerSlug)).size;

  const stage = has("delivered") ? 4 : has("on-the-way") ? 3 : has("collecting") ? 2 : has("placed") ? 1 : 0;

  const text: Record<EventType, (e: TrackedEvent) => string> = {
    placed: () => "Order placed and sent to the sellers",
    "seller-confirmed": (e) => `${nameOf(e.sellerSlug)} confirmed your items`,
    collecting: () => "Our truck is collecting from the sellers",
    "on-the-way": () => "Loaded and on the way to your site",
    delivered: () => "Delivered to your site",
  };

  return {
    stage,
    confirmed,
    sellerCount: sellers.length,
    history: sorted.map((e) => ({ at: e.at, text: text[e.type](e) })).reverse(),
    delivered: has("delivered"),
  };
}

const MINUTE = 60_000;

/**
 * Sellers and drivers don't have their side of the system yet, so nothing can
 * really advance an order. With ORDER_TIMELINE=demo this plays out the steps by
 * the clock, so the tracking page can be seen working. It must stay off for real
 * customers, who should never read invented progress.
 */
export function demoEvents(placedAt: Date, sellers: { slug: string }[], now: Date): TrackedEvent[] {
  const at = (minutes: number) => new Date(placedAt.getTime() + minutes * MINUTE);
  const steps: TrackedEvent[] = [
    ...sellers.map((seller, i) => ({ type: "seller-confirmed" as const, sellerSlug: seller.slug, at: at(1 + i) })),
    { type: "collecting", at: at(sellers.length + 2) },
    { type: "on-the-way", at: at(sellers.length + 5) },
    { type: "delivered", at: at(sellers.length + 10) },
  ];
  return steps.filter((step) => step.at <= now);
}

export const demoTimelineOn = () => process.env.ORDER_TIMELINE === "demo";
