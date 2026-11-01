import { ProductCard } from "@/components/home/product-card";
import { listProducts } from "@/lib/catalog";
import { parseListingParams, queryProducts, type ListingScope, type SortKey } from "@/lib/catalog/listing";
import { ListingView } from "./listing-view";
import "./listing.css";

const SORTS: SortKey[] = ["best", "price-asc", "price-desc", "rating", "new"];

/** A desktop row, or about a phone's first screen. */
const FIRST_SCREEN_CARDS = 4;

type Props = {
  pathname: string;
  scope: ListingScope;
  rawParams: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
  defaultSort?: SortKey;
  /** Extra sort orders this list offers, listed first. */
  extraSorts?: SortKey[];
  /** Shown instead of the empty message when the list holds nothing at all before filtering. */
  whenEmpty?: React.ReactNode;
};

/**
 * Any list of products. Reads the URL, so it always sits inside a Suspense boundary.
 * The filters are the client's; the results are worked out here.
 */
export async function Listing({ pathname, scope, rawParams, defaultSort = "best", extraSorts = [], whenEmpty }: Props) {
  const raw = await rawParams;
  const params = parseListingParams(raw, { defaultSort });
  const result = queryProducts(await listProducts(), scope, params);

  if (result.scopeTotal === 0 && whenEmpty) return <>{whenEmpty}</>;

  const { items, ...rest } = result;
  return (
    <ListingView pathname={pathname} params={params} result={rest} shown={items.length} sorts={[...extraSorts, ...SORTS]}>
      {items.map((product, i) => (
        <li key={product.slug} style={{ "--hm-i": i % 12 } as React.CSSProperties}>
          <ProductCard product={product} eager={i < FIRST_SCREEN_CARDS} />
        </li>
      ))}
    </ListingView>
  );
}
