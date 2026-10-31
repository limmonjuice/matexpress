import { describe, expect, test } from "vitest";
import { arrivalDate, arrivalText, bookableDays, dayKey, deliveryFee, formatDay, orderArrival } from "./delivery";

const beforeCutoff = new Date("2026-11-02T13:59:00+08:00");
const atCutoff = new Date("2026-11-02T14:00:00+08:00");

describe("arrivalDate", () => {
  test("an order before 2 PM Manila time can arrive the same day", () => {
    expect(formatDay(arrivalDate(beforeCutoff, 0, "Rizal"))).toBe("Mon, Nov 2");
  });

  test("an order at 2 PM or later moves to the next day", () => {
    expect(formatDay(arrivalDate(atCutoff, 0, "Rizal"))).toBe("Tue, Nov 3");
  });

  test("far areas add one day and near ones add none", () => {
    for (const area of ["Metro Manila", "Rizal"]) expect(formatDay(arrivalDate(beforeCutoff, 1, area))).toBe("Tue, Nov 3");
    for (const area of ["Cavite", "Laguna", "Bulacan"]) expect(formatDay(arrivalDate(beforeCutoff, 1, area))).toBe("Wed, Nov 4");
  });

  test("the day is on the Manila calendar, late at night in UTC", () => {
    // 11 PM UTC on Nov 1 is 7 AM on Nov 2 in Manila.
    const now = new Date("2026-11-01T23:00:00Z");
    expect(formatDay(arrivalDate(now, 0, "Rizal"))).toBe("Mon, Nov 2");
    expect(dayKey(now)).toBe("2026-11-02");
  });
});

describe("arrivalText", () => {
  test("says today and tomorrow, then the date", () => {
    expect(arrivalText(beforeCutoff, 0, "Rizal")).toBe("today");
    expect(arrivalText(beforeCutoff, 1, "Rizal")).toBe("tomorrow");
    expect(arrivalText(beforeCutoff, 2, "Rizal")).toBe("Wed, Nov 4");
  });
});

describe("deliveryFee", () => {
  test("depends on the area and is free from the threshold", () => {
    expect(deliveryFee("Rizal", 24999.99)).toBe(800);
    expect(deliveryFee("Rizal", 25000)).toBe(0);
    expect(deliveryFee("Cavite", 100)).toBe(1000);
  });
});

describe("orderArrival", () => {
  const lines = [
    { leadDays: 0, seller: "Tibay Steel" },
    { leadDays: 2, seller: "Bato Aggregates" },
  ];

  test("the slowest seller sets the day and is named", () => {
    const arrival = orderArrival(lines, beforeCutoff, "Rizal")!;
    expect(formatDay(arrival.date)).toBe("Wed, Nov 4");
    expect(arrival.setBy).toBe("Bato Aggregates");
  });

  test("names nobody when every seller is ready together", () => {
    expect(orderArrival([lines[1], { leadDays: 2, seller: "Tibay Steel" }], beforeCutoff, "Rizal")!.setBy).toBeUndefined();
  });

  test("an empty cart has no arrival", () => {
    expect(orderArrival([], beforeCutoff, "Rizal")).toBeUndefined();
  });
});

describe("bookableDays", () => {
  test("starts on the earliest day and runs a week", () => {
    const days = bookableDays(arrivalDate(beforeCutoff, 1, "Rizal"));
    expect(days).toHaveLength(7);
    expect(formatDay(days[0])).toBe("Tue, Nov 3");
    expect(formatDay(days[6])).toBe("Mon, Nov 9");
  });
});
