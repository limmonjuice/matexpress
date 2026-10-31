// How MatExpress delivers. Sample terms: confirm the fees, areas and cut-off before launch.

export const deliveryAreas = ["Metro Manila", "Rizal", "Cavite", "Laguna", "Bulacan"];

export const DEFAULT_AREA = "Rizal";

/** The free-delivery threshold shown in the announcement bar and in the cart. */
export const FREE_DELIVERY_OVER = 25000;

/** Orders from this hour (Manila time) count as the next day's. */
export const CUTOFF_HOUR = 14;

const TIME_ZONE = "Asia/Manila";
const DAY_MS = 86_400_000;

const FEES: Record<string, number> = {
  "Metro Manila": 800,
  Rizal: 800,
  Cavite: 1000,
  Laguna: 1000,
  Bulacan: 1000,
};

const EXTRA_DAYS: Record<string, number> = { Cavite: 1, Laguna: 1, Bulacan: 1 };

const hourFormat = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, hour: "numeric", hourCycle: "h23" });
const dayFormat = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, weekday: "short", month: "short", day: "numeric" });
const keyFormat = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

export const areaFee = (area: string) => (Object.hasOwn(FEES, area) ? FEES[area] : 1000);

/** One fee per order, however many sellers the truck collects from. */
export function deliveryFee(area: string, subtotal: number) {
  return subtotal >= FREE_DELIVERY_OVER ? 0 : areaFee(area);
}

export function arrivalDate(now: Date, leadDays: number, area: string): Date {
  const afterCutoff = Number(hourFormat.format(now)) >= CUTOFF_HOUR;
  const days = leadDays + (afterCutoff ? 1 : 0) + (Object.hasOwn(EXTRA_DAYS, area) ? EXTRA_DAYS[area] : 0);
  return new Date(now.getTime() + days * DAY_MS);
}

/** "Tue, Nov 3", on the Manila calendar whatever the browser's zone. */
export const formatDay = (date: Date) => dayFormat.format(date);

/** "2026-11-03" on the Manila calendar, for comparing days and for order records. */
export const dayKey = (date: Date) => keyFormat.format(date);

/** "today", "tomorrow" or the date: dates, not speeds, but nobody needs today's date read back to them. */
export function arrivalText(now: Date, leadDays: number, area: string) {
  const date = arrivalDate(now, leadDays, area);
  if (dayKey(date) === dayKey(now)) return "today";
  if (dayKey(date) === dayKey(new Date(now.getTime() + DAY_MS))) return "tomorrow";
  return formatDay(date);
}

/** Everything arrives on one truck, so the slowest seller sets the day. */
export function orderArrival<T extends { leadDays: number; seller: string }>(lines: T[], now: Date, area: string) {
  const slowest = lines.reduce<T | undefined>((worst, line) => (!worst || line.leadDays > worst.leadDays ? line : worst), undefined);
  if (!slowest) return undefined;
  const allSame = lines.every((line) => line.leadDays === slowest.leadDays);
  return { date: arrivalDate(now, slowest.leadDays, area), setBy: allSame ? undefined : slowest.seller };
}

/** The delivery days a buyer can book: the first possible day and the six after it. */
export function bookableDays(earliest: Date, count = 7) {
  return Array.from({ length: count }, (_, i) => new Date(earliest.getTime() + i * DAY_MS));
}

export const DELIVERY_WINDOWS = ["8 AM to 12 NN", "1 PM to 5 PM"];

const WINDOW_END_HOUR: Record<string, number> = { "8 AM to 12 NN": 12, "1 PM to 5 PM": 17 };

/** How long a truck needs from the last order to the site. It lines up with the cut-off: the last window of the day closes at 2 PM. */
export const WINDOW_NOTICE_HOURS = 3;

/** The windows that can still be met on a day. Later days have them all; today's close before they end. */
export function openWindows(deliveryDate: string, now: Date) {
  if (deliveryDate !== dayKey(now)) return DELIVERY_WINDOWS;
  const hour = Number(hourFormat.format(now));
  return DELIVERY_WINDOWS.filter((window) => WINDOW_END_HOUR[window] - hour > WINDOW_NOTICE_HOURS);
}
