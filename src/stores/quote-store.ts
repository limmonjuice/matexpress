import { create } from "zustand";
import { persist } from "zustand/middleware";

type QuoteItem = {
  productId: number;
  name: string;
  quantity: number;
};

type QuoteState = {
  items: QuoteItem[];
  add: (item: Omit<QuoteItem, "quantity">) => void;
  remove: (productId: number) => void;
  clear: () => void;
};

export const useQuoteStore = create<QuoteState>()(
  persist(
    (set) => ({
      items: [],
      add: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        }),
      remove: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [] }),
    }),
    // Rehydrated on the client after mount to avoid a server/client mismatch.
    { name: "matexpress-quote", skipHydration: true },
  ),
);
