import { describe, expect, test } from "vitest";
import { timeLeft } from "./use-countdown";

const now = new Date("2026-11-01T00:00:00Z").getTime();

describe("timeLeft", () => {
  test("splits the time left into days, hours, minutes and seconds", () => {
    expect(timeLeft("2026-11-02T02:03:04Z", now)).toEqual({ days: 1, hours: 2, minutes: 3, seconds: 4, expired: false });
  });
  test("a past date is ended and never negative", () => {
    expect(timeLeft("2026-10-01T00:00:00Z", now)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
  });
  test("the exact end moment counts as ended", () => {
    expect(timeLeft("2026-11-01T00:00:00Z", now).expired).toBe(true);
  });
  test("an unreadable date counts as ended", () => {
    expect(timeLeft("nope", now).expired).toBe(true);
  });
});
