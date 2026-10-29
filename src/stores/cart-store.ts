import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = {
  id: string;
  name: string;
  unit: string;
  price: number;
  quantity: number;
};

type CartState = {
  lines: CartLine[];
  isOpen: boolean;
  /** Bumped on every add so the cart button can play its pop animation. */
  lastAddedAt: number;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  addMany: (lines: CartLine[]) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
};

function merge(lines: CartLine[], incoming: CartLine): CartLine[] {
  const existing = lines.find((l) => l.id === incoming.id);
  if (!existing) return [...lines, incoming];
  return lines.map((l) =>
    l.id === incoming.id ? { ...l, quantity: l.quantity + incoming.quantity } : l,
  );
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,
      lastAddedAt: 0,
      add: (line, quantity = 1) =>
        set((state) => ({
          lines: merge(state.lines, { ...line, quantity }),
          lastAddedAt: Date.now(),
        })),
      addMany: (incoming) =>
        set((state) => ({
          lines: incoming.reduce(merge, state.lines),
          lastAddedAt: Date.now(),
        })),
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
      // Rehydrated on the client after mount to avoid a server/client mismatch.
      skipHydration: true,
      partialize: (state) => ({ lines: state.lines }),
    },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((sum, l) => sum + l.quantity, 0);
export const cartTotal = (lines: CartLine[]) =>
  lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
