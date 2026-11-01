import { StoreShell } from "@/components/home/store-shell";

// A link only ever prefetches what's the same for everyone. The header links to /account and /track from
// every page, and those read cookies: without this, each page view wakes the server twice for nothing.
export const ensureStatic = "shell";

/** One header and cart across the store, so moving between pages never remounts them. */
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <StoreShell>{children}</StoreShell>;
}
