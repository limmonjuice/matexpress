import { isDemoSite } from "@/lib/site-mode";

/**
 * So nobody takes sample sellers, prices and reviews for a real store, or types in their own address
 * and mobile: a demo has no privacy policy to cover them.
 */
export function DemoNotice() {
  if (!isDemoSite()) return null;
  return (
    <aside className="hm-demo-notice" aria-label="About this site">
      Demo only: sample sellers, prices and reviews, and no money is taken. Please use made-up details.
    </aside>
  );
}
