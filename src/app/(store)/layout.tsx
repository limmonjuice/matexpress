import { StoreShell } from "@/components/home/store-shell";

/** One header and cart across the store, so moving between pages never remounts them. */
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <StoreShell>{children}</StoreShell>;
}
