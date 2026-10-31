"use client";

import { useEffect } from "react";
import { useCartStore } from "@/stores/cart-store";
import { usePreferences } from "@/stores/preferences-store";

/** Loads the saved cart and preferences after mount, so the server's markup always matches. */
export function StoreHydrator() {
  useEffect(() => {
    useCartStore.persist.rehydrate();
    usePreferences.persist.rehydrate();
  }, []);
  return null;
}
