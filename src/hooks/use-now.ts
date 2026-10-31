import { useMemo, useSyncExternalStore } from "react";

const MINUTE = 60_000;

const subscribe = (tick: () => void) => {
  const id = setInterval(tick, MINUTE);
  return () => clearInterval(id);
};
const getMinute = () => Math.floor(Date.now() / MINUTE);
const getServerMinute = () => null;

/**
 * The time, to the minute, once in the browser. Null in the server's markup:
 * pages are prerendered, so a delivery date can only be worked out on arrival.
 */
export function useNow(): Date | null {
  const minute = useSyncExternalStore(subscribe, getMinute, getServerMinute);
  return useMemo(() => (minute === null ? null : new Date(minute * MINUTE)), [minute]);
}
