import { useCallback, useSyncExternalStore } from "react";

/** Persisted stores have no `persist` where there is no storage to load from: the server, or a browser that blocks it. */
type Persisted = {
  persist?: {
    hasHydrated: () => boolean;
    onFinishHydration: (listener: () => void) => () => void;
  };
};

const never = () => false;

/** Whether a saved store has loaded yet. False in the server's markup, so nothing flashes "empty" before it does. */
export function useHydrated(store: Persisted) {
  const subscribe = useCallback((listener: () => void) => store.persist?.onFinishHydration(listener) ?? (() => {}), [store]);
  const hydrated = useCallback(() => store.persist?.hasHydrated() ?? true, [store]);
  return useSyncExternalStore(subscribe, hydrated, never);
}
