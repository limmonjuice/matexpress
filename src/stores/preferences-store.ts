import { create } from "zustand";
import { persist } from "zustand/middleware";

type PreferencesState = {
  /** Product slugs the buyer has saved for later. */
  saved: string[];
  /** Where the buyer's project is; deliveries and stock will key off this. */
  area: string;
  toggleSaved: (slug: string) => void;
  setArea: (area: string) => void;
};

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      saved: [],
      area: "Rizal",
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
