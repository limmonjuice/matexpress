import { afterEach, describe, expect, test, vi } from "vitest";
import { demoTimelineOn, nextSteps, trackingView } from "./tracking";

const sellers = [
  { slug: "tibay-steel", name: "Tibay Steel" },
  { slug: "bato-aggregates", name: "Bato Aggregates" },
];
const at = (minutes: number) => new Date(Date.UTC(2026, 10, 2, 1, minutes));

describe("trackingView", () => {
  test("a new order is waiting on its sellers", () => {
    const view = trackingView([{ type: "placed", at: at(0) }], sellers);
    expect(view).toMatchObject({ stage: 1, confirmed: 0, sellerCount: 2, delivered: false });
  });

  test("counts sellers who have confirmed, once each", () => {
    const view = trackingView(
      [
        { type: "placed", at: at(0) },
        { type: "seller-confirmed", sellerSlug: "tibay-steel", at: at(1) },
        { type: "seller-confirmed", sellerSlug: "tibay-steel", at: at(2) },
      ],
      sellers,
    );
    expect(view.confirmed).toBe(1);
    expect(view.stage).toBe(1);
  });

  test("moves through collecting and on the way to delivered", () => {
    const events = [{ type: "placed" as const, at: at(0) }];
    expect(trackingView([...events, { type: "collecting", at: at(3) }], sellers).stage).toBe(2);
    expect(trackingView([...events, { type: "on-the-way", at: at(5) }], sellers).stage).toBe(3);
    const done = trackingView([...events, { type: "delivered", at: at(9) }], sellers);
    expect(done.stage).toBe(4);
    expect(done.delivered).toBe(true);
  });

  test("history reads newest first, with seller names", () => {
    const { history } = trackingView(
      [
        { type: "placed", at: at(0) },
        { type: "seller-confirmed", sellerSlug: "bato-aggregates", at: at(1) },
      ],
      sellers,
    );
    expect(history[0].text).toBe("Bato Aggregates confirmed your items");
    expect(history[1].text).toMatch(/placed/);
  });
});

describe("nextSteps", () => {
  const placed = { type: "placed" };
  const confirmed = (slug: string) => ({ type: "seller-confirmed", sellerSlug: slug });
  const bothConfirmed = [placed, confirmed("tibay-steel"), confirmed("bato-aggregates")];
  const types = (events: { type: string; sellerSlug?: string }[]) => nextSteps(events, sellers).map((step) => step.type);

  test("a new order waits on every seller, and nothing else can happen yet", () => {
    expect(nextSteps([placed], sellers)).toEqual([
      { type: "seller-confirmed", sellerSlug: "tibay-steel", label: "Tibay Steel confirms" },
      { type: "seller-confirmed", sellerSlug: "bato-aggregates", label: "Bato Aggregates confirms" },
    ]);
  });

  test("one seller confirming leaves the other", () => {
    expect(nextSteps([placed, confirmed("tibay-steel")], sellers).map((step) => step.sellerSlug)).toEqual(["bato-aggregates"]);
  });

  test("then the truck collects, leaves and delivers, one at a time", () => {
    expect(types(bothConfirmed)).toEqual(["collecting"]);
    expect(types([...bothConfirmed, { type: "collecting" }])).toEqual(["on-the-way"]);
    expect(types([...bothConfirmed, { type: "collecting" }, { type: "on-the-way" }])).toEqual(["delivered"]);
  });

  test("a delivered order has nothing left to do", () => {
    expect(types([...bothConfirmed, { type: "collecting" }, { type: "on-the-way" }, { type: "delivered" }])).toEqual([]);
  });

  test("an order with one seller goes straight on after they confirm", () => {
    expect(nextSteps([placed, confirmed("tibay-steel")], [sellers[0]]).map((step) => step.type)).toEqual(["collecting"]);
  });
});

describe("demoTimelineOn", () => {
  afterEach(() => vi.unstubAllEnvs());

  test("only when switched on", () => {
    vi.stubEnv("ORDER_TIMELINE", "");
    expect(demoTimelineOn()).toBe(false);
    vi.stubEnv("ORDER_TIMELINE", "demo");
    expect(demoTimelineOn()).toBe(true);
  });
});
