import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = {
  id: string;
  name: string;
  unit: string;
  price: number;
  quantity: number;
  image?: string;
  seller?: string;
};

type CartState = {
  lines: CartLine[];
  isOpen: boolean;
  /** Bumped on every add so the cart button can play its pop animation. */
  lastAddedAt: number;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (id: string, quantity: number) => void;
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
      add: (line, quantity = 1) =>
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
      remove: (id) => set((state) => ({ lines: state.lines.filter((l) => l.id !== id) })),
      clear: () => set({ lines: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    {
      name: "matexpress-cart",
      // Carts saved by the old landing page hold item IDs and prices that no longer exist.
      version: 1,
      migrate: () => ({ lines: [] }),
      // Rehydrated on the client after mount to avoid a server/client mismatch.
      skipHydration: true,
      partialize: (state) => ({ lines: state.lines }),
    },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((sum, l) => sum + l.quantity, 0);
export const cartTotal = (lines: CartLine[]) =>
  lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
