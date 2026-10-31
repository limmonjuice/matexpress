"use client";

import { useEffect } from "react";
import { useCartStore } from "@/stores/cart-store";
import { usePreferences } from "@/stores/preferences-store";

/**
 * Loads the saved cart and preferences after mount, so the server's markup always matches.
 * Then keeps up with other tabs: each saves its whole list, so a tab that hadn't heard about
 * another's add would wipe it on its own next change.
 */
export function StoreHydrator() {
  useEffect(() => {
    // No `persist` means this browser blocks storage. The stores still work, for this page's life.
    const stores = [useCartStore.persist, usePreferences.persist];
    stores.forEach((store) => store?.rehydrate());

    const onStorage = (event: StorageEvent) => {
      stores.forEach((store) => {
        if (store && (event.key === null || event.key === store.getOptions().name)) store.rehydrate();
      });
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return null;
}
