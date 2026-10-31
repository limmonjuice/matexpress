import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_AREA } from "@/lib/delivery";

type PreferencesState = {
  /** Product slugs the buyer has saved for later. */
  saved: string[];
  /** Where the buyer's project is. Delivery fees and dates key off this. */
  area: string;
  toggleSaved: (slug: string) => void;
  setArea: (area: string) => void;
};

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      saved: [],
      area: DEFAULT_AREA,
      toggleSaved: (slug) =>
        set((state) => ({
          saved: state.saved.includes(slug) ? state.saved.filter((s) => s !== slug) : [...state.saved, slug],
        })),
      setArea: (area) => set({ area }),
    }),
    {
      name: "matexpress-preferences",
      // Rehydrated on the client after mount to avoid a server/client mismatch.
      skipHydration: true,
    },
  ),
);
