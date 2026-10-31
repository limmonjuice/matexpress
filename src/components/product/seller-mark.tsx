import { sellerBySlug, sellerInitials } from "@/lib/catalog/data/sellers";

/** A seller's initials on their own pale colour, so a store is recognisable across the cart and every list. */
export function SellerMark({ slug, name, large }: { slug: string; name: string; large?: boolean }) {
  return (
    <span className="hm-mark" data-large={large} style={{ background: sellerBySlug(slug)?.tint ?? "#ece5dc" }} aria-hidden="true">
      {sellerInitials(name)}
    </span>
  );
}
