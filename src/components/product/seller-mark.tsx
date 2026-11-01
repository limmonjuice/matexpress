import { sellerInitials } from "@/lib/format";

/** A seller's initials on their own pale colour, so a store is recognisable across the cart and every list. */
export function SellerMark({ name, tint, large }: { name: string; tint?: string; large?: boolean }) {
  return (
    <span className="hm-mark" data-large={large} style={{ background: tint ?? "#ece5dc" }} aria-hidden="true">
      {sellerInitials(name)}
    </span>
  );
}
