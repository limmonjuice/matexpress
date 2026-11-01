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

export type NextStep = { type: Exclude<EventType, "placed">; sellerSlug?: string; label: string };

/** What can happen to an order next, in the order it really happens: every seller confirms, then the truck collects, leaves and delivers. */
export function nextSteps(events: { type: string; sellerSlug?: string | null }[], sellers: { slug: string; name: string }[]): NextStep[] {
  const has = (type: EventType) => events.some((e) => e.type === type);
  if (has("delivered")) return [];

  const waiting = sellers.filter((seller) => !events.some((e) => e.type === "seller-confirmed" && e.sellerSlug === seller.slug));
  if (waiting.length) return waiting.map((seller) => ({ type: "seller-confirmed", sellerSlug: seller.slug, label: `${seller.name} confirms` }));

  if (!has("collecting")) return [{ type: "collecting", label: "Truck starts collecting" }];
  if (!has("on-the-way")) return [{ type: "on-the-way", label: "Truck leaves for the site" }];
  return [{ type: "delivered", label: "Truck delivers" }];
}

/**
 * Sellers and drivers don't have their side of the system yet, so nothing else can
 * advance an order. With ORDER_TIMELINE=demo the order page offers the next steps as
 * buttons. It must stay off for real customers, who should never read invented progress.
 */
export const demoTimelineOn = () => process.env.ORDER_TIMELINE === "demo";
