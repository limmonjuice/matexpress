import { useSyncExternalStore } from "react";

export type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

const ENDED: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };

/** Time from `now` until a fixed date. A past or unreadable date counts as ended. */
export function timeLeft(endsAt: string, now: number): TimeLeft {
  const end = new Date(endsAt).getTime();
  if (Number.isNaN(end) || end <= now) return ENDED;
  const total = Math.floor((end - now) / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    expired: false,
  };
}

const subscribe = (tick: () => void) => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
};
const getSeconds = () => Math.floor(Date.now() / 1000);
const getServerSeconds = () => null;

/**
 * Ticks once a second in the browser. `ready` is false in the server's markup,
 * so the first paint never disagrees with what the browser hydrates.
 */
export function useCountdown(endsAt: string): TimeLeft & { ready: boolean } {
  const seconds = useSyncExternalStore(subscribe, getSeconds, getServerSeconds);
  if (seconds === null) return { ...timeLeft(endsAt, 0), expired: false, ready: false };
  return { ...timeLeft(endsAt, seconds * 1000), ready: true };
}
