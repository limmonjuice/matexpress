import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LineData } from "@/lib/catalog/types";
import { lineTotal, priceForQuantity } from "@/lib/pricing";

export type CartLine = LineData & { quantity: number };

type CartState = {
  lines: CartLine[];
  isOpen: boolean;
  /** Bumped on every add so the cart button can play its pop animation. */
  lastAddedAt: number;
  add: (line: LineData, quantity?: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  /** Swaps a line for the same item from another seller, keeping its quantity. */
  replace: (id: string, line: LineData) => void;
  setLines: (lines: CartLine[]) => void;
  remove: (id: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,
      lastAddedAt: 0,
      add: (line, quantity = line.minQty ?? line.step ?? 1) =>
        set((state) => {
          const existing = state.lines.find((l) => l.id === line.id);
          return {
            lastAddedAt: Date.now(),
            lines: existing
              ? state.lines.map((l) => (l.id === line.id ? { ...l, quantity: l.quantity + quantity } : l))
              : [...state.lines, { ...line, quantity }],
          };
        }),
      setQuantity: (id, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.id !== id)
              : state.lines.map((l) => (l.id === id ? { ...l, quantity } : l)),
        })),
      replace: (id, line) =>
        set((state) => {
          const current = state.lines.find((l) => l.id === id);
          if (!current) return state;
          const already = state.lines.find((l) => l.id === line.id);
          if (already) {
            return {
              lines: state.lines
                .filter((l) => l.id !== id)
                .map((l) => (l.id === line.id ? { ...l, quantity: l.quantity + current.quantity } : l)),
            };
          }
          return { lines: state.lines.map((l) => (l.id === id ? { ...line, quantity: current.quantity } : l)) };
        }),
      setLines: (lines) => set({ lines }),
      remove: (id) => set((state) => ({ lines: state.lines.filter((l) => l.id !== id) })),
      clear: () => set({ lines: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    {
      name: "matexpress-cart",
      // Carts saved before lines knew their size, seller and stock can't be checked against the catalog.
      version: 2,
      migrate: () => ({ lines: [] }),
      // Rehydrated on the client after mount to avoid a server/client mismatch.
      skipHydration: true,
      partialize: (state) => ({ lines: state.lines }),
    },
  ),
);

/** Lines, not units: 500 hollow blocks is one thing on the list. */
export const cartCount = (lines: CartLine[]) => lines.length;

export const lineCost = (line: CartLine) => lineTotal(priceForQuantity(line, line.quantity), line.quantity);

export const cartTotal = (lines: CartLine[]) => lines.reduce((sum, line) => lineTotal(sum + lineCost(line), 1), 0);

export const cartWeight = (lines: CartLine[]) => lines.reduce((sum, line) => sum + line.weightKg * line.quantity, 0);

/** The cart as the truck collects it: one group per seller, in the order they were added. */
export function groupBySeller(lines: CartLine[]) {
  const groups = new Map<string, { sellerSlug: string; seller: string; lines: CartLine[] }>();
  for (const line of lines) {
    const group = groups.get(line.sellerSlug) ?? { sellerSlug: line.sellerSlug, seller: line.seller, lines: [] };
    group.lines.push(line);
    groups.set(line.sellerSlug, group);
  }
  return [...groups.values()];
}
