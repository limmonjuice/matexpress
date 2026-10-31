import { describe, expect, test } from "vitest";
import { areaFee, arrivalDate, arrivalText, bookableDays, dayKey, deliveryFee, formatDay, openWindows, orderArrival } from "./delivery";

const beforeCutoff = new Date("2026-11-02T13:59:00+08:00");
const atCutoff = new Date("2026-11-02T14:00:00+08:00");

describe("an area named after something every object has", () => {
  test("costs the far-area fee and no extra days, rather than breaking the sums", () => {
    expect(areaFee("constructor")).toBe(1000);
    expect(deliveryFee("__proto__", 100)).toBe(1000);
    expect(Number.isNaN(arrivalDate(new Date("2026-11-02T09:00:00+08:00"), 1, "constructor").getTime())).toBe(false);
  });
});

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

describe("openWindows", () => {
  const at = (time: string) => new Date(`2026-11-02T${time}:00+08:00`);

  test("today's windows close three hours before they end", () => {
    expect(openWindows("2026-11-02", at("08:59"))).toEqual(["8 AM to 12 NN", "1 PM to 5 PM"]);
    expect(openWindows("2026-11-02", at("09:00"))).toEqual(["1 PM to 5 PM"]);
    expect(openWindows("2026-11-02", at("13:59"))).toEqual(["1 PM to 5 PM"]);
  });

  test("any day today can still be booked has a window left", () => {
    // The last window closes exactly when today stops being bookable.
    expect(dayKey(arrivalDate(at("13:59"), 0, "Rizal"))).toBe("2026-11-02");
    expect(openWindows("2026-11-02", at("13:59"))).not.toEqual([]);
    expect(dayKey(arrivalDate(at("14:00"), 0, "Rizal"))).toBe("2026-11-03");
    expect(openWindows("2026-11-02", at("14:00"))).toEqual([]);
  });

  test("a later day has them all, whatever the time", () => {
    expect(openWindows("2026-11-03", at("16:00"))).toEqual(["8 AM to 12 NN", "1 PM to 5 PM"]);
  });

  test("it's Manila's clock, not the server's", () => {
    // 1:30 AM in UTC is 9:30 AM in Manila, on the same date.
    expect(openWindows("2026-11-02", new Date("2026-11-02T01:30:00Z"))).toEqual(["1 PM to 5 PM"]);
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
